import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import 'express-async-errors';

import { appConfig } from './config/app';
import { pool } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/logger';
import { rateLimiter } from './middleware/rateLimiter';
import { setupRoutes } from './routes';
import { setupSocketHandlers } from './socket';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: appConfig.cors,
});

// Global middleware
app.use(helmet());
app.use(compression());
app.use(cors(appConfig.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      environment: appConfig.env,
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'Database connection failed',
    });
  }
});

// Setup routes
setupRoutes(app);

// Socket.io setup
setupSocketHandlers(io);

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await pool.query('SELECT 1');
    logger.info('Database connection established');
    
    httpServer.listen(appConfig.port, () => {
      logger.info(`Server running on port ${appConfig.port} in ${appConfig.env} mode`);
      logger.info(`Socket.io listening on port ${appConfig.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  
  await pool.end();
  logger.info('Database pool closed');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

startServer(); 