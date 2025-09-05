import { Request, Response, NextFunction } from 'express';
import './auth'; // Import to ensure global Request extension is available
import logger from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.statusCode = 400;
    this.isOperational = true;
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.statusCode = 404;
    this.isOperational = true;
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.statusCode = 401;
    this.isOperational = true;
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.statusCode = 403;
    this.isOperational = true;
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string) {
    super(message);
    this.statusCode = 409;
    this.isOperational = true;
    this.name = 'ConflictError';
  }
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error({
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  });

  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource ID';
  } else if (error.name === 'MongoError' || error.name === 'BulkWriteError') {
    statusCode = 400;
    message = 'Database operation failed';
  }

  // PostgreSQL specific errors
  if (error.message.includes('duplicate key')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.message.includes('foreign key')) {
    statusCode = 400;
    message = 'Invalid reference';
  } else if (error.message.includes('not null')) {
    statusCode = 400;
    message = 'Required field missing';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  const response: any = {
    error: message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};