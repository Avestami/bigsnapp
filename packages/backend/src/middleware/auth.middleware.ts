import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserType } from '@prisma/client';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
        phoneNumber: string;
        userType: UserType;
      };
    }
  }
}

export class AuthMiddleware {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Middleware to authenticate requests
  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'Authorization header is required',
        });
        return;
      }

      const token = authHeader.split(' ')[1]; // Bearer <token>
      
      if (!token) {
        res.status(401).json({
          success: false,
          message: 'Access token is required',
        });
        return;
      }

      // Verify token and get user
      const user = await this.authService.verifyAccessToken(token);
      req.user = user;
      
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        error: error instanceof Error ? error.message : 'Authentication failed',
      });
    }
  };

  // Middleware to authorize specific user types
  authorize = (allowedUserTypes: UserType[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!allowedUserTypes.includes(req.user.userType)) {
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
        return;
      }

      next();
    };
  };

  // Middleware for admin-only routes
  adminOnly = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.userType !== UserType.ADMIN) {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    next();
  };

  // Middleware for driver-only routes
  driverOnly = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.userType !== UserType.DRIVER) {
      res.status(403).json({
        success: false,
        message: 'Driver access required',
      });
      return;
    }

    next();
  };

  // Middleware for rider-only routes
  riderOnly = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.userType !== UserType.RIDER) {
      res.status(403).json({
        success: false,
        message: 'Rider access required',
      });
      return;
    }

    next();
  };

  // Middleware for driver or rider routes
  driverOrRider = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (req.user.userType !== UserType.DRIVER && req.user.userType !== UserType.RIDER) {
      res.status(403).json({
        success: false,
        message: 'Driver or rider access required',
      });
      return;
    }

    next();
  };

  // Middleware to check if user owns the resource or is admin
  ownerOrAdmin = (userIdParam: string = 'userId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const resourceUserId = parseInt(req.params[userIdParam]);
      
      if (isNaN(resourceUserId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid user ID',
        });
        return;
      }

      // Allow if user is admin or owns the resource
      if (req.user.userType === UserType.ADMIN || req.user.id === resourceUserId) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    };
  };

  // Optional authentication (doesn't fail if no token)
  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const token = authHeader.split(' ')[1];
        
        if (token) {
          try {
            const user = await this.authService.verifyAccessToken(token);
            req.user = user;
          } catch (error) {
            // Ignore token errors for optional auth
          }
        }
      }
      
      next();
    } catch (error) {
      // Continue without authentication for optional auth
      next();
    }
  };

  // Middleware to check if user account is active
  requireActiveAccount = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Note: Account activation would require additional schema fields
    // For now, all authenticated users are considered active
    next();
  };

  // Rate limiting middleware (basic implementation)
  rateLimit = (maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) => {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (req: Request, res: Response, next: NextFunction): void => {
      const identifier = req.user?.id.toString() || req.ip || 'unknown';
      const now = Date.now();
      
      const userRequests = requests.get(identifier);
      
      if (!userRequests || now > userRequests.resetTime) {
        requests.set(identifier, {
          count: 1,
          resetTime: now + windowMs,
        });
        next();
        return;
      }

      if (userRequests.count >= maxRequests) {
        res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
        });
        return;
      }

      userRequests.count++;
      next();
    };
  };
}

// Create singleton instance
export const authMiddleware = new AuthMiddleware();

// Export individual middleware functions for convenience
export const {
  authenticate,
  authorize,
  adminOnly,
  driverOnly,
  riderOnly,
  driverOrRider,
  ownerOrAdmin,
  optionalAuth,
  requireActiveAccount,
  rateLimit,
} = authMiddleware;