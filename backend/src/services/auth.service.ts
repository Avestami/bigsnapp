import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../config/database';
import { appConfig } from '../config/app';
import { RegisterBody, LoginBody, User, JwtPayload } from '../types';
import { AppError } from '../middleware/errorHandler';

class AuthService {
  async register(data: RegisterBody) {
    const { name, email, password, phone_number, user_type } = data;

    // Check if user already exists
    const existingUser = await query(
      'SELECT user_id FROM "user" WHERE email = $1 OR phone_number = $2',
      [email, phone_number]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User with this email or phone number already exists', 400);
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user with wallet in a transaction
    let userId: number;
    let walletId: number;

    await transaction(async (client) => {
      // Create wallet first
      const walletResult = await client.query(
        'INSERT INTO wallet (balance_rial) VALUES ($1) RETURNING wallet_id',
        [0]
      );
      walletId = walletResult.rows[0].wallet_id;

      // Create user
      const userResult = await client.query(
        `INSERT INTO "user" (name, email, password_hash, phone_number, user_type, wallet_id) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
        [name, email, password_hash, phone_number, user_type, walletId]
      );
      userId = userResult.rows[0].user_id;

      // Update wallet with user_id
      await client.query(
        'UPDATE wallet SET user_id = $1 WHERE wallet_id = $2',
        [userId, walletId]
      );

      // If registering as driver, create driver record
      if (user_type === 'driver') {
        await client.query(
          'INSERT INTO driver (user_id) VALUES ($1)',
          [userId]
        );
      }

      // Log the registration
      await client.query(
        'INSERT INTO log (user_id, action) VALUES ($1, $2)',
        [userId, 'User registered']
      );
    });

    // Generate tokens
    const tokens = this.generateTokens({
      user_id: userId!,
      user_type,
      email,
      phone_number,
    });

    return {
      user: {
        user_id: userId!,
        name,
        email,
        phone_number,
        user_type,
        wallet_id: walletId!,
      },
      ...tokens,
    };
  }

  async login(data: LoginBody) {
    const { phone_number, password } = data;

    // Get user
    const result = await query(
      `SELECT u.*, w.balance_rial 
       FROM "user" u
       LEFT JOIN wallet w ON u.wallet_id = w.wallet_id
       WHERE u.phone_number = $1 AND u.is_active = true`,
      [phone_number]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Update last login
    await query(
      'UPDATE "user" SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Log the login
    await query(
      'INSERT INTO log (user_id, action) VALUES ($1, $2)',
      [user.user_id, 'User logged in']
    );

    // Generate tokens
    const tokens = this.generateTokens({
      user_id: user.user_id,
      user_type: user.user_type,
      email: user.email,
      phone_number: user.phone_number,
    });

    // Remove sensitive data
    delete user.password_hash;

    return {
      user,
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        appConfig.jwt.refreshSecret
      ) as JwtPayload;

      // Get fresh user data
      const result = await query(
        'SELECT user_id, email, phone_number, user_type FROM "user" WHERE user_id = $1 AND is_active = true',
        [decoded.user_id]
      );

      if (result.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = result.rows[0];

      // Generate new tokens
      const tokens = this.generateTokens({
        user_id: user.user_id,
        user_type: user.user_type,
        email: user.email,
        phone_number: user.phone_number,
      });

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async verifyPhone(userId: number, code: string) {
    const result = await query(
      `SELECT verification_code, verification_expiry 
       FROM "user" WHERE user_id = $1 AND is_verified = false`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found or already verified', 400);
    }

    const user = result.rows[0];

    if (user.verification_code !== code) {
      throw new AppError('Invalid verification code', 400);
    }

    if (new Date() > new Date(user.verification_expiry)) {
      throw new AppError('Verification code expired', 400);
    }

    // Update user as verified
    await query(
      `UPDATE "user" 
       SET is_verified = true, verification_code = NULL, verification_expiry = NULL 
       WHERE user_id = $1`,
      [userId]
    );

    return { message: 'Phone number verified successfully' };
  }

  async sendVerificationCode(userId: number) {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await query(
      'UPDATE "user" SET verification_code = $1, verification_expiry = $2 WHERE user_id = $3',
      [code, expiry, userId]
    );

    // TODO: Send SMS with verification code
    // For now, return the code (remove in production)
    return { code, message: 'Verification code sent' };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    // Get current password
    const result = await query(
      'SELECT password_hash FROM "user" WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!isPasswordValid) {
      throw new AppError('Invalid old password', 400);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await query(
      'UPDATE "user" SET password_hash = $1 WHERE user_id = $2',
      [newPasswordHash, userId]
    );

    // Log the action
    await query(
      'INSERT INTO log (user_id, action) VALUES ($1, $2)',
      [userId, 'Password changed']
    );

    return { message: 'Password changed successfully' };
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = jwt.sign(
      payload, 
      appConfig.jwt.secret, 
      { expiresIn: appConfig.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      payload, 
      appConfig.jwt.refreshSecret, 
      { expiresIn: appConfig.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService(); 