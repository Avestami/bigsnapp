import { PaymentService } from '../../../src/services/payment.service';
import { PaymentRepository } from '../../../src/db/repositories/payment.repository';
import { WalletRepository } from '../../../src/db/repositories/wallet.repository';
import { UserRepository } from '../../../src/db/repositories/user.repository';
import { PaymentStatus, PaymentMethod, PaymentType, WalletTransactionType, UserType } from '@prisma/client';
import { AppError } from '../../../src/utils/AppError';
import crypto from 'crypto';

// Mock dependencies
jest.mock('../../../src/db/repositories/payment.repository');
jest.mock('../../../src/db/repositories/wallet.repository');
jest.mock('../../../src/db/repositories/user.repository');
jest.mock('crypto');

const mockPaymentRepository = PaymentRepository as jest.MockedClass<typeof PaymentRepository>;
const mockWalletRepository = WalletRepository as jest.MockedClass<typeof WalletRepository>;
const mockUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let paymentRepositoryInstance: jest.Mocked<PaymentRepository>;
  let walletRepositoryInstance: jest.Mocked<WalletRepository>;
  let userRepositoryInstance: jest.Mocked<UserRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    paymentRepositoryInstance = {
      create: jest.fn(),
      findById: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      getStatistics: jest.fn(),
    } as any;

    walletRepositoryInstance = {
      findByUserId: jest.fn(),
      create: jest.fn(),
      updateBalance: jest.fn(),
      createTransaction: jest.fn(),
      getTransactions: jest.fn(),
    } as any;

    userRepositoryInstance = {
      findById: jest.fn(),
    } as any;

    mockPaymentRepository.mockImplementation(() => paymentRepositoryInstance);
    mockWalletRepository.mockImplementation(() => walletRepositoryInstance);
    mockUserRepository.mockImplementation(() => userRepositoryInstance);

    paymentService = new PaymentService();
  });

  describe('createPayment', () => {
    const userId = 'user-1';
    const paymentData = {
      amount: 100,
      method: PaymentMethod.CARD,
      type: PaymentType.RIDE,
      description: 'Ride payment'
    };

    beforeEach(() => {
      mockCrypto.randomBytes = jest.fn().mockReturnValue(Buffer.from('abcd1234', 'hex'));
      jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
    });

    it('should create payment successfully', async () => {
      const mockUser = { id: userId, type: UserType.USER };
      const mockPayment = {
        id: 'payment-1',
        userId,
        amount: 100,
        method: PaymentMethod.CARD,
        type: PaymentType.RIDE,
        status: PaymentStatus.PENDING,
        reference: 'PAY_1234567890000_ABCD1234',
        description: 'Ride payment',
        createdAt: new Date()
      };

      userRepositoryInstance.findById.mockResolvedValue(mockUser);
      paymentRepositoryInstance.create.mockResolvedValue(mockPayment);

      const result = await paymentService.createPayment(userId, paymentData);

      expect(userRepositoryInstance.findById).toHaveBeenCalledWith(userId);
      expect(paymentRepositoryInstance.create).toHaveBeenCalledWith({
        userId,
        amount: 100,
        method: PaymentMethod.CARD,
        type: PaymentType.RIDE,
        reference: 'PAY_1234567890000_ABCD1234',
        description: 'Ride payment',
        status: PaymentStatus.PENDING
      });
      expect(result).toEqual({
        id: 'payment-1',
        userId,
        amount: 100,
        method: PaymentMethod.CARD,
        type: PaymentType.RIDE,
        status: PaymentStatus.PENDING,
        reference: 'PAY_1234567890000_ABCD1234',
        description: 'Ride payment',
        gatewayTransactionId: undefined,
        metadata: undefined,
        createdAt: mockPayment.createdAt,
        processedAt: undefined
      });
    });

    it('should throw error if user not found', async () => {
      userRepositoryInstance.findById.mockResolvedValue(null);

      await expect(paymentService.createPayment(userId, paymentData))
        .rejects.toThrow(new AppError('User not found', 404));
    });
  });

  describe('getPaymentById', () => {
    const paymentId = 'payment-1';
    const userId = 'user-1';
    const mockPayment = {
      id: paymentId,
      userId,
      amount: 100,
      method: PaymentMethod.CARD,
      type: PaymentType.RIDE,
      status: PaymentStatus.COMPLETED,
      reference: 'PAY_123',
      createdAt: new Date()
    };

    it('should return payment for admin user', async () => {
      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentById(paymentId, 'admin-1', UserType.ADMIN);

      expect(paymentRepositoryInstance.findById).toHaveBeenCalledWith(paymentId);
      expect(result.id).toBe(paymentId);
    });

    it('should return payment for owner user', async () => {
      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);

      const result = await paymentService.getPaymentById(paymentId, userId, UserType.USER);

      expect(result.id).toBe(paymentId);
    });

    it('should throw error if payment not found', async () => {
      paymentRepositoryInstance.findById.mockResolvedValue(null);

      await expect(paymentService.getPaymentById(paymentId, userId, UserType.USER))
        .rejects.toThrow(new AppError('Payment not found', 404));
    });

    it('should throw error if user not authorized', async () => {
      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);

      await expect(paymentService.getPaymentById(paymentId, 'other-user', UserType.USER))
        .rejects.toThrow(new AppError('Access denied', 403));
    });
  });

  describe('getPayments', () => {
    const userId = 'user-1';
    const filters = { status: PaymentStatus.COMPLETED };
    const mockPayments = [
      {
        id: 'payment-1',
        userId,
        amount: 100,
        status: PaymentStatus.COMPLETED,
        createdAt: new Date()
      }
    ];

    it('should return payments for admin user', async () => {
      paymentRepositoryInstance.findMany.mockResolvedValue({
        payments: mockPayments,
        total: 1
      });

      const result = await paymentService.getPayments('admin-1', UserType.ADMIN, filters, 0, 10);

      expect(paymentRepositoryInstance.findMany).toHaveBeenCalledWith(filters, 0, 10);
      expect(result.payments).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should return user-specific payments for regular user', async () => {
      paymentRepositoryInstance.findMany.mockResolvedValue({
        payments: mockPayments,
        total: 1
      });

      const result = await paymentService.getPayments(userId, UserType.USER, filters, 0, 10);

      expect(paymentRepositoryInstance.findMany).toHaveBeenCalledWith(
        { ...filters, userId },
        0,
        10
      );
      expect(result.payments).toHaveLength(1);
    });
  });

  describe('processPayment', () => {
    const paymentId = 'payment-1';
    const userId = 'user-1';
    const mockPayment = {
      id: paymentId,
      userId,
      amount: 100,
      method: PaymentMethod.WALLET,
      status: PaymentStatus.PENDING
    };

    it('should process wallet payment successfully', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId,
        balance: 200
      };
      const updatedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        processedAt: new Date()
      };

      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);
      walletRepositoryInstance.findByUserId.mockResolvedValue(mockWallet);
      paymentRepositoryInstance.update.mockResolvedValue(updatedPayment);

      const result = await paymentService.processPayment(paymentId, userId);

      expect(walletRepositoryInstance.updateBalance).toHaveBeenCalledWith('wallet-1', -100);
      expect(walletRepositoryInstance.createTransaction).toHaveBeenCalledWith({
        walletId: 'wallet-1',
        amount: -100,
        type: WalletTransactionType.DEBIT,
        description: undefined,
        reference: paymentId
      });
      expect(result.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should throw error if payment not found', async () => {
      paymentRepositoryInstance.findById.mockResolvedValue(null);

      await expect(paymentService.processPayment(paymentId, userId))
        .rejects.toThrow(new AppError('Payment not found', 404));
    });

    it('should throw error if payment already processed', async () => {
      const processedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED
      };
      paymentRepositoryInstance.findById.mockResolvedValue(processedPayment);

      await expect(paymentService.processPayment(paymentId, userId))
        .rejects.toThrow(new AppError('Payment already processed or cancelled', 400));
    });

    it('should throw error if insufficient wallet balance', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId,
        balance: 50 // Less than payment amount
      };

      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);
      walletRepositoryInstance.findByUserId.mockResolvedValue(mockWallet);

      await expect(paymentService.processPayment(paymentId, userId))
        .rejects.toThrow(new AppError('Insufficient wallet balance', 400));
    });
  });

  describe('cancelPayment', () => {
    const paymentId = 'payment-1';
    const userId = 'user-1';
    const mockPayment = {
      id: paymentId,
      userId,
      amount: 100,
      status: PaymentStatus.PENDING
    };

    it('should cancel payment successfully', async () => {
      const cancelledPayment = {
        ...mockPayment,
        status: PaymentStatus.CANCELLED,
        metadata: { cancellationReason: 'User requested' }
      };

      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);
      paymentRepositoryInstance.update.mockResolvedValue(cancelledPayment);

      const result = await paymentService.cancelPayment(paymentId, userId, 'User requested');

      expect(paymentRepositoryInstance.update).toHaveBeenCalledWith(paymentId, {
        status: PaymentStatus.CANCELLED,
        metadata: { cancellationReason: 'User requested' }
      });
      expect(result.status).toBe(PaymentStatus.CANCELLED);
    });

    it('should throw error if payment cannot be cancelled', async () => {
      const completedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED
      };
      paymentRepositoryInstance.findById.mockResolvedValue(completedPayment);

      await expect(paymentService.cancelPayment(paymentId, userId))
        .rejects.toThrow(new AppError('Payment cannot be cancelled', 400));
    });
  });

  describe('topupWallet', () => {
    const userId = 'user-1';
    const topupData = {
      amount: 100,
      method: PaymentMethod.CARD
    };

    beforeEach(() => {
      mockCrypto.randomBytes = jest.fn().mockReturnValue(Buffer.from('abcd1234', 'hex'));
      jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
    });

    it('should create topup payment and wallet if not exists', async () => {
      const mockUser = { id: userId, type: UserType.USER };
      const mockPayment = {
        id: 'payment-1',
        userId,
        amount: 100,
        method: PaymentMethod.CARD,
        type: PaymentType.TOPUP,
        status: PaymentStatus.PENDING,
        reference: 'PAY_1234567890000_ABCD1234'
      };
      const mockWallet = {
        id: 'wallet-1',
        userId,
        balance: 0
      };

      userRepositoryInstance.findById.mockResolvedValue(mockUser);
      paymentRepositoryInstance.create.mockResolvedValue(mockPayment);
      walletRepositoryInstance.findByUserId.mockResolvedValue(null);
      walletRepositoryInstance.create.mockResolvedValue(mockWallet);

      const result = await paymentService.topupWallet(userId, topupData);

      expect(walletRepositoryInstance.create).toHaveBeenCalledWith({
        userId,
        balance: 0
      });
      expect(result.payment.type).toBe(PaymentType.TOPUP);
      expect(result.wallet.id).toBe('wallet-1');
    });
  });

  describe('getWalletBalance', () => {
    const userId = 'user-1';

    it('should return existing wallet balance', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId,
        balance: 150,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      walletRepositoryInstance.findByUserId.mockResolvedValue(mockWallet);

      const result = await paymentService.getWalletBalance(userId);

      expect(result.balance).toBe(150);
      expect(result.userId).toBe(userId);
    });

    it('should create and return new wallet if not exists', async () => {
      const mockWallet = {
        id: 'wallet-1',
        userId,
        balance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      walletRepositoryInstance.findByUserId.mockResolvedValue(null);
      walletRepositoryInstance.create.mockResolvedValue(mockWallet);

      const result = await paymentService.getWalletBalance(userId);

      expect(walletRepositoryInstance.create).toHaveBeenCalledWith({
        userId,
        balance: 0
      });
      expect(result.balance).toBe(0);
    });
  });

  describe('getWalletTransactions', () => {
    const userId = 'user-1';
    const filters = { type: WalletTransactionType.CREDIT };
    const mockTransactions = [
      {
        id: 'txn-1',
        walletId: 'wallet-1',
        amount: 100,
        type: WalletTransactionType.CREDIT,
        createdAt: new Date()
      }
    ];

    it('should return wallet transactions', async () => {
      const mockWallet = { id: 'wallet-1', userId };

      walletRepositoryInstance.findByUserId.mockResolvedValue(mockWallet);
      walletRepositoryInstance.getTransactions.mockResolvedValue({
        transactions: mockTransactions,
        total: 1
      });

      const result = await paymentService.getWalletTransactions(userId, filters, 0, 10);

      expect(walletRepositoryInstance.getTransactions).toHaveBeenCalledWith(
        'wallet-1',
        filters,
        0,
        10
      );
      expect(result.transactions).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should throw error if wallet not found', async () => {
      walletRepositoryInstance.findByUserId.mockResolvedValue(null);

      await expect(paymentService.getWalletTransactions(userId, filters, 0, 10))
        .rejects.toThrow(new AppError('Wallet not found', 404));
    });
  });

  describe('handlePaymentGatewayCallback', () => {
    const gateway = 'stripe';
    const callbackData = {
      paymentReference: 'PAY_123',
      status: 'success',
      gatewayTransactionId: 'stripe_123',
      signature: 'valid_signature'
    };
    const mockPayment = {
      id: 'payment-1',
      userId: 'user-1',
      amount: 100,
      type: PaymentType.TOPUP,
      status: PaymentStatus.PROCESSING,
      reference: 'PAY_123'
    };

    it('should handle successful payment callback and process wallet topup', async () => {
      const updatedPayment = {
        ...mockPayment,
        status: PaymentStatus.COMPLETED,
        gatewayTransactionId: 'stripe_123',
        processedAt: new Date()
      };
      const mockWallet = { id: 'wallet-1', userId: 'user-1' };

      paymentRepositoryInstance.findByReference = jest.fn().mockResolvedValue(mockPayment);
      paymentRepositoryInstance.update.mockResolvedValue(updatedPayment);
      walletRepositoryInstance.findByUserId.mockResolvedValue(mockWallet);

      const result = await paymentService.handlePaymentGatewayCallback(gateway, callbackData);

      expect(paymentRepositoryInstance.update).toHaveBeenCalledWith('payment-1', {
        status: PaymentStatus.COMPLETED,
        gatewayTransactionId: 'stripe_123',
        processedAt: expect.any(Date)
      });
      expect(walletRepositoryInstance.updateBalance).toHaveBeenCalledWith('wallet-1', 100);
      expect(result.status).toBe(PaymentStatus.COMPLETED);
    });

    it('should throw error if payment not found', async () => {
      paymentRepositoryInstance.findByReference = jest.fn().mockResolvedValue(null);

      await expect(paymentService.handlePaymentGatewayCallback(gateway, callbackData))
        .rejects.toThrow(new AppError('Payment not found', 404));
    });
  });

  describe('refundPayment', () => {
    const paymentId = 'payment-1';
    const amount = 50;
    const reason = 'Customer request';
    const adminId = 'admin-1';
    const mockPayment = {
      id: paymentId,
      userId: 'user-1',
      amount: 100,
      method: PaymentMethod.CARD,
      type: PaymentType.RIDE,
      status: PaymentStatus.COMPLETED,
      reference: 'PAY_123'
    };

    beforeEach(() => {
      mockCrypto.randomBytes = jest.fn().mockReturnValue(Buffer.from('abcd1234', 'hex'));
      jest.spyOn(Date, 'now').mockReturnValue(1234567890000);
    });

    it('should create refund payment successfully', async () => {
      const mockRefund = {
        id: 'refund-1',
        userId: 'user-1',
        amount: -50,
        method: PaymentMethod.CARD,
        type: PaymentType.REFUND,
        status: PaymentStatus.COMPLETED,
        reference: 'PAY_1234567890000_ABCD1234',
        description: 'Refund for payment PAY_123',
        processedAt: new Date(),
        metadata: {
          originalPaymentId: paymentId,
          refundReason: reason,
          processedBy: adminId
        }
      };

      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);
      paymentRepositoryInstance.create.mockResolvedValue(mockRefund);

      const result = await paymentService.refundPayment(paymentId, amount, reason, adminId);

      expect(paymentRepositoryInstance.create).toHaveBeenCalledWith({
        userId: 'user-1',
        amount: -50,
        method: PaymentMethod.CARD,
        type: PaymentType.REFUND,
        reference: 'PAY_1234567890000_ABCD1234',
        description: 'Refund for payment PAY_123',
        status: PaymentStatus.COMPLETED,
        processedAt: expect.any(Date),
        metadata: {
          originalPaymentId: paymentId,
          refundReason: reason,
          processedBy: adminId
        }
      });
      expect(result.amount).toBe(-50);
      expect(result.type).toBe(PaymentType.REFUND);
    });

    it('should throw error if payment not found', async () => {
      paymentRepositoryInstance.findById.mockResolvedValue(null);

      await expect(paymentService.refundPayment(paymentId, amount, reason, adminId))
        .rejects.toThrow(new AppError('Payment not found', 404));
    });

    it('should throw error if payment not completed', async () => {
      const pendingPayment = {
        ...mockPayment,
        status: PaymentStatus.PENDING
      };
      paymentRepositoryInstance.findById.mockResolvedValue(pendingPayment);

      await expect(paymentService.refundPayment(paymentId, amount, reason, adminId))
        .rejects.toThrow(new AppError('Only completed payments can be refunded', 400));
    });

    it('should throw error if refund amount exceeds payment amount', async () => {
      paymentRepositoryInstance.findById.mockResolvedValue(mockPayment);

      await expect(paymentService.refundPayment(paymentId, 150, reason, adminId))
        .rejects.toThrow(new AppError('Refund amount cannot exceed payment amount', 400));
    });
  });

  describe('getPaymentStatistics', () => {
    it('should return payment statistics', async () => {
      const mockStats = {
        totalPayments: 100,
        totalAmount: 10000,
        completedPayments: 80,
        failedPayments: 10,
        pendingPayments: 10,
        dailyStats: []
      };

      paymentRepositoryInstance.getStatistics.mockResolvedValue(mockStats);

      const result = await paymentService.getPaymentStatistics(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'day'
      );

      expect(paymentRepositoryInstance.getStatistics).toHaveBeenCalledWith(
        new Date('2023-01-01'),
        new Date('2023-01-31'),
        'day'
      );
      expect(result).toEqual(mockStats);
    });
  });
});