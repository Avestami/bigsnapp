import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  updateProfileSchema,
  updateDriverProfileSchema,
  registerDeviceSchema,
  addFavoriteLocationSchema,
} from '../utils/validators/user.validators';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.get('/stats', userController.getUserStats);

// Driver-specific routes
router.put(
  '/driver-profile',
  authorize('driver'),
  validate(updateDriverProfileSchema),
  userController.updateDriverProfile
);

// Device management
router.get('/devices', userController.getDevices);
router.post('/devices', validate(registerDeviceSchema), userController.registerDevice);

// Favorite locations
router.get('/favorites', userController.getFavoriteLocations);
router.post('/favorites', validate(addFavoriteLocationSchema), userController.addFavoriteLocation);
router.delete('/favorites/:id', userController.removeFavoriteLocation);

export default router; 