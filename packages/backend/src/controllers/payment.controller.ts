import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { PaymentService } from '../services/payment.service';
import { asyncHandler } from '../middleware/error.middleware';
import '../middlewares/auth';
import {
  CreatePaymentRequest,
  TopupWalletRequest,
  PaymentFilters,
  WalletTransactionFilters,
  PaymentGatewayCallbackRequest
} from '../types/payment.types';
import { UserType } from '@prisma/client';

export class PaymentController {
  private paymentService: PaymentService;

  constructor() {
    this.paymentService = new PaymentService();
  }

  // Create a new payment
  createPayment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.id.toString();
    const paymentData: CreatePaymentRequest = req.body;

    const payment = await this.paymentService.createPayment(userId, paymentData);

    return res.status(201).json({
      success: true,
      message: 'Payment created successfully',
      data: payment
    });
  });

  // Get payment by ID
  getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentId } = req.params;
    const userId = req.user!.id.toString();
    const userType = req.user!.userType;

    const payment = await this.paymentService.getPaymentById(paymentId, userId, userType);

    return res.json({
      success: true,
      data: payment
    });
  });

  // Get payments with filters
  getPayments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id.toString();
    const userType = req.user!.userType;
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: PaymentFilters = {
      status: req.query.status as any,
      method: req.query.method as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined
    };

    const result = await this.paymentService.getPayments(userId, userType, filters, skip, limit);

    res.json({
      success: true,
      data: result.payments,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  });

  // Process payment
  processPayment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentId } = req.params;
    const userId = req.user!.id.toString();

    const payment = await this.paymentService.processPayment(paymentId, userId);

    return res.json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  });

  // Cancel payment
  cancelPayment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentId } = req.params;
    const userId = req.user!.id.toString();
    const { reason } = req.body;

    const payment = await this.paymentService.cancelPayment(paymentId, userId, reason);

    return res.json({
      success: true,
      message: 'Payment cancelled successfully',
      data: payment
    });
  });

  // Topup wallet
  topupWallet = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user!.id.toString();
    const topupData: TopupWalletRequest = req.body;

    const result = await this.paymentService.topupWallet(userId, topupData);

    return res.status(201).json({
      success: true,
      message: 'Wallet topup initiated successfully',
      data: result
    });
  });

  // Get wallet balance
  getWalletBalance = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id.toString();

    const wallet = await this.paymentService.getWalletBalance(userId);

    return res.json({
      success: true,
      data: wallet
    });
  });

  // Get wallet transactions
  getWalletTransactions = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id.toString();
    
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filters: WalletTransactionFilters = {
      type: req.query.type as any,
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      minAmount: req.query.minAmount ? parseFloat(req.query.minAmount as string) : undefined,
      maxAmount: req.query.maxAmount ? parseFloat(req.query.maxAmount as string) : undefined
    };

    const result = await this.paymentService.getWalletTransactions(userId, filters, skip, limit);

    return res.json({
      success: true,
      data: result.transactions,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    });
  });

  // Payment gateway callback
  paymentGatewayCallback = asyncHandler(async (req: Request, res: Response) => {
    const callbackData: PaymentGatewayCallbackRequest = req.body;
    const { gateway } = req.params;

    const result = await this.paymentService.handlePaymentGatewayCallback(gateway, callbackData);

    return res.json({
      success: true,
      message: 'Payment callback processed successfully',
      data: result
    });
  });

  // Refund payment
  refundPayment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { paymentId } = req.params;
    const { amount, reason } = req.body;
    const adminId = req.user!.id.toString();
    const refund = await this.paymentService.refundPayment(paymentId, amount, reason, adminId);

    return res.json({
      success: true,
      message: 'Payment refunded successfully',
      data: refund
    });
  });

  // Get payment statistics (Admin only)
  getPaymentStatistics = asyncHandler(async (req: Request, res: Response) => {
    const { startDate, endDate, groupBy } = req.query;

    const stats = await this.paymentService.getPaymentStatistics(
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      groupBy as 'day' | 'week' | 'month' | undefined
    );

    return res.json({
      success: true,
      data: stats
    });
  });
}