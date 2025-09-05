import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { ApiResponse } from '../types';

interface AuthRequest extends Request {
  user?: any;
}

class UserController {
  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const profile = await userService.getProfile(userId);

      const response: ApiResponse = {
        success: true,
        data: profile,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const updates = req.body;
      
      const profile = await userService.updateProfile(userId, updates);

      const response: ApiResponse = {
        success: true,
        data: profile,
        message: 'Profile updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async updateDriverProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const updates = req.body;
      
      const profile = await userService.updateDriverProfile(userId, updates);

      const response: ApiResponse = {
        success: true,
        data: profile,
        message: 'Driver profile updated successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getDevices(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const devices = await userService.getUserDevices(userId);

      const response: ApiResponse = {
        success: true,
        data: devices,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async registerDevice(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const deviceData = req.body;
      
      const device = await userService.registerDevice(userId, deviceData);

      const response: ApiResponse = {
        success: true,
        data: device,
        message: 'Device registered successfully',
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getFavoriteLocations(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const favorites = await userService.getFavoriteLocations(userId);

      const response: ApiResponse = {
        success: true,
        data: favorites,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async addFavoriteLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const locationData = req.body;
      
      const favorite = await userService.addFavoriteLocation(userId, locationData);

      const response: ApiResponse = {
        success: true,
        data: favorite,
        message: 'Favorite location added successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async removeFavoriteLocation(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const favId = parseInt(req.params.id);
      
      const result = await userService.removeFavoriteLocation(userId, favId);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getUserStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.user_id;
      const stats = await userService.getUserStats(userId);

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController(); 