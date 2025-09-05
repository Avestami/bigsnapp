import { Router } from 'express';
import authRoutes from './auth.routes';
import rideRoutes from './ride.routes';
import deliveryRoutes from './delivery.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API version info
router.get('/version', (req, res) => {
  res.status(200).json({
    success: true,
    version: '1.0.0',
    api: 'Snapp Clone API',
    timestamp: new Date().toISOString(),
  });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/rides', rideRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

// TODO: Add other route modules as they are created
// router.use('/users', userRoutes);
// router.use('/drivers', driverRoutes);
// router.use('/vehicles', vehicleRoutes);
// router.use('/reviews', reviewRoutes);

export default router;