import { AuthService } from '../../../src/services/auth.service';
import { UserRepository } from '../../../src/db/repositories/user.repository';
import { UserType } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { mockUser } from '../../fixtures';

// Mock dependencies
jest.mock('../../../src/db/repositories/user.repository');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepositoryInstance: jest.Mocked<UserRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock repository instance
    mockUserRepositoryInstance = {
      findByEmail: jest.fn(),
      findByPhoneNumber: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    // Mock the constructor to return our mock instance
    mockUserRepository.mockImplementation(() => mockUserRepositoryInstance);

    // Set up environment variables
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    authService = new AuthService();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_EXPIRES_IN;
    delete process.env.JWT_REFRESH_EXPIRES_IN;
  });

  describe('register', () => {
    const registerInput = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
      password: 'Password123!',
      userType: UserType.RIDER,
    };

    it('should register a new user successfully', async () => {
      const hashedPassword = 'hashed-password';
      const createdUser = { ...mockUser, ...registerInput, passwordHash: hashedPassword };
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null);
      mockUserRepositoryInstance.findByPhoneNumber.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepositoryInstance.create.mockResolvedValue(createdUser);
      mockJwt.sign.mockReturnValueOnce('access-token' as never).mockReturnValueOnce('refresh-token' as never);

      const result = await authService.register(registerInput);

      expect(mockUserRepositoryInstance.findByEmail).toHaveBeenCalledWith(registerInput.email);
      expect(mockUserRepositoryInstance.findByPhoneNumber).toHaveBeenCalledWith(registerInput.phoneNumber);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(registerInput.password, 12);
      expect(mockUserRepositoryInstance.create).toHaveBeenCalledWith({
        firstName: registerInput.firstName,
        lastName: registerInput.lastName,
        email: registerInput.email,
        phoneNumber: registerInput.phoneNumber,
        passwordHash: hashedPassword,
        userType: registerInput.userType,
        dateOfBirth: undefined,
        profilePicture: undefined,
        isActive: true,
      });
      expect(result.user).toEqual({
        id: createdUser.id,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        email: createdUser.email,
        phoneNumber: createdUser.phoneNumber,
        userType: createdUser.userType,
        isActive: createdUser.isActive,
        profilePicture: undefined,
      });
      expect(result.tokens).toEqual(tokens);
    });

    it('should throw error if user with email already exists', async () => {
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.register(registerInput)).rejects.toThrow('User with this email already exists');
    });

    it('should throw error if user with phone number already exists', async () => {
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null);
      mockUserRepositoryInstance.findByPhoneNumber.mockResolvedValue(mockUser);

      await expect(authService.register(registerInput)).rejects.toThrow('User with this phone number already exists');
    });

    it('should handle registration errors', async () => {
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null);
      mockUserRepositoryInstance.findByPhoneNumber.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue('hashed-password' as never);
      mockUserRepositoryInstance.create.mockRejectedValue(new Error('Database error'));

      await expect(authService.register(registerInput)).rejects.toThrow('Database error');
    });
  });

  describe('login', () => {
    const loginInput = {
      email: 'john@example.com',
      password: 'Password123!',
    };

    it('should login user successfully', async () => {
      const user = { ...mockUser, isActive: true };
      const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockJwt.sign.mockReturnValueOnce('access-token' as never).mockReturnValueOnce('refresh-token' as never);

      const result = await authService.login(loginInput);

      expect(mockUserRepositoryInstance.findByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(loginInput.password, user.passwordHash);
      expect(result.user.id).toBe(user.id);
      expect(result.tokens).toEqual(tokens);
    });

    it('should throw error if user not found', async () => {
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(inactiveUser);

      await expect(authService.login(loginInput)).rejects.toThrow('Account is deactivated. Please contact support.');
    });

    it('should throw error if password is invalid', async () => {
      const user = { ...mockUser, isActive: true };
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.login(loginInput)).rejects.toThrow('Invalid email or password');
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'valid-refresh-token';
    const payload = {
      userId: 1,
      email: 'john@example.com',
      userType: UserType.RIDER,
      tokenType: 'refresh' as const,
    };

    it('should refresh tokens successfully', async () => {
      const user = { ...mockUser, isActive: true };
      const newTokens = { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' };

      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(user);
      mockJwt.sign.mockReturnValueOnce('new-access-token' as never).mockReturnValueOnce('new-refresh-token' as never);

      const result = await authService.refreshToken(refreshToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(refreshToken, 'test-refresh-secret');
      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledWith(payload.userId);
      expect(result).toEqual(newTokens);
    });

    it('should throw error for invalid token type', async () => {
      const invalidPayload = { ...payload, tokenType: 'access' as const };
      mockJwt.verify.mockReturnValue(invalidPayload as never);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user not found', async () => {
      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(null);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(inactiveUser);

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refreshToken(refreshToken)).rejects.toThrow('Invalid refresh token');
    });
  });

  describe('verifyAccessToken', () => {
    const accessToken = 'valid-access-token';
    const payload = {
      userId: 1,
      email: 'john@example.com',
      userType: UserType.RIDER,
      tokenType: 'access' as const,
    };

    it('should verify access token successfully', async () => {
      const user = { ...mockUser, isActive: true };

      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(user);

      const result = await authService.verifyAccessToken(accessToken);

      expect(mockJwt.verify).toHaveBeenCalledWith(accessToken, 'test-secret');
      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledWith(payload.userId);
      expect(result.id).toBe(user.id);
    });

    it('should throw error for invalid token type', async () => {
      const invalidPayload = { ...payload, tokenType: 'refresh' as const };
      mockJwt.verify.mockReturnValue(invalidPayload as never);

      await expect(authService.verifyAccessToken(accessToken)).rejects.toThrow('Invalid access token');
    });

    it('should throw error if user not found', async () => {
      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(null);

      await expect(authService.verifyAccessToken(accessToken)).rejects.toThrow('Invalid access token');
    });

    it('should throw error if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false };
      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(inactiveUser);

      await expect(authService.verifyAccessToken(accessToken)).rejects.toThrow('Invalid access token');
    });

    it('should throw error for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.verifyAccessToken(accessToken)).rejects.toThrow('Invalid access token');
    });
  });

  describe('changePassword', () => {
    const userId = 1;
    const currentPassword = 'OldPassword123!';
    const newPassword = 'NewPassword123!';

    it('should change password successfully', async () => {
      const user = { ...mockUser, passwordHash: 'old-hashed-password' };
      const newHashedPassword = 'new-hashed-password';

      mockUserRepositoryInstance.findById.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(true as never);
      mockBcrypt.hash.mockResolvedValue(newHashedPassword as never);
      mockUserRepositoryInstance.update.mockResolvedValue(undefined as never);

      await authService.changePassword(userId, currentPassword, newPassword);

      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledWith(userId);
      expect(mockBcrypt.compare).toHaveBeenCalledWith(currentPassword, user.passwordHash);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockUserRepositoryInstance.update).toHaveBeenCalledWith(userId, {
        passwordHash: newHashedPassword,
      });
    });

    it('should throw error if user not found', async () => {
      mockUserRepositoryInstance.findById.mockResolvedValue(null);

      await expect(authService.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('User not found');
    });

    it('should throw error if current password is incorrect', async () => {
      const user = { ...mockUser, passwordHash: 'old-hashed-password' };
      mockUserRepositoryInstance.findById.mockResolvedValue(user);
      mockBcrypt.compare.mockResolvedValue(false as never);

      await expect(authService.changePassword(userId, currentPassword, newPassword)).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('resetPassword', () => {
    const email = 'john@example.com';

    it('should generate reset token successfully', async () => {
      const user = { ...mockUser, email };
      const resetToken = 'reset-token';

      mockUserRepositoryInstance.findByEmail.mockResolvedValue(user);
      mockJwt.sign.mockReturnValue(resetToken as never);

      const result = await authService.resetPassword(email);

      expect(mockUserRepositoryInstance.findByEmail).toHaveBeenCalledWith(email);
      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          userId: user.id,
          email: user.email,
          tokenType: 'reset',
        },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toBe(resetToken);
    });

    it('should throw error if user not found', async () => {
      mockUserRepositoryInstance.findByEmail.mockResolvedValue(null);

      await expect(authService.resetPassword(email)).rejects.toThrow('User with this email does not exist');
    });
  });

  describe('confirmPasswordReset', () => {
    const resetToken = 'valid-reset-token';
    const newPassword = 'NewPassword123!';
    const payload = {
      userId: 1,
      email: 'john@example.com',
      tokenType: 'reset',
    };

    it('should confirm password reset successfully', async () => {
      const user = { ...mockUser };
      const newHashedPassword = 'new-hashed-password';

      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(user);
      mockBcrypt.hash.mockResolvedValue(newHashedPassword as never);
      mockUserRepositoryInstance.update.mockResolvedValue(undefined as never);

      await authService.confirmPasswordReset(resetToken, newPassword);

      expect(mockJwt.verify).toHaveBeenCalledWith(resetToken, 'test-secret');
      expect(mockUserRepositoryInstance.findById).toHaveBeenCalledWith(payload.userId);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(newPassword, 12);
      expect(mockUserRepositoryInstance.update).toHaveBeenCalledWith(user.id, {
        passwordHash: newHashedPassword,
      });
    });

    it('should throw error for invalid token type', async () => {
      const invalidPayload = { ...payload, tokenType: 'access' };
      mockJwt.verify.mockReturnValue(invalidPayload as never);

      await expect(authService.confirmPasswordReset(resetToken, newPassword)).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error if user not found', async () => {
      mockJwt.verify.mockReturnValue(payload as never);
      mockUserRepositoryInstance.findById.mockResolvedValue(null);

      await expect(authService.confirmPasswordReset(resetToken, newPassword)).rejects.toThrow('Invalid or expired reset token');
    });

    it('should throw error for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.confirmPasswordReset(resetToken, newPassword)).rejects.toThrow('Invalid or expired reset token');
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate user successfully', async () => {
      const userId = 1;
      mockUserRepositoryInstance.update.mockResolvedValue(undefined as never);

      await authService.deactivateUser(userId);

      expect(mockUserRepositoryInstance.update).toHaveBeenCalledWith(userId, {
        isActive: false,
      });
    });
  });

  describe('activateUser', () => {
    it('should activate user successfully', async () => {
      const userId = 1;
      mockUserRepositoryInstance.update.mockResolvedValue(undefined as never);

      await authService.activateUser(userId);

      expect(mockUserRepositoryInstance.update).toHaveBeenCalledWith(userId, {
        isActive: true,
      });
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(authService.validateEmail('test@example.com')).toBe(true);
      expect(authService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(authService.validateEmail('user+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(authService.validateEmail('invalid-email')).toBe(false);
      expect(authService.validateEmail('test@')).toBe(false);
      expect(authService.validateEmail('@example.com')).toBe(false);
      expect(authService.validateEmail('test.example.com')).toBe(false);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number formats', () => {
      expect(authService.validatePhoneNumber('+1234567890')).toBe(true);
      expect(authService.validatePhoneNumber('1234567890')).toBe(true);
      expect(authService.validatePhoneNumber('+44 20 7946 0958')).toBe(true);
      expect(authService.validatePhoneNumber('+1 (555) 123-4567')).toBe(true);
    });

    it('should reject invalid phone number formats', () => {
      expect(authService.validatePhoneNumber('123')).toBe(false);
      expect(authService.validatePhoneNumber('abc123')).toBe(false);
      expect(authService.validatePhoneNumber('+0123456789')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = authService.validatePassword('Password123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject passwords that are too short', () => {
      const result = authService.validatePassword('Pass1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject passwords without uppercase letters', () => {
      const result = authService.validatePassword('password123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject passwords without lowercase letters', () => {
      const result = authService.validatePassword('PASSWORD123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject passwords without numbers', () => {
      const result = authService.validatePassword('Password!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject passwords without special characters', () => {
      const result = authService.validatePassword('Password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should return multiple errors for weak passwords', () => {
      const result = authService.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });
});