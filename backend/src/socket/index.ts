import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { authenticateSocket } from '../middleware/socketAuth';
import { handleDriverLocation } from './driverLocation';
import { handleRideTracking } from './rideTracking';
import { handleDeliveryTracking } from './deliveryTracking';

export const setupSocketHandlers = (io: Server) => {
  // Middleware for socket authentication
  io.use(authenticateSocket);

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    const userType = socket.data.userType;
    
    logger.info(`Socket connected: ${socket.id}, User: ${userId}, Type: ${userType}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Driver-specific handlers
    if (userType === 'driver') {
      socket.join('drivers');
      handleDriverLocation(socket, io);
    }

    // Ride tracking handlers
    handleRideTracking(socket, io);

    // Delivery tracking handlers
    handleDeliveryTracking(socket, io);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}, User: ${userId}`);
      
      // Update driver availability if driver
      if (userType === 'driver') {
        // Update driver status to unavailable
        socket.broadcast.emit('driver:offline', { driver_id: userId });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });
}; 