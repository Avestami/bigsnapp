import { Router } from 'express';
import { body } from 'express-validator';
import { AuthController } from '../controllers/auth';
import { validate } from '../middlewares/validate';
import { authenticateToken } from '../middlewares/auth';

const router = Router();
const authController = new AuthController();

// Registration validation rules
const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('phone_number').isMobilePhone('any').withMessage('Please provide a valid phone number'),
  body('user_type').isIn(['rider', 'driver']).withMessage('User type must be rider or driver'),
];

// Login validation rules
const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Change password validation rules
const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
];

// Routes
router.post('/register', registerValidation, validate, authController.register);
router.post('/login', loginValidation, validate, authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticateToken, authController.logout);
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], validate, authController.forgotPassword);
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], validate, authController.resetPassword);
router.post('/change-password', authenticateToken, changePasswordValidation, validate, authController.changePassword);
router.get('/profile', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('phone_number').optional().isMobilePhone('any'),
], validate, authController.updateProfile);

export default router; 