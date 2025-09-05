import { PrismaClient, Wallet, WalletTransaction, WalletTransactionType } from '@prisma/client';
import { prisma } from '../db/index';

export class WalletRepository {
  private prisma = prisma;

  async create(data: {
    userId: number;
    balanceRial?: bigint;
  }): Promise<Wallet> {
    return await this.prisma.wallet.create({
      data: {
        userId: data.userId,
        balanceRial: data.balanceRial || BigInt(0)
      }
    });
  }

  async findById(id: number): Promise<Wallet | null> {
    return await this.prisma.wallet.findUnique({
      where: { id }
    });
  }

  async findByUserId(userId: number): Promise<Wallet | null> {
    return await this.prisma.wallet.findFirst({
      where: { userId }
    });
  }

  async updateBalance(walletId: number, amount: bigint): Promise<Wallet> {
    return await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        balanceRial: {
          increment: amount
        }
      }
    });
  }

  async createTransaction(data: {
    walletId: number;
    amountRial: bigint;
    type: WalletTransactionType;
    description?: string;
    referenceId?: string;
    referenceType?: string;
  }): Promise<WalletTransaction> {
    return await this.prisma.walletTransaction.create({
      data: {
        walletId: data.walletId,
        amountRial: data.amountRial,
        type: data.type,
        description: data.description,
        referenceId: data.referenceId ? parseInt(data.referenceId) : null,
        referenceType: data.referenceType,
        status: 'PENDING' as any
      }
    });
  }

  async findTransactions(
    whereClause: any,
    skip: number,
    limit: number
  ): Promise<WalletTransaction[]> {
    return await this.prisma.walletTransaction.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        wallet: {
          select: {
            userId: true
          }
        }
      }
    });
  }

  async countTransactions(whereClause: any): Promise<number> {
    return await this.prisma.walletTransaction.count({
      where: whereClause
    });
  }

  async getTransactionById(id: number): Promise<WalletTransaction | null> {
    return await this.prisma.walletTransaction.findUnique({
      where: { id },
      include: {
        wallet: {
          select: {
            userId: true
          }
        }
      }
    });
  }

  async getWalletStatistics(userId?: number): Promise<{
    totalBalance: bigint;
    totalTransactions: number;
    totalCredits: bigint;
    totalDebits: bigint;
    averageTransactionAmount: number;
  }> {
    const whereClause: any = {};
    if (userId) {
      whereClause.wallet = {
        userId
      };
    }

    const [totalStats, creditStats, debitStats] = await Promise.all([
      this.prisma.walletTransaction.aggregate({
        where: whereClause,
        _count: {
          id: true
        },
        _avg: {
          amountRial: true
        }
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          ...whereClause,
          type: {
            in: [WalletTransactionType.TOPUP, WalletTransactionType.REFUND]
          }
        },
        _sum: {
          amountRial: true
        }
      }),
      this.prisma.walletTransaction.aggregate({
        where: {
          ...whereClause,
          type: {
            in: [WalletTransactionType.PAYMENT, WalletTransactionType.PAYOUT, WalletTransactionType.PENALTY]
          }
        },
        _sum: {
          amountRial: true
        }
      })
    ]);

    let totalBalance = BigInt(0);
    if (userId) {
      const wallet = await this.findByUserId(userId);
      totalBalance = wallet?.balanceRial || BigInt(0);
    } else {
      const wallets = await this.prisma.wallet.aggregate({
        _sum: {
          balanceRial: true
        }
      });
      totalBalance = wallets._sum.balanceRial || BigInt(0);
    }

    return {
      totalBalance,
      totalTransactions: totalStats._count.id,
      totalCredits: creditStats._sum.amountRial || BigInt(0),
      totalDebits: debitStats._sum.amountRial ? BigInt(Math.abs(Number(debitStats._sum.amountRial))) : BigInt(0),
      averageTransactionAmount: totalStats._avg.amountRial || 0
    };
  }

  async findMany(
    whereClause: any,
    skip: number,
    limit: number
  ): Promise<Wallet[]> {
    return await this.prisma.wallet.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phoneNumber: true
          }
        }
      }
    });
  }

  async count(whereClause: any): Promise<number> {
    return await this.prisma.wallet.count({
      where: whereClause
    });
  }

  async update(id: number, data: Partial<Wallet>): Promise<Wallet> {
    return await this.prisma.wallet.update({
      where: { id },
      data
    });
  }

  async delete(id: number): Promise<Wallet> {
    return await this.prisma.wallet.delete({
      where: { id }
    });
  }

  async freezeWallet(walletId: number, reason: string): Promise<Wallet> {
    return await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        // Note: isActive field doesn't exist in schema, remove if not needed
      }
    });
  }

  async unfreezeWallet(walletId: number): Promise<Wallet> {
    return await this.prisma.wallet.update({
      where: { id: walletId },
      data: {
        // Note: isActive field doesn't exist in schema, remove if not needed
      }
    });
  }
}