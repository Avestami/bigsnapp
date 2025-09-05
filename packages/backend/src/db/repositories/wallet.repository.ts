import { Wallet, WalletTransaction, WalletTransactionType, TopupRequest, PaymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateWalletInput {
  userId: number;
  balanceRial?: bigint;
}

export interface UpdateWalletInput {
  balanceRial?: bigint;
}

export interface CreateTransactionInput {
  walletId: number;
  type: WalletTransactionType;
  amountRial: bigint;
  description?: string;
  referenceId?: number;
  referenceType?: string;
  status: PaymentStatus;
}

export interface CreateTopupInput {
  walletId: number;
  amountRial: bigint;
}

export interface WalletWithRelations extends Wallet {
  user?: any;
  transactions?: WalletTransaction[];
  topupRequests?: TopupRequest[];
}

export class WalletRepository implements BaseRepository<Wallet, CreateWalletInput, UpdateWalletInput> {
  async findById(id: number): Promise<Wallet | null> {
    return prisma.wallet.findUnique({
      where: { id },
      include: {
        user: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50, // Limit recent transactions
        },
        topupRequests: {
          orderBy: {
            requestedAt: 'desc',
          },
          take: 20, // Limit recent topup requests
        },
      },
    });
  }

  async findByUserId(userId: number): Promise<Wallet | null> {
    return prisma.wallet.findFirst({
      where: { userId },
      include: {
        user: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
        topupRequests: {
          orderBy: {
            requestedAt: 'desc',
          },
          take: 20,
        },
      },
    });
  }

  async findMany(options?: PaginationOptions): Promise<Wallet[]> {
    const { page = 1, limit = 10, orderBy } = options || {};
    const skip = (page - 1) * limit;

    return prisma.wallet.findMany({
      skip,
      take: limit,
      orderBy: (orderBy as any) || { requestedAt: 'desc' },
      include: {
        user: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async create(data: CreateWalletInput): Promise<Wallet> {
    return prisma.wallet.create({
      data: {
        ...data,
        balanceRial: data.balanceRial || BigInt(0),
      },
      include: {
        user: true,
      },
    });
  }

  async update(id: number, data: UpdateWalletInput): Promise<Wallet> {
    return prisma.wallet.update({
      where: { id },
      data,
      include: {
        user: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 50,
        },
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.wallet.delete({
      where: { id },
    });
  }

  async count(): Promise<number> {
    return prisma.wallet.count();
  }

  // Transaction methods
  async createTransaction(data: CreateTransactionInput): Promise<WalletTransaction> {
    return prisma.$transaction(async (tx) => {
      // Create the transaction record
      const transaction = await tx.walletTransaction.create({
        data,
      });

      // Update wallet balance
      const wallet = await tx.wallet.findUnique({
        where: { id: data.walletId },
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      let newBalance: bigint;
      if (data.type === WalletTransactionType.TOPUP || data.type === WalletTransactionType.REFUND) {
        newBalance = wallet.balanceRial + data.amountRial;
      } else {
        newBalance = wallet.balanceRial - data.amountRial;
        
        // Prevent negative balance
        if (newBalance < 0) {
          throw new Error('Insufficient wallet balance');
        }
      }

      await tx.wallet.update({
        where: { id: data.walletId },
        data: {
          balanceRial: newBalance,
        },
      });

      return transaction;
    });
  }

  async getTransactions(
    walletId: number,
    options?: PaginationOptions & { type?: WalletTransactionType }
  ): Promise<WalletTransaction[]> {
    const { page = 1, limit = 20, orderBy, type } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.WalletTransactionWhereInput = { walletId };
    if (type) where.type = type;

    return prisma.walletTransaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: (orderBy as any) || { createdAt: 'desc' },
    });
  }

  async getTransactionsPaginated(
    walletId: number,
    options?: PaginationOptions & { type?: WalletTransactionType }
  ): Promise<PaginatedResult<WalletTransaction>> {
    const { page = 1, limit = 20, type } = options || {};

    const [data, total] = await Promise.all([
      this.getTransactions(walletId, options),
      this.countTransactions(walletId, { type }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async countTransactions(walletId: number, options?: { type?: WalletTransactionType }): Promise<number> {
    const where: Prisma.WalletTransactionWhereInput = { walletId };
    if (options?.type) where.type = options.type;

    return prisma.walletTransaction.count({ where });
  }

  // Topup methods
  async createTopupRequest(data: CreateTopupInput): Promise<TopupRequest> {
    return prisma.topupRequest.create({
      data: {
        ...data,
        status: PaymentStatus.PENDING,
      },
    });
  }

  async confirmTopup(topupId: number): Promise<TopupRequest> {
    return prisma.$transaction(async (tx) => {
      // Update topup request
      const topup = await tx.topupRequest.update({
        where: { id: topupId },
        data: {
          status: PaymentStatus.CONFIRMED,
          confirmedAt: new Date(),
        },
      });

      // Create credit transaction
      await this.createTransaction({
        walletId: topup.walletId,
        type: WalletTransactionType.TOPUP,
        amountRial: topup.amountRial,
        description: `Wallet topup - ${topup.id}`,
        referenceId: topup.id,
        referenceType: 'TOPUP',
        status: PaymentStatus.CONFIRMED,
      });

      return topup;
    });
  }

  async rejectTopup(topupId: number): Promise<TopupRequest> {
    return prisma.topupRequest.update({
      where: { id: topupId },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }

  async getTopupRequests(
    walletId: number,
    options?: PaginationOptions
  ): Promise<TopupRequest[]> {
    const { page = 1, limit = 20, orderBy } = options || {};
    const skip = (page - 1) * limit;

    return prisma.topupRequest.findMany({
      where: { walletId },
      skip,
      take: limit,
      orderBy: orderBy || { requestedAt: 'desc' },
    });
  }

  // Balance operations
  async getBalance(walletId: number): Promise<bigint> {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      select: { balanceRial: true },
    });

    return wallet?.balanceRial || BigInt(0);
  }

  async hasBalance(walletId: number, amount: bigint): Promise<boolean> {
    const balance = await this.getBalance(walletId);
    return balance >= amount;
  }

  // Payment operations
  async debitForPayment(
    walletId: number,
    amount: bigint,
    description: string,
    referenceId: string,
    referenceType: string
  ): Promise<WalletTransaction> {
    return this.createTransaction({
      walletId,
      type: WalletTransactionType.PAYMENT,
      amountRial: amount,
      description,
      referenceId: parseInt(referenceId),
      referenceType,
      status: PaymentStatus.CONFIRMED,
    });
  }

  async creditRefund(
    walletId: number,
    amount: bigint,
    description: string,
    referenceId: string,
    referenceType: string
  ): Promise<WalletTransaction> {
    return this.createTransaction({
      walletId,
      type: WalletTransactionType.REFUND,
      amountRial: amount,
      description,
      referenceId: parseInt(referenceId),
      referenceType,
      status: PaymentStatus.CONFIRMED,
    });
  }

  // Recalculate balance from transactions (for data integrity)
  async recalculateBalance(walletId: number): Promise<Wallet> {
    return prisma.$transaction(async (tx) => {
      const transactions = await tx.walletTransaction.findMany({
        where: { walletId },
        orderBy: { createdAt: 'asc' },
      });

      let balance = BigInt(0);
      for (const transaction of transactions) {
        if (transaction.type === WalletTransactionType.TOPUP || transaction.type === WalletTransactionType.REFUND) {
          balance += transaction.amountRial;
        } else {
          balance -= transaction.amountRial;
        }
      }

      return tx.wallet.update({
        where: { id: walletId },
        data: {
          balanceRial: balance,
        },
        include: {
          user: true,
        },
      });
    });
  }

  // Statistics
  async getWalletStats(walletId: number): Promise<{
    totalCredits: bigint;
    totalDebits: bigint;
    transactionCount: number;
    lastTransactionDate: Date | null;
  }> {
    const [credits, debits, count, lastTransaction] = await Promise.all([
      prisma.walletTransaction.aggregate({
        where: {
          walletId,
          type: {
            in: [WalletTransactionType.TOPUP, WalletTransactionType.REFUND]
          },
        },
        _sum: {
          amountRial: true,
        },
      }),
      prisma.walletTransaction.aggregate({
        where: {
          walletId,
          type: {
            in: [WalletTransactionType.PAYMENT, WalletTransactionType.PAYOUT, WalletTransactionType.PENALTY]
          },
        },
        _sum: {
          amountRial: true,
        },
      }),
      prisma.walletTransaction.count({
        where: { walletId },
      }),
      prisma.walletTransaction.findFirst({
        where: { walletId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
    ]);

    return {
      totalCredits: credits._sum.amountRial || BigInt(0),
      totalDebits: debits._sum.amountRial || BigInt(0),
      transactionCount: count,
      lastTransactionDate: lastTransaction?.createdAt || null,
    };
  }
}