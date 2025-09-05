import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { ApiResponse } from '../types';

interface AuthRequest extends Request {
  user?: any;
}

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Registration successful',
      };
      
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Login successful',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Token refreshed successfully',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async verifyPhone(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { code } = req.body;
      const userId = req.user!.user_id;
      
      const result = await authService.verifyPhone(userId, code);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Phone verified successfully',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async sendVerificationCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const result = await authService.sendVerificationCode(userId);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Verification code sent',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user!.user_id;
      
      const result = await authService.changePassword(userId, oldPassword, newPassword);
      
      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Password changed successfully',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // Here we can log the action or invalidate the token if using a blacklist
      
      const response: ApiResponse = {
        success: true,
        message: 'Logged out successfully',
      };
      
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController(); 