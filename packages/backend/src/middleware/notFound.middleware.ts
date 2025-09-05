import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

// 404 Not Found middleware
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};