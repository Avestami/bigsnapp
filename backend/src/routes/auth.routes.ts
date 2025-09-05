import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  verifyPhoneSchema,
  changePasswordSchema,
} from '../utils/validators/auth.validators';

const router = Router();

// Public routes
router.post('/register', authRateLimiter, validate(registerSchema), authController.register);
router.post('/login', authRateLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refreshToken);

// Protected routes
router.post('/verify-phone', authenticate, validate(verifyPhoneSchema), authController.verifyPhone);
router.post('/send-verification', authenticate, authController.sendVerificationCode);
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router; 