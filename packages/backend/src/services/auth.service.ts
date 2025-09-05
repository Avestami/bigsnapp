import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserRepository } from '../db/repositories/user.repository';
import { User, UserType } from '@prisma/client';

export interface RegisterInput {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  userType: UserType;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  userType: UserType;
}

export interface JwtPayload {
  userId: number;
  email: string;
  userType: UserType;
  tokenType: 'access' | 'refresh';
}

export class AuthService {
  private userRepository: UserRepository;
  private jwtSecret: string;
  private jwtRefreshSecret: string;
  private jwtExpiresIn: string;
  private jwtRefreshExpiresIn: string;

  constructor() {
    this.userRepository = new UserRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  async register(input: RegisterInput): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUserByEmail = await this.userRepository.findByEmail(input.email);
    if (existingUserByEmail) {
      throw new Error('User with this email already exists');
    }

    const existingUserByPhone = await this.userRepository.findByPhoneNumber(input.phoneNumber);
    if (existingUserByPhone) {
      throw new Error('User with this phone number already exists');
    }

    // Hash password
    const hashedPassword = await this.hashPassword(input.password);

    // Create user
    const user = await this.userRepository.create({
      name: input.name,
      email: input.email,
      phoneNumber: input.phoneNumber,
      passwordHash: hashedPassword,
      userType: input.userType,
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.mapUserToAuthUser(user),
      tokens,
    };
  }

  async login(input: LoginInput): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // User is active by default (no isActive field in schema)

    // Verify password
    if (!user.passwordHash) {
      throw new Error('User has no password set');
    }
    const isPasswordValid = await this.verifyPassword(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: this.mapUserToAuthUser(user),
      tokens,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.jwtRefreshSecret) as JwtPayload;
      
      if (payload.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Find user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async verifyAccessToken(accessToken: string): Promise<AuthUser> {
    try {
      // Verify access token
      const payload = jwt.verify(accessToken, this.jwtSecret) as JwtPayload;
      
      if (payload.tokenType !== 'access') {
        throw new Error('Invalid token type');
      }

      // Find user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      return this.mapUserToAuthUser(user);
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    if (!user.passwordHash) {
      throw new Error('User has no password set');
    }
    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.hashPassword(newPassword);

    // Update password
    await this.userRepository.update(userId, {
      passwordHash: hashedNewPassword,
    });
  }

  async resetPassword(email: string): Promise<string> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('User with this email does not exist');
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        tokenType: 'reset',
      },
      this.jwtSecret,
      { expiresIn: '1h' }
    );

    // In a real application, you would send this token via email
    // For now, we'll just return it
    return resetToken;
  }

  async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
    try {
      // Verify reset token
      const payload = jwt.verify(resetToken, this.jwtSecret) as any;
      
      if (payload.tokenType !== 'reset') {
        throw new Error('Invalid token type');
      }

      // Find user
      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await this.userRepository.update(user.id, {
        passwordHash: hashedNewPassword,
      });
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  // Note: User activation/deactivation not implemented as isActive field doesn't exist in schema

  // Private helper methods
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: Omit<JwtPayload, 'tokenType'> = {
      userId: user.id,
      email: user.email || '',
      userType: user.userType,
    };

    const accessTokenPayload = { ...payload, tokenType: 'access' };
    const refreshTokenPayload = { ...payload, tokenType: 'refresh' };
    
    const accessToken = jwt.sign(
      accessTokenPayload,
      this.jwtSecret as string,
      { expiresIn: this.jwtExpiresIn } as jwt.SignOptions
    ) as string;

    const refreshToken = jwt.sign(
      refreshTokenPayload,
      this.jwtRefreshSecret as string,
      { expiresIn: this.jwtRefreshExpiresIn } as jwt.SignOptions
    ) as string;

    return {
      accessToken,
      refreshToken,
    };
  }

  private mapUserToAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      name: user.name || '',
      email: user.email!,
      phoneNumber: user.phoneNumber!,
      userType: user.userType,
    };
  }

  // Validation helpers
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation (adjust based on your requirements)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber.replace(/[\s-()]/g, ''));
  }

  validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}