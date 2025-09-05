import { Request, Response, NextFunction } from 'express';

export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Route ${req.originalUrl} not found`);
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource ${req.originalUrl} was not found on this server`,
    statusCode: 404,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  });
}; 