import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err as AppError;

  // Log error
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
    },
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = new AppError('Validation Error', 400);
  } else if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token', 401);
  } else if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired', 401);
  }

  // Default error
  if (!error.statusCode) {
    error.statusCode = 500;
  }

  const response: ApiResponse = {
    success: false,
    error: error.isOperational ? error.message : 'Something went wrong',
  };

  if (process.env.NODE_ENV === 'development') {
    response.error = error.message;
    response.errors = [error.stack];
  }

  res.status(error.statusCode).json(response);
}; 