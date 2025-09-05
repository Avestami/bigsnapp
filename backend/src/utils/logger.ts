import winston from 'winston';
import path from 'path';
import { appConfig } from '../config/app';

const logDirectory = path.join(__dirname, '../../logs');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }),
];

if (appConfig.env !== 'test') {
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logDirectory, 'combined.log'),
    })
  );
}

export const logger = winston.createLogger({
  level: appConfig.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create a stream for Morgan HTTP request logging
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
}; 