import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { UserType } from '@prisma/client';

// Extend Request interface to include user
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

export interface JWTPayload {
  userId: number;
  email: string;
  userType: 'rider' | 'driver' | 'admin';
  iat: number;
  exp: number;
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    
    // Get user from database
    const userResult = await query(
      'SELECT user_id, name, email, user_type, phone_number, created_at FROM "user" WHERE user_id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'User not found'
      });
      return;
    }

    // Attach user to request with mapped properties
    const dbUser = userResult.rows[0];
    req.user = {
      id: dbUser.user_id,
      name: dbUser.name,
      email: dbUser.email,
      phoneNumber: dbUser.phone_number,
      userType: dbUser.user_type
    };
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'Please provide a valid access token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Token expired',
        message: 'Please login again'
      });
    } else {
      res.status(500).json({
        error: 'Authentication error',
        message: 'Internal server error'
      });
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Please authenticate first'
      });
      return;
    }

    if (!roles.includes(req.user.userType)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource'
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireDriver = requireRole(['driver', 'admin']);
export const requireRider = requireRole(['rider', 'admin']);

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JWTPayload;
    
    const userResult = await query(
      'SELECT user_id, name, email, user_type, phone_number, created_at FROM "user" WHERE user_id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }

    next();
  } catch (error) {
    // For optional auth, we don't return an error, just continue without user
    next();
  }
};