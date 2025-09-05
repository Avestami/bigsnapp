import dotenv from 'dotenv';

dotenv.config();

export const appConfig = {
  port: parseInt(process.env.PORT || '3000'),
  env: process.env.NODE_ENV || 'development',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRATION || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
  },
  
  socket: {
    port: parseInt(process.env.SOCKET_PORT || '3001'),
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:8081'],
    credentials: true,
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },
  
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    directory: process.env.UPLOAD_DIRECTORY || './uploads',
  },
  
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  
  sms: {
    apiKey: process.env.SMS_API_KEY || '',
    apiSecret: process.env.SMS_API_SECRET || '',
  },
  
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  },
  
  payment: {
    gatewayKey: process.env.PAYMENT_GATEWAY_API_KEY || '',
    gatewaySecret: process.env.PAYMENT_GATEWAY_SECRET || '',
  },
  
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@snappclone.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
};

export const isDevelopment = appConfig.env === 'development';
export const isProduction = appConfig.env === 'production';
export const isTest = appConfig.env === 'test'; 