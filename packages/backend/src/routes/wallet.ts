import { Router } from 'express';
import { body, query } from 'express-validator';
import { WalletController } from '../controllers/wallet';
import { validate } from '../middlewares/validate';
import { requireAdmin } from '../middlewares/auth';

const router = Router();
const walletController = new WalletController();

// Get wallet balance
router.get('/balance', walletController.getBalance);

// Get transaction history
router.get('/transactions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('type').optional().isIn(['topup', 'payment', 'refund', 'penalty'])
], validate, walletController.getTransactionHistory);

// Top up wallet
router.post('/topup', [
  body('amount').isInt({ min: 1000 }).withMessage('Amount must be at least 1000 rials')
], validate, walletController.topUp);

// Process payment (internal use)
router.post('/payment', [
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('description').notEmpty().withMessage('Description is required'),
  body('reference_type').isIn(['ride', 'delivery']).withMessage('Reference type must be ride or delivery'),
  body('reference_id').isInt({ min: 1 }).withMessage('Reference ID must be a positive integer')
], validate, walletController.processPayment);

// Process refund
router.post('/refund', [
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('description').notEmpty().withMessage('Description is required'),
  body('reference_type').isIn(['ride', 'delivery']).withMessage('Reference type must be ride or delivery'),
  body('reference_id').isInt({ min: 1 }).withMessage('Reference ID must be a positive integer')
], validate, walletController.refund);

// Add penalty (admin only)
router.post('/penalty', requireAdmin, [
  body('user_id').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('description').optional().isString()
], validate, walletController.addPenalty);

// Get wallet statistics
router.get('/stats', walletController.getWalletStats);

export default router; 