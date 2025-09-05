import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PaymentController } from '../controllers/payment.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth';
import { PaymentMethodType, PaymentStatus, WalletTransactionType, UserType } from '@prisma/client';

const router = Router();
const paymentController = new PaymentController();

// Apply authentication to all routes
router.use(authenticateToken);

// Create payment
router.post(
  '/',
  // Rate limiting removed - implement if needed
  [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('method')
      .isIn(Object.values(PaymentMethodType))
      .withMessage('Invalid payment method'),
    body('type')
      .optional()
      .isString()
      .withMessage('Type must be a string'),
    body('description')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Description must be a string with max 500 characters'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  paymentController.createPayment
);

// Get payment by ID
router.get(
  '/:paymentId',
  [
    param('paymentId')
      .isUUID()
      .withMessage('Invalid payment ID')
  ],
  paymentController.getPaymentById
);

// Get payments with filters
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('status')
      .optional()
      .isIn(Object.values(PaymentStatus))
      .withMessage('Invalid payment status'),
    query('method')
      .optional()
      .isIn(Object.values(PaymentMethodType))
      .withMessage('Invalid payment method'),
    query('type')
      .optional(),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Min amount must be a non-negative number'),
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Max amount must be a non-negative number')
  ],
  paymentController.getPayments
);

// Process payment
router.post(
  '/:paymentId/process',
  // Rate limiting removed - implement if needed
  [
    param('paymentId')
      .isUUID()
      .withMessage('Invalid payment ID')
  ],
  paymentController.processPayment
);

// Cancel payment
router.post(
  '/:paymentId/cancel',
  // Rate limiting removed - implement if needed
  [
    param('paymentId')
      .isUUID()
      .withMessage('Invalid payment ID'),
    body('reason')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Reason must be a string with max 500 characters')
  ],
  paymentController.cancelPayment
);

// Wallet routes
// Topup wallet
router.post(
  '/wallet/topup',
  // Rate limiting removed - implement if needed
  [
    body('amount')
      .isFloat({ min: 1 })
      .withMessage('Amount must be at least 1'),
    body('method')
      .isIn([PaymentMethodType.CREDIT_CARD, PaymentMethodType.BANK_TRANSFER])
      .withMessage('Invalid payment method for topup'),
    body('metadata')
      .optional()
      .isObject()
      .withMessage('Metadata must be an object')
  ],
  paymentController.topupWallet
);

// Get wallet balance
router.get('/wallet/balance', paymentController.getWalletBalance);

// Get wallet transactions
router.get(
  '/wallet/transactions',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('type')
      .optional()
      .isIn(Object.values(WalletTransactionType))
      .withMessage('Invalid transaction type'),
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('minAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Min amount must be a non-negative number'),
    query('maxAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Max amount must be a non-negative number')
  ],
  paymentController.getWalletTransactions
);

// Payment gateway callback (no authentication required)
router.post(
  '/callback/:gateway',
  // Rate limiting removed - implement if needed
  [
    param('gateway')
      .isIn(['stripe', 'paypal', 'razorpay', 'paytm', 'phonepe'])
      .withMessage('Invalid payment gateway'),
    body('reference')
      .isString()
      .notEmpty()
      .withMessage('Reference is required'),
    body('transactionId')
      .isString()
      .notEmpty()
      .withMessage('Transaction ID is required'),
    body('status')
      .isString()
      .notEmpty()
      .withMessage('Status is required'),
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a non-negative number')
  ],
  paymentController.paymentGatewayCallback
);

// Admin routes
// Refund payment (Admin only)
router.post(
  '/:paymentId/refund',
  requireAdmin,
  // Rate limiting removed - implement if needed
  [
    param('paymentId')
      .isUUID()
      .withMessage('Invalid payment ID'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),
    body('reason')
      .isString()
      .notEmpty()
      .isLength({ max: 500 })
      .withMessage('Reason is required and must be max 500 characters')
  ],
  paymentController.refundPayment
);

// Get payment statistics (Admin only)
router.get(
  '/admin/statistics',
  requireAdmin,
  [
    query('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid ISO 8601 date'),
    query('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid ISO 8601 date'),
    query('groupBy')
      .optional()
      .isIn(['day', 'week', 'month'])
      .withMessage('Group by must be day, week, or month')
  ],
  paymentController.getPaymentStatistics
);

export default router;