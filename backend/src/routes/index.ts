import { Express } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import rideRoutes from './ride.routes';
import deliveryRoutes from './delivery.routes';
import walletRoutes from './wallet.routes';
import vehicleRoutes from './vehicle.routes';
import adminRoutes from './admin.routes';
import driverRoutes from './driver.routes';

export const setupRoutes = (app: Express) => {
  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/rides', rideRoutes);
  app.use('/api/deliveries', deliveryRoutes);
  app.use('/api/wallet', walletRoutes);
  app.use('/api/vehicles', vehicleRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/driver', driverRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      error: 'Route not found',
    });
  });
}; 