import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, beginTransaction, commitTransaction, rollbackTransaction } from '../config/database';
import { CreateUserRequest, LoginRequest, User } from '../types/user';
import { ValidationError, NotFoundError, UnauthorizedError, ConflictError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password, phone_number, user_type }: CreateUserRequest = req.body;
    
    try {
      // Check if user already exists
      const existingUser = await query(
        'SELECT user_id FROM "user" WHERE email = $1 OR phone_number = $2',
        [email, phone_number]
      );

      if (existingUser.rows.length > 0) {
        throw new ConflictError('User with this email or phone number already exists');
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Begin transaction
      const client = await beginTransaction();
      
      try {
        // Create wallet first
        const walletResult = await client.query(
          'INSERT INTO wallet (balance_rial) VALUES (0) RETURNING wallet_id'
        );
        const walletId = walletResult.rows[0].wallet_id;

        // Create user
        const userResult = await client.query(
          'INSERT INTO "user" (name, email, password_hash, user_type, phone_number, wallet_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id, name, email, user_type, phone_number, created_at',
          [name, email, passwordHash, user_type, phone_number, walletId]
        );

        const user = userResult.rows[0];

        // Update wallet with user_id
        await client.query(
          'UPDATE wallet SET user_id = $1 WHERE wallet_id = $2',
          [user.user_id, walletId]
        );

        // If user is a driver, create driver record
        if (user_type === 'driver') {
          await client.query(
            'INSERT INTO driver (user_id, is_verified) VALUES ($1, false)',
            [user.user_id]
          );
        }

        // Log user registration
        await client.query(
          'INSERT INTO log (user_id, action) VALUES ($1, $2)',
          [user.user_id, 'User registered']
        );

        await commitTransaction(client);

        // Generate JWT token
        const token = jwt.sign(
          { userId: user.user_id, email: user.email, userType: user.user_type },
          process.env.JWT_SECRET as string,
          { expiresIn: '24h' }
        );

        // Generate refresh token
        const refreshToken = jwt.sign(
          { userId: user.user_id, type: 'refresh' },
          process.env.JWT_REFRESH_SECRET as string,
          { expiresIn: '7d' }
        );

        logger.info(`User registered successfully: ${user.email}`);

        res.status(201).json({
          message: 'User registered successfully',
          data: {
            user: {
              ...user,
              wallet_id: walletId
            },
            tokens: {
              accessToken: token,
              refreshToken
            }
          }
        });

      } catch (error) {
        await rollbackTransaction(client);
        throw error;
      }

    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password }: LoginRequest = req.body;

    try {
      // Get user with password hash
      const userResult = await query(
        'SELECT u.user_id, u.name, u.email, u.password_hash, u.user_type, u.phone_number, u.created_at, u.wallet_id FROM "user" u WHERE u.email = $1',
        [email]
      );

      if (userResult.rows.length === 0) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const user = userResult.rows[0];

      // Check password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.user_id, email: user.email, userType: user.user_type },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { userId: user.user_id, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '7d' }
      );

      // Log user login
      await query(
        'INSERT INTO log (user_id, action) VALUES ($1, $2)',
        [user.user_id, 'User logged in']
      );

      logger.info(`User logged in successfully: ${user.email}`);

      // Remove password hash from response
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          tokens: {
            accessToken: token,
            refreshToken
          }
        }
      });

    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as any;
      
      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Get user
      const userResult = await query(
        'SELECT user_id, name, email, user_type, phone_number, created_at, wallet_id FROM "user" WHERE user_id = $1',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        throw new UnauthorizedError('User not found');
      }

      const user = userResult.rows[0];

      // Generate new tokens
      const newAccessToken = jwt.sign(
        { userId: decoded.userId, email: user.email, userType: user.user_type },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' }
      );

      const newRefreshToken = jwt.sign(
        { userId: decoded.userId, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET as string,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Token refreshed successfully',
        data: {
          user,
          tokens: {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
          }
        }
      });

    } catch (error) {
      logger.error('Token refresh error:', error);
      throw new UnauthorizedError('Invalid refresh token');
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Log user logout
      await query(
        'INSERT INTO log (user_id, action) VALUES ($1, $2)',
        [req.user!.id, 'User logged out']
      );

      logger.info(`User logged out: ${req.user!.email}`);

      res.json({
        message: 'Logout successful'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userResult = await query(
        'SELECT u.user_id, u.name, u.email, u.user_type, u.phone_number, u.created_at, u.wallet_id, w.balance_rial FROM "user" u LEFT JOIN wallet w ON u.wallet_id = w.wallet_id WHERE u.user_id = $1',
        [req.user!.id]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const user = userResult.rows[0];

      // If user is a driver, get driver info
      if (user.user_type === 'driver') {
        const driverResult = await query(
          'SELECT driver_id, license_number, is_verified FROM driver WHERE user_id = $1',
          [user.user_id]
        );

        if (driverResult.rows.length > 0) {
          user.driver_info = driverResult.rows[0];
        }
      }

      res.json({
        message: 'Profile retrieved successfully',
        user
      });

    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const { name, phone_number } = req.body;
    
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        values.push(name);
      }

      if (phone_number) {
        updates.push(`phone_number = $${paramIndex++}`);
        values.push(phone_number);
      }

      if (updates.length === 0) {
        throw new ValidationError('No fields to update');
      }

      values.push(req.user!.id);

      const updateQuery = `
        UPDATE "user" 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
        WHERE user_id = $${paramIndex}
        RETURNING user_id, name, email, user_type, phone_number, created_at, wallet_id
      `;

      const result = await query(updateQuery, values);

      // Log profile update
      await query(
        'INSERT INTO log (user_id, action) VALUES ($1, $2)',
        [req.user!.id, 'Profile updated']
      );

      logger.info(`Profile updated for user: ${req.user!.email}`);

      res.json({
        message: 'Profile updated successfully',
        user: result.rows[0]
      });

    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;

    try {
      // Get current password hash
      const userResult = await query(
        'SELECT password_hash FROM "user" WHERE user_id = $1',
        [req.user!.id]
      );

      if (userResult.rows.length === 0) {
        throw new NotFoundError('User not found');
      }

      const { password_hash } = userResult.rows[0];

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, password_hash);
      if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      await query(
        'UPDATE "user" SET password_hash = $1 WHERE user_id = $2',
        [newPasswordHash, req.user!.id]
      );

      // Log password change
      await query(
        'INSERT INTO log (user_id, action) VALUES ($1, $2)',
        [req.user!.id, 'Password changed']
      );

      logger.info(`Password changed for user: ${req.user!.email}`);

      res.json({
        message: 'Password changed successfully'
      });

    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    try {
      // Check if user exists
      const userResult = await query(
        'SELECT user_id, name FROM "user" WHERE email = $1',
        [email]
      );

      // Always return success message for security
      res.json({
        message: 'If the email exists, a password reset link has been sent'
      });

      if (userResult.rows.length === 0) {
        return;
      }

      // Generate password reset token
      const resetToken = jwt.sign(
          { userId: userResult.rows[0].user_id, type: 'password_reset' },
          process.env.JWT_SECRET as string,
          { expiresIn: '1h' }
        );

      // Here you would normally send an email with the reset token
      logger.info(`Password reset requested for user: ${email}`);

      // Log password reset request
      await query(
        'INSERT INTO log (user_id, action) VALUES ($1, $2)',
        [userResult.rows[0].user_id, 'Password reset requested']
      );

    } catch (error) {
      logger.error('Forgot password error:', error);
      // Don't throw error for security reasons
      res.json({
        message: 'If the email exists, a password reset link has been sent'
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;

    try {
      // Verify reset token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      if (decoded.type !== 'password_reset') {
        throw new UnauthorizedError('Invalid reset token');
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update password
      await query(
        'UPDATE "user" SET password_hash = $1 WHERE user_id = $2',
        [passwordHash, decoded.userId]
      );

      // Log password reset
      await query(
        'INSERT INTO log (user_id, action) VALUES ($1, $2)',
        [decoded.userId, 'Password reset completed']
      );

      logger.info(`Password reset completed for user ID: ${decoded.userId}`);

      res.json({
        message: 'Password reset successful'
      });

    } catch (error) {
      logger.error('Reset password error:', error);
      throw new UnauthorizedError('Invalid or expired reset token');
    }
  }
}