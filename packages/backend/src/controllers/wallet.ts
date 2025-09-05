import { Request, Response } from 'express';
import '../middlewares/auth'; // Import to ensure global Request extension is available
import { query, beginTransaction, commitTransaction, rollbackTransaction } from '../config/database';
import { ValidationError, NotFoundError, ConflictError } from '../middlewares/errorHandler';
import logger from '../utils/logger';

export class WalletController {
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const walletResult = await query(
        'SELECT w.balance_rial, w.created_at, w.updated_at FROM wallet w WHERE w.user_id = $1',
        [req.user!.id]
      );

      if (walletResult.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      res.json({
        message: 'Balance retrieved successfully',
        balance: wallet.balance_rial,
        created_at: wallet.created_at,
        updated_at: wallet.updated_at
      });

    } catch (error) {
      logger.error('Get balance error:', error);
      throw error;
    }
  }

  async getTransactionHistory(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, type } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let whereClause = 'WHERE w.user_id = $1';
      const queryParams: any[] = [req.user!.id];

      if (type) {
        whereClause += ' AND wt.type = $2';
        queryParams.push(type);
      }

      const transactionsResult = await query(
        `SELECT 
          wt.transaction_id, 
          wt.amount_rial, 
          wt.description, 
          wt.type, 
          wt.reference_type, 
          wt.reference_id, 
          wt.created_at, 
          wt.status
        FROM wallet_transaction wt 
        JOIN wallet w ON wt.wallet_id = w.wallet_id 
        ${whereClause}
        ORDER BY wt.created_at DESC 
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`,
        [...queryParams, Number(limit), offset]
      );

      // Get total count for pagination
      const countResult = await query(
        `SELECT COUNT(*) as total 
        FROM wallet_transaction wt 
        JOIN wallet w ON wt.wallet_id = w.wallet_id 
        ${whereClause}`,
        queryParams
      );

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / Number(limit));

      res.json({
        message: 'Transaction history retrieved successfully',
        transactions: transactionsResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      });

    } catch (error) {
      logger.error('Get transaction history error:', error);
      throw error;
    }
  }

  async topUp(req: Request, res: Response): Promise<void> {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }

    const client = await beginTransaction();

    try {
      // Get user's wallet
      const walletResult = await client.query(
        'SELECT wallet_id, balance_rial FROM wallet WHERE user_id = $1',
        [req.user!.id]
      );

      if (walletResult.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      // Create top-up request
      const topupResult = await client.query(
        'INSERT INTO topup_request (wallet_id, amount_rial, status) VALUES ($1, $2, $3) RETURNING topup_id',
        [wallet.wallet_id, amount, 'pending']
      );

      const topupId = topupResult.rows[0].topup_id;

      // Create transaction record
      await client.query(
        'INSERT INTO wallet_transaction (wallet_id, amount_rial, description, type, reference_type, reference_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [wallet.wallet_id, amount, 'Wallet top-up', 'topup', 'topup', topupId, 'pending']
      );

      // In a real application, you would integrate with a payment gateway here
      // For now, we'll simulate successful payment
      await this.processTopUp(client, topupId, wallet.wallet_id, amount);

      await commitTransaction(client);

      logger.info(`Top-up successful for user ${req.user!.id}: ${amount} rials`);

      res.json({
        message: 'Top-up successful',
        topup_id: topupId,
        amount: amount,
        status: 'completed'
      });

    } catch (error) {
      await rollbackTransaction(client);
      logger.error('Top-up error:', error);
      throw error;
    }
  }

  private async processTopUp(client: any, topupId: number, walletId: number, amount: number): Promise<void> {
    // Update wallet balance
    await client.query(
      'UPDATE wallet SET balance_rial = balance_rial + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2',
      [amount, walletId]
    );

    // Update top-up request status
    await client.query(
      'UPDATE topup_request SET status = $1, confirmed_at = CURRENT_TIMESTAMP WHERE topup_id = $2',
      ['completed', topupId]
    );

    // Update transaction status
    await client.query(
      'UPDATE wallet_transaction SET status = $1 WHERE reference_type = $2 AND reference_id = $3',
      ['confirmed', 'topup', topupId]
    );
  }

  async processPayment(req: Request, res: Response): Promise<void> {
    const { amount, description, reference_type, reference_id } = req.body;

    if (!amount || amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }

    const client = await beginTransaction();

    try {
      // Get user's wallet
      const walletResult = await client.query(
        'SELECT wallet_id, balance_rial FROM wallet WHERE user_id = $1',
        [req.user!.id]
      );

      if (walletResult.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      // Check if user has sufficient balance
      if (wallet.balance_rial < amount) {
        throw new ValidationError('Insufficient balance');
      }

      // Deduct amount from wallet
      await client.query(
        'UPDATE wallet SET balance_rial = balance_rial - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2',
        [amount, wallet.wallet_id]
      );

      // Create transaction record
      const transactionResult = await client.query(
        'INSERT INTO wallet_transaction (wallet_id, amount_rial, description, type, reference_type, reference_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING transaction_id',
        [wallet.wallet_id, -amount, description, 'payment', reference_type, reference_id, 'confirmed']
      );

      await commitTransaction(client);

      logger.info(`Payment processed for user ${req.user!.id}: ${amount} rials`);

      res.json({
        message: 'Payment processed successfully',
        transaction_id: transactionResult.rows[0].transaction_id,
        amount: amount,
        remaining_balance: wallet.balance_rial - amount
      });

    } catch (error) {
      await rollbackTransaction(client);
      logger.error('Payment processing error:', error);
      throw error;
    }
  }

  async refund(req: Request, res: Response): Promise<void> {
    const { amount, description, reference_type, reference_id } = req.body;

    if (!amount || amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }

    const client = await beginTransaction();

    try {
      // Get user's wallet
      const walletResult = await client.query(
        'SELECT wallet_id, balance_rial FROM wallet WHERE user_id = $1',
        [req.user!.id]
      );

      if (walletResult.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      // Add refund amount to wallet
      await client.query(
        'UPDATE wallet SET balance_rial = balance_rial + $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2',
        [amount, wallet.wallet_id]
      );

      // Create transaction record
      const transactionResult = await client.query(
        'INSERT INTO wallet_transaction (wallet_id, amount_rial, description, type, reference_type, reference_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING transaction_id',
        [wallet.wallet_id, amount, description, 'refund', reference_type, reference_id, 'confirmed']
      );

      await commitTransaction(client);

      logger.info(`Refund processed for user ${req.user!.id}: ${amount} rials`);

      res.json({
        message: 'Refund processed successfully',
        transaction_id: transactionResult.rows[0].transaction_id,
        amount: amount,
        new_balance: wallet.balance_rial + amount
      });

    } catch (error) {
      await rollbackTransaction(client);
      logger.error('Refund processing error:', error);
      throw error;
    }
  }

  async addPenalty(req: Request, res: Response): Promise<void> {
    const { user_id, amount, description } = req.body;

    if (!amount || amount <= 0) {
      throw new ValidationError('Amount must be a positive number');
    }

    const client = await beginTransaction();

    try {
      // Get target user's wallet
      const walletResult = await client.query(
        'SELECT wallet_id, balance_rial FROM wallet WHERE user_id = $1',
        [user_id]
      );

      if (walletResult.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      // Deduct penalty amount from wallet
      await client.query(
        'UPDATE wallet SET balance_rial = balance_rial - $1, updated_at = CURRENT_TIMESTAMP WHERE wallet_id = $2',
        [amount, wallet.wallet_id]
      );

      // Create transaction record
      const transactionResult = await client.query(
        'INSERT INTO wallet_transaction (wallet_id, amount_rial, description, type, reference_type, reference_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING transaction_id',
        [wallet.wallet_id, -amount, description || 'Penalty charge', 'penalty', 'admin', req.user!.id, 'confirmed']
      );

      // Log admin action
      await client.query(
        'INSERT INTO admin_action_log (admin_id, action_type, target_user, details) VALUES ($1, $2, $3, $4)',
        [req.user!.id, 'penalty_applied', user_id, `Penalty of ${amount} rials applied: ${description}`]
      );

      await commitTransaction(client);

      logger.info(`Penalty applied by admin ${req.user!.id} to user ${user_id}: ${amount} rials`);

      res.json({
        message: 'Penalty applied successfully',
        transaction_id: transactionResult.rows[0].transaction_id,
        amount: amount,
        remaining_balance: wallet.balance_rial - amount
      });

    } catch (error) {
      await rollbackTransaction(client);
      logger.error('Penalty processing error:', error);
      throw error;
    }
  }

  async getWalletStats(req: Request, res: Response): Promise<void> {
    try {
      const walletResult = await query(
        'SELECT w.balance_rial, w.created_at FROM wallet w WHERE w.user_id = $1',
        [req.user!.id]
      );

      if (walletResult.rows.length === 0) {
        throw new NotFoundError('Wallet not found');
      }

      const wallet = walletResult.rows[0];

      // Get transaction statistics
      const statsResult = await query(
        `SELECT 
          COUNT(*) as total_transactions,
          SUM(CASE WHEN amount_rial > 0 THEN amount_rial ELSE 0 END) as total_credits,
          SUM(CASE WHEN amount_rial < 0 THEN ABS(amount_rial) ELSE 0 END) as total_debits,
          COUNT(CASE WHEN type = 'topup' THEN 1 END) as total_topups,
          COUNT(CASE WHEN type = 'payment' THEN 1 END) as total_payments,
          COUNT(CASE WHEN type = 'refund' THEN 1 END) as total_refunds
        FROM wallet_transaction wt 
        JOIN wallet w ON wt.wallet_id = w.wallet_id 
        WHERE w.user_id = $1 AND wt.status = 'confirmed'`,
        [req.user!.id]
      );

      const stats = statsResult.rows[0];

      res.json({
        message: 'Wallet statistics retrieved successfully',
        current_balance: wallet.balance_rial,
        wallet_created: wallet.created_at,
        statistics: {
          total_transactions: parseInt(stats.total_transactions),
          total_credits: parseInt(stats.total_credits) || 0,
          total_debits: parseInt(stats.total_debits) || 0,
          total_topups: parseInt(stats.total_topups),
          total_payments: parseInt(stats.total_payments),
          total_refunds: parseInt(stats.total_refunds)
        }
      });

    } catch (error) {
      logger.error('Get wallet stats error:', error);
      throw error;
    }
  }
}