import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authenticate, adminOnly } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: 'Too many authentication attempts, please try again later',
});

const strictAuthRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many password reset attempts, please try again later',
});

// Public routes (no authentication required)

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { firstName, lastName, email, phoneNumber, password, userType, dateOfBirth?, profilePicture? }
 */
router.post('/register', authRateLimit, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 * @body    { refreshToken }
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @body    { email }
 */
router.post('/forgot-password', strictAuthRateLimit, authController.requestPasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Confirm password reset with token
 * @access  Public
 * @body    { resetToken, newPassword }
 */
router.post('/reset-password', strictAuthRateLimit, authController.confirmPasswordReset);

/**
 * @route   POST /api/auth/validate
 * @desc    Validate token
 * @access  Public
 * @body    { token }
 */
router.post('/validate', authController.validateToken);

// Protected routes (authentication required)

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Change user password
 * @access  Private
 * @body    { currentPassword, newPassword }
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token invalidation)
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

// Admin-only routes

/**
 * @route   PUT /api/auth/users/:userId/deactivate
 * @desc    Deactivate user account (Admin only)
 * @access  Admin
 * @params  userId
 * @body    { reason? }
 */
router.put('/users/:userId/deactivate', authenticate, adminOnly, authController.deactivateUser);

/**
 * @route   PUT /api/auth/users/:userId/activate
 * @desc    Activate user account (Admin only)
 * @access  Admin
 * @params  userId
 * @body    { reason? }
 */
router.put('/users/:userId/activate', authenticate, adminOnly, authController.activateUser);

export default router;