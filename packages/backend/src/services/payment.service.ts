import { PaymentRepository } from '../db/repositories/payment.repository';
import { WalletRepository } from '../db/repositories/wallet.repository';
import { UserRepository } from '../db/repositories/user.repository';
import {
  CreatePaymentRequest,
  TopupWalletRequest,
  PaymentFilters,
  WalletTransactionFilters,
  PaymentGatewayCallbackRequest,
  PaymentResponse,
  WalletResponse,
  PaymentListResponse,
  WalletTransactionListResponse,
  PaymentStatisticsResponse
} from '../types/payment.types';
import { PaymentStatus, PaymentMethodType, WalletTransactionType, UserType } from '@prisma/client';
import { AppError, NotFoundError, ValidationError } from '../middlewares/errorHandler';
import * as crypto from 'crypto';

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private walletRepository: WalletRepository;
  private userRepository: UserRepository;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.walletRepository = new WalletRepository();
    this.userRepository = new UserRepository();
  }

  async createPayment(userId: string, paymentData: CreatePaymentRequest): Promise<PaymentResponse> {
    // Validate user exists
    const user = await this.userRepository.findById(parseInt(userId));
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate payment reference
    const reference = this.generatePaymentReference();

    // Create payment record
    const payment = await this.paymentRepository.create({
      userId: parseInt(userId),
      amount: BigInt(paymentData.amount),
      paymentMethodId: 1 // Default payment method ID, should be passed from request
    });

    return this.formatPaymentResponse(payment);
  }

  async getPaymentById(paymentId: string, userId: string, userType: UserType): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(parseInt(paymentId));
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check authorization - users can only see their own payments, admins can see all
    if (userType !== UserType.ADMIN && payment.userId !== parseInt(userId)) {
      throw new ValidationError('Access denied');
    }

    return this.formatPaymentResponse(payment);
  }

  async getPayments(
    userId: string,
    userType: UserType,
    filters: PaymentFilters,
    skip: number,
    limit: number
  ): Promise<PaymentListResponse> {
    // Build where clause based on user type and filters
    const whereClause: any = {};

    // Users can only see their own payments, admins can see all
    if (userType !== UserType.ADMIN) {
      whereClause.userId = userId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.method) {
      whereClause.method = filters.method;
    }

    // Note: type filter removed as it's not available in PaymentFilters

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.minAmount || filters.maxAmount) {
      whereClause.amount = {};
      if (filters.minAmount) {
        whereClause.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount) {
        whereClause.amount.lte = filters.maxAmount;
      }
    }

    const [payments, total] = await Promise.all([
      this.paymentRepository.findMany(whereClause),
      this.paymentRepository.count(whereClause)
    ]);

    return {
      payments: payments.map(payment => this.formatPaymentResponse(payment)),
      total
    };
  }

  async processPayment(paymentId: string, userId: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(parseInt(paymentId));
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== parseInt(userId)) {
      throw new ValidationError('Access denied');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ValidationError('Payment cannot be processed');
    }

    // Simulate payment processing based on method
    let updatedPayment;
    
    // For now, process all payments as pending and handle via gateway
    // TODO: Implement wallet payment processing when payment method details are available
    updatedPayment = await this.paymentRepository.update(parseInt(paymentId), {
      status: PaymentStatus.PENDING
    });

    return this.formatPaymentResponse(updatedPayment);
  }

  async cancelPayment(paymentId: string, userId: string, reason?: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(parseInt(paymentId));
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.userId !== parseInt(userId)) {
      throw new ValidationError('Access denied');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new ValidationError('Payment cannot be cancelled');
    }

    const updatedPayment = await this.paymentRepository.update(parseInt(paymentId), {
      status: PaymentStatus.FAILED,
      // Payment cancelled: ${reason}
    });

    return this.formatPaymentResponse(updatedPayment);
  }

  async topupWallet(userId: string, topupData: TopupWalletRequest): Promise<{ payment: PaymentResponse; wallet: WalletResponse }> {
    // Get or create wallet
    let wallet = await this.walletRepository.findByUserId(parseInt(userId));
    if (!wallet) {
      wallet = await this.walletRepository.create({
        userId: parseInt(userId),
        balanceRial: BigInt(0)
      });
    }

    // Create payment for topup
    const payment = await this.createPayment(userId, {
      amount: topupData.amount,
      method: topupData.method,
      description: 'Wallet topup',
      metadata: topupData.metadata
    });

    return {
      payment,
      wallet: this.formatWalletResponse(wallet)
    };
  }

  async getWalletBalance(userId: string): Promise<WalletResponse> {
    let wallet = await this.walletRepository.findByUserId(parseInt(userId));
    if (!wallet) {
      wallet = await this.walletRepository.create({
        userId: parseInt(userId),
        balanceRial: BigInt(0)
      });
    }

    return this.formatWalletResponse(wallet);
  }

  async getWalletTransactions(
    userId: string,
    filters: WalletTransactionFilters,
    skip: number,
    limit: number
  ): Promise<WalletTransactionListResponse> {
    const whereClause: any = {
      wallet: {
        userId
      }
    };

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.minAmount || filters.maxAmount) {
      whereClause.amount = {};
      if (filters.minAmount) {
        whereClause.amount.gte = filters.minAmount;
      }
      if (filters.maxAmount) {
        whereClause.amount.lte = filters.maxAmount;
      }
    }

    // Get wallet first to get transactions
    const wallet = await this.walletRepository.findByUserId(parseInt(userId));
    if (!wallet) {
      return { transactions: [], total: 0 };
    }

    const paginatedResult = await this.walletRepository.getTransactionsPaginated(
      wallet.id,
      { page: Math.floor(skip / limit) + 1, limit, type: filters?.type }
    );

    const transactions = paginatedResult.data.map(transaction => ({
      id: transaction.id.toString(),
      walletId: transaction.walletId.toString(),
      amount: Number(transaction.amountRial),
      type: transaction.type,
      description: transaction.referenceType || 'Transaction',
      reference: transaction.referenceId?.toString(),
      createdAt: transaction.createdAt
    }));
    const total = paginatedResult.total;

    return {
      transactions,
      total
    };
  }

  async handlePaymentGatewayCallback(gateway: string, callbackData: PaymentGatewayCallbackRequest): Promise<PaymentResponse> {
    // Find payment by reference (assuming reference is payment ID)
    const payment = await this.paymentRepository.findById(parseInt(callbackData.reference));
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Verify callback authenticity (implement gateway-specific verification)
    const isValid = await this.verifyGatewayCallback(gateway, callbackData);
    if (!isValid) {
      throw new ValidationError('Invalid callback signature');
    }

    // Update payment status based on callback
    const status = this.mapGatewayStatusToPaymentStatus(callbackData.status);
    const updatedPayment = await this.paymentRepository.update(payment.id, {
      status
    });

    // If payment is confirmed, check if it needs wallet processing
    if (status === PaymentStatus.CONFIRMED) {
      await this.processWalletTopup(payment.userId.toString(), Number(payment.amount), payment.id.toString());
    }

    return this.formatPaymentResponse(updatedPayment);
  }

  async refundPayment(paymentId: string, amount: number, reason: string, adminId: string): Promise<PaymentResponse> {
    const payment = await this.paymentRepository.findById(parseInt(paymentId));
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (payment.status !== PaymentStatus.CONFIRMED) {
      throw new ValidationError('Only confirmed payments can be refunded');
    }

    if (amount > Number(payment.amount)) {
      throw new ValidationError('Refund amount cannot exceed payment amount');
    }

    // Create refund payment
    const refund = await this.paymentRepository.create({
      userId: payment.userId,
      amount: BigInt(amount),
      paymentMethodId: payment.paymentMethodId
    });

    // Update refund status to confirmed
    await this.paymentRepository.update(refund.id, {
      status: PaymentStatus.CONFIRMED
    });

    // Always process wallet topup for refunds
    await this.processWalletTopup(payment.userId.toString(), amount, refund.id.toString());

    return this.formatPaymentResponse(refund);
  }

  async getPaymentStatistics(
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<PaymentStatisticsResponse> {
    // TODO: Implement getStatistics method in PaymentRepository
    throw new ValidationError('Payment statistics not implemented yet');
  }

  // Private helper methods
  private async processWalletPayment(payment: any): Promise<any> {
    const wallet = await this.walletRepository.findByUserId(payment.userId);
    if (!wallet || Number(wallet.balanceRial) < payment.amount) {
      throw new ValidationError('Insufficient wallet balance');
    }

    // Deduct from wallet and update payment status
    await this.walletRepository.createTransaction({
      walletId: wallet.id,
      amountRial: BigInt(-payment.amount),
      type: WalletTransactionType.PAYMENT,
      description: payment.description || 'Payment',
      referenceId: parseInt(payment.id),
      status: 'CONFIRMED'
    });

    return await this.paymentRepository.update(payment.id, {
      status: PaymentStatus.CONFIRMED
    });
  }

  private async processWalletTopup(userId: string, amount: number, paymentId: string): Promise<void> {
    const wallet = await this.walletRepository.findByUserId(parseInt(userId));
    if (!wallet) {
      throw new NotFoundError('Wallet not found');
    }

    await this.walletRepository.createTransaction({
      walletId: wallet.id,
      amountRial: BigInt(amount),
      type: WalletTransactionType.TOPUP,
      description: 'Wallet topup',
      referenceId: parseInt(paymentId),
      status: 'CONFIRMED'
    });
  }

  private generatePaymentReference(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString('hex');
    return `PAY_${timestamp}_${random}`.toUpperCase();
  }

  private async verifyGatewayCallback(gateway: string, callbackData: PaymentGatewayCallbackRequest): Promise<boolean> {
    // Implement gateway-specific signature verification
    // This is a placeholder - implement actual verification logic for each gateway
    switch (gateway.toLowerCase()) {
      case 'stripe':
        return this.verifyStripeCallback(callbackData);
      case 'paypal':
        return this.verifyPayPalCallback(callbackData);
      case 'razorpay':
        return this.verifyRazorpayCallback(callbackData);
      default:
        return true; // For demo purposes
    }
  }

  private async verifyStripeCallback(callbackData: PaymentGatewayCallbackRequest): Promise<boolean> {
    // Implement Stripe webhook signature verification
    return true;
  }

  private async verifyPayPalCallback(callbackData: PaymentGatewayCallbackRequest): Promise<boolean> {
    // Implement PayPal IPN verification
    return true;
  }

  private async verifyRazorpayCallback(callbackData: PaymentGatewayCallbackRequest): Promise<boolean> {
    // Implement Razorpay webhook signature verification
    return true;
  }

  private mapGatewayStatusToPaymentStatus(gatewayStatus: string): PaymentStatus {
    const statusMap: { [key: string]: PaymentStatus } = {
      'success': PaymentStatus.CONFIRMED,
      'completed': PaymentStatus.CONFIRMED,
      'paid': PaymentStatus.CONFIRMED,
      'failed': PaymentStatus.FAILED,
      'cancelled': PaymentStatus.FAILED,
      'pending': PaymentStatus.PENDING,
      'processing': PaymentStatus.PENDING
    };

    return statusMap[gatewayStatus.toLowerCase()] || PaymentStatus.FAILED;
  }

  private formatPaymentResponse(payment: any): PaymentResponse {
    return {
      id: payment.id,
      userId: payment.userId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      reference: payment.reference,
      description: payment.description,
      gatewayTransactionId: payment.gatewayTransactionId,
      metadata: payment.metadata,
      createdAt: payment.createdAt,
      processedAt: payment.processedAt
    };
  }

  private formatWalletResponse(wallet: any): WalletResponse {
    return {
      id: wallet.id,
      userId: wallet.userId,
      balance: wallet.balance,
      createdAt: wallet.createdAt,
      updatedAt: wallet.updatedAt
    };
  }
}