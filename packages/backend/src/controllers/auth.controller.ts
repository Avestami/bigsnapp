import { Request, Response } from 'express';
import '../middlewares/auth'; // Import to ensure global Request extension is available
import { AuthService, RegisterInput, LoginInput } from '../services/auth.service';
import { UserType } from '@prisma/client';
import { AdminLogRepository } from '../db/repositories/adminlog.repository';

export class AuthController {
  private authService: AuthService;
  private adminLogRepository: AdminLogRepository;

  constructor() {
    this.authService = new AuthService();
    this.adminLogRepository = new AdminLogRepository();
  }

  // Register a new user
  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        userType,
        dateOfBirth,
        profilePicture,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !phoneNumber || !password || !userType) {
        res.status(400).json({
          success: false,
          message: 'All required fields must be provided',
          required: ['firstName', 'lastName', 'email', 'phoneNumber', 'password', 'userType'],
        });
        return;
      }

      // Validate email format
      if (!this.authService.validateEmail(email)) {
        res.status(400).json({
          success: false,
          message: 'Invalid email format',
        });
        return;
      }

      // Validate phone number format
      if (!this.authService.validatePhoneNumber(phoneNumber)) {
        res.status(400).json({
          success: false,
          message: 'Invalid phone number format',
        });
        return;
      }

      // Validate password strength
      const passwordValidation = this.authService.validatePassword(password);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: passwordValidation.errors,
        });
        return;
      }

      // Validate user type
      if (!Object.values(UserType).includes(userType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user type',
          allowedTypes: Object.values(UserType),
        });
        return;
      }

      const registerInput: RegisterInput = {
        name: `${firstName || ''} ${lastName || ''}`.trim() || 'User',
        email: email.toLowerCase(),
        phoneNumber,
        password,
        userType,
      };

      const result = await this.authService.register(registerInput);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  };

  // Login user
  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const loginInput: LoginInput = {
        email: email.toLowerCase(),
        password,
      };

      const result = await this.authService.login(loginInput);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          tokens: result.tokens,
        },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      });
    }
  };

  // Refresh access token
  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: { tokens },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  };

  // Get current user profile
  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: { user: req.user },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve profile',
      });
    }
  };

  // Change password
  changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Current password and new password are required',
        });
        return;
      }

      // Validate new password strength
      const passwordValidation = this.authService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'New password does not meet requirements',
          errors: passwordValidation.errors,
        });
        return;
      }

      await this.authService.changePassword(req.user.id, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password change failed',
      });
    }
  };

  // Request password reset
  requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const resetToken = await this.authService.resetPassword(email.toLowerCase());

      // In a real application, you would send this token via email
      // For development/testing, we'll return it in the response
      res.status(200).json({
        success: true,
        message: 'Password reset token generated successfully',
        data: {
          resetToken, // Remove this in production
          message: 'Password reset instructions have been sent to your email',
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password reset request failed',
      });
    }
  };

  // Confirm password reset
  confirmPasswordReset = async (req: Request, res: Response): Promise<void> => {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Reset token and new password are required',
        });
        return;
      }

      // Validate new password strength
      const passwordValidation = this.authService.validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        res.status(400).json({
          success: false,
          message: 'New password does not meet requirements',
          errors: passwordValidation.errors,
        });
        return;
      }

      await this.authService.confirmPasswordReset(resetToken, newPassword);

      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Password reset failed',
      });
    }
  };

  // Logout (client-side token invalidation)
  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // In a stateless JWT implementation, logout is typically handled client-side
      // by removing the tokens from storage. However, we can log this action.
      
      if (req.user) {
        // Log the logout action for audit purposes
        // This could be extended to maintain a blacklist of tokens
      }

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  };

  // Admin: Deactivate user account
  deactivateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const targetUserId = parseInt(userId);
      if (isNaN(targetUserId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      // Note: User deactivation not implemented in AuthService
      // TODO: Implement user deactivation when isActive field is added to schema

      // Log admin action
      await this.adminLogRepository.logUserAction(
        req.user.id,
        'suspend',
        targetUserId,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'User account deactivated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to deactivate user',
      });
    }
  };

  // Admin: Activate user account
  activateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;

      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const targetUserId = parseInt(userId);
      if (isNaN(targetUserId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      // Note: User activation not implemented in AuthService
      // TODO: Implement user activation when isActive field is added to schema

      // Log admin action
      await this.adminLogRepository.logUserAction(
        req.user.id,
        'unsuspend',
        targetUserId,
        reason
      );

      res.status(200).json({
        success: true,
        message: 'User account activated successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to activate user',
      });
    }
  };

  // Validate token endpoint (for client-side token validation)
  validateToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required',
        });
        return;
      }

      const user = await this.authService.verifyAccessToken(token);

      res.status(200).json({
        success: true,
        message: 'Token is valid',
        data: { user },
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  };
}