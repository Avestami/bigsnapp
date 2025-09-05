import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationError } from 'express-validator';

export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error: any) => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input and try again',
      details: errorMessages,
      statusCode: 400,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};