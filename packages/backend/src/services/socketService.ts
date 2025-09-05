import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger';
import { UserRepository } from '../db/repositories/user.repository';
import { DriverRepository } from '../db/repositories/driver.repository';
import { RideRepository } from '../db/repositories/ride.repository';
import { DeliveryRepository } from '../db/repositories/delivery.repository';
import { WalletRepository } from '../db/repositories/wallet.repository';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userType?: 'user' | 'driver' | 'admin';
  driverId?: string;
}

interface SocketData {
  userId: string;
  userType: 'user' | 'driver' | 'admin';
  driverId?: string;
}

class SocketService {
  private io: Server;
  private userRepository: UserRepository;
  private driverRepository: DriverRepository;
  private rideRepository: RideRepository;
  private deliveryRepository: DeliveryRepository;
  private walletRepository: WalletRepository;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId
  private connectedDrivers: Map<string, string> = new Map(); // driverId -> socketId

  constructor(io: Server) {
    this.io = io;
    this.userRepository = new UserRepository();
    this.driverRepository = new DriverRepository();
    this.rideRepository = new RideRepository();
    this.deliveryRepository = new DeliveryRepository();
    this.walletRepository = new WalletRepository();
  }

  public setupSocketIO() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await this.userRepository.findById(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.userId = user.id.toString();
        socket.userType = user.userType.toLowerCase() as 'user' | 'driver' | 'admin';
        
        // If user is a driver, get driver info
        if (user.userType === 'DRIVER') {
          const driver = await this.driverRepository.findByUserId(user.id);
          if (driver) {
            socket.driverId = driver.id.toString();
          }
        }

        next();
      } catch (error) {
        logger.error('Socket authentication failed:', error);
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      this.handleConnection(socket);
    });

    return this.io;
  }

  private handleConnection(socket: AuthenticatedSocket) {
    const { userId, userType, driverId } = socket;
    
    logger.info(`Socket connected: ${socket.id}, User: ${userId}, Type: ${userType}`);

    // Store connection
    if (userId) {
      this.connectedUsers.set(userId, socket.id);
      socket.join(`user:${userId}`);
    }

    if (driverId) {
      this.connectedDrivers.set(driverId, socket.id);
      socket.join(`driver:${driverId}`);
      socket.join('drivers'); // All drivers room
    }

    // Set up event handlers
    this.setupRideEvents(socket);
    this.setupDeliveryEvents(socket);
    this.setupLocationEvents(socket);
    this.setupWalletEvents(socket);
    this.setupDriverEvents(socket);

    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });

    // Send authentication success
    socket.emit('authenticated', {
      success: true,
      userId,
      userType,
      driverId
    });
  }

  private setupRideEvents(socket: AuthenticatedSocket) {
    // Join ride room for tracking
    socket.on('join_ride', (data: { rideId: string }) => {
      socket.join(`ride:${data.rideId}`);
      logger.info(`Socket ${socket.id} joined ride room: ${data.rideId}`);
    });

    // Leave ride room
    socket.on('leave_ride', (data: { rideId: string }) => {
      socket.leave(`ride:${data.rideId}`);
      logger.info(`Socket ${socket.id} left ride room: ${data.rideId}`);
    });

    // Driver accepts ride
    socket.on('ride:accept', async (data: { rideId: string }) => {
      try {
        if (socket.userType !== 'driver' || !socket.driverId) {
          socket.emit('error', { message: 'Only drivers can accept rides' });
          return;
        }

        // Emit to ride participants
        this.io.to(`ride:${data.rideId}`).emit('ride:driver_assigned', {
          rideId: data.rideId,
          driverId: socket.driverId,
          timestamp: new Date()
        });

        logger.info(`Driver ${socket.driverId} accepted ride ${data.rideId}`);
      } catch (error) {
        logger.error('Error accepting ride:', error);
        socket.emit('error', { message: 'Failed to accept ride' });
      }
    });

    // Driver arrived at pickup
    socket.on('ride:driver_arrived', (data: { rideId: string }) => {
      this.io.to(`ride:${data.rideId}`).emit('ride:driver_arrived', {
        rideId: data.rideId,
        timestamp: new Date()
      });
    });

    // Ride started
    socket.on('ride:started', (data: { rideId: string }) => {
      this.io.to(`ride:${data.rideId}`).emit('ride:started', {
        rideId: data.rideId,
        timestamp: new Date()
      });
    });

    // Ride completed
    socket.on('ride:completed', (data: { rideId: string, fare?: number }) => {
      this.io.to(`ride:${data.rideId}`).emit('ride:completed', {
        rideId: data.rideId,
        fare: data.fare,
        timestamp: new Date()
      });
    });

    // Ride cancelled
    socket.on('ride:cancelled', (data: { rideId: string, reason?: string }) => {
      this.io.to(`ride:${data.rideId}`).emit('ride:cancelled', {
        rideId: data.rideId,
        reason: data.reason,
        timestamp: new Date()
      });
    });
  }

  private setupDeliveryEvents(socket: AuthenticatedSocket) {
    // Join delivery room for tracking
    socket.on('join_delivery', (data: { deliveryId: string }) => {
      socket.join(`delivery:${data.deliveryId}`);
      logger.info(`Socket ${socket.id} joined delivery room: ${data.deliveryId}`);
    });

    // Leave delivery room
    socket.on('leave_delivery', (data: { deliveryId: string }) => {
      socket.leave(`delivery:${data.deliveryId}`);
      logger.info(`Socket ${socket.id} left delivery room: ${data.deliveryId}`);
    });

    // Driver accepts delivery
    socket.on('delivery:accept', (data: { deliveryId: string }) => {
      if (socket.userType !== 'driver' || !socket.driverId) {
        socket.emit('error', { message: 'Only drivers can accept deliveries' });
        return;
      }

      this.io.to(`delivery:${data.deliveryId}`).emit('delivery:driver_assigned', {
        deliveryId: data.deliveryId,
        driverId: socket.driverId,
        timestamp: new Date()
      });
    });

    // Package picked up
    socket.on('delivery:picked_up', (data: { deliveryId: string }) => {
      this.io.to(`delivery:${data.deliveryId}`).emit('delivery:picked_up', {
        deliveryId: data.deliveryId,
        timestamp: new Date()
      });
    });

    // Package delivered
    socket.on('delivery:delivered', (data: { deliveryId: string }) => {
      this.io.to(`delivery:${data.deliveryId}`).emit('delivery:delivered', {
        deliveryId: data.deliveryId,
        timestamp: new Date()
      });
    });

    // Delivery cancelled
    socket.on('delivery:cancelled', (data: { deliveryId: string, reason?: string }) => {
      this.io.to(`delivery:${data.deliveryId}`).emit('delivery:cancelled', {
        deliveryId: data.deliveryId,
        reason: data.reason,
        timestamp: new Date()
      });
    });
  }

  private setupLocationEvents(socket: AuthenticatedSocket) {
    // Driver location update
    socket.on('location:update', (data: { latitude: number, longitude: number, rideId?: string, deliveryId?: string }) => {
      if (socket.userType !== 'driver' || !socket.driverId) {
        socket.emit('error', { message: 'Only drivers can update location' });
        return;
      }

      const locationData = {
        driverId: socket.driverId,
        latitude: data.latitude,
        longitude: data.longitude,
        timestamp: new Date()
      };

      // Broadcast to specific ride/delivery if provided
      if (data.rideId) {
        this.io.to(`ride:${data.rideId}`).emit('driver:location', {
          ...locationData,
          rideId: data.rideId
        });
      }

      if (data.deliveryId) {
        this.io.to(`delivery:${data.deliveryId}`).emit('driver:location', {
          ...locationData,
          deliveryId: data.deliveryId
        });
      }

      // Broadcast to all users looking for drivers (for ride requests)
      socket.to('users').emit('driver:location', locationData);
    });
  }

  private setupWalletEvents(socket: AuthenticatedSocket) {
    // Join wallet room for updates
    socket.on('join_wallet', () => {
      if (socket.userId) {
        socket.join(`wallet:${socket.userId}`);
        logger.info(`Socket ${socket.id} joined wallet room for user ${socket.userId}`);
      }
    });

    // Leave wallet room
    socket.on('leave_wallet', () => {
      if (socket.userId) {
        socket.leave(`wallet:${socket.userId}`);
        logger.info(`Socket ${socket.id} left wallet room for user ${socket.userId}`);
      }
    });
  }

  private setupDriverEvents(socket: AuthenticatedSocket) {
    if (socket.userType !== 'driver') return;

    // Driver availability update
    socket.on('driver:availability', async (data: { available: boolean }) => {
      try {
        if (!socket.driverId) return;

        // Note: Driver availability tracking would require additional schema fields
        // For now, we'll just broadcast the availability change

        // Broadcast to admin and other relevant parties
        this.io.emit('driver:availability_changed', {
          driverId: socket.driverId,
          available: data.available,
          timestamp: new Date()
        });

        logger.info(`Driver ${socket.driverId} availability changed to: ${data.available}`);
      } catch (error) {
        logger.error('Error updating driver availability:', error);
        socket.emit('error', { message: 'Failed to update availability' });
      }
    });
  }

  private handleDisconnection(socket: AuthenticatedSocket) {
    const { userId, userType, driverId } = socket;
    
    logger.info(`Socket disconnected: ${socket.id}, User: ${userId}, Type: ${userType}`);

    // Remove from connection maps
    if (userId) {
      this.connectedUsers.delete(userId);
    }

    if (driverId) {
      this.connectedDrivers.delete(driverId);
      
      // Note: Driver offline status tracking would require additional schema fields
      logger.info(`Driver ${driverId} disconnected`);

      // Notify about driver going offline
      this.io.emit('driver:offline', {
        driverId,
        timestamp: new Date()
      });
    }
  }

  // Public methods for emitting events from services
  public emitRideStatusUpdate(rideId: string, status: string, data?: any) {
    this.io.to(`ride:${rideId}`).emit('ride:status_update', {
      rideId,
      status,
      data,
      timestamp: new Date()
    });
  }

  public emitDeliveryStatusUpdate(deliveryId: string, status: string, data?: any) {
    this.io.to(`delivery:${deliveryId}`).emit('delivery:status_update', {
      deliveryId,
      status,
      data,
      timestamp: new Date()
    });
  }

  public emitWalletUpdate(userId: string, data: any) {
    this.io.to(`wallet:${userId}`).emit('wallet:update', {
      userId,
      ...data,
      timestamp: new Date()
    });
  }

  public emitPaymentUpdate(userId: string, paymentData: any) {
    this.io.to(`user:${userId}`).emit('payment:update', {
      userId,
      ...paymentData,
      timestamp: new Date()
    });
  }

  public notifyNearbyDrivers(location: { latitude: number, longitude: number }, rideData: any) {
    this.io.to('drivers').emit('ride:new_request', {
      ...rideData,
      pickupLocation: location,
      timestamp: new Date()
    });
  }

  public notifyNearbyDriversForDelivery(location: { latitude: number, longitude: number }, deliveryData: any) {
    this.io.to('drivers').emit('delivery:new_request', {
      ...deliveryData,
      pickupLocation: location,
      timestamp: new Date()
    });
  }
}

export const setupSocketIO = (io: Server) => {
  const socketService = new SocketService(io);
  return socketService.setupSocketIO();
};

export { SocketService };

export default setupSocketIO;