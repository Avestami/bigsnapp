import { Payment, PaymentStatus, PaymentMethodType } from '@prisma/client';
import { prisma } from '../db/index';
import { PaymentStatisticsResponse } from '../types/payment.types';

export class PaymentRepository {
  private prisma = prisma;

  async create(data: {
    userId: number;
    amount: bigint;
    status: PaymentStatus;
    paymentMethodId: number;
    referenceId?: number;
  }): Promise<Payment> {
    return await this.prisma.payment.create({
      data: {
        userId: data.userId,
        amount: data.amount,
        status: data.status,
        paymentMethodId: data.paymentMethodId,
        rideId: data.referenceId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        paymentMethod: true
      }
    });
  }

  async findById(id: number): Promise<Payment | null> {
    return await this.prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        paymentMethod: true
      }
    });
  }

  async findByReferenceId(referenceId: number): Promise<Payment | null> {
    return await this.prisma.payment.findFirst({
      where: { rideId: referenceId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        },
        paymentMethod: true
      }
    });
  }

  async findMany(
    whereClause: any,
    skip: number,
    limit: number
  ): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
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
            phoneNumber: true
          }
        }
      }
    });
  }

  async count(whereClause: any): Promise<number> {
    return await this.prisma.payment.count({
      where: whereClause
    });
  }

  async update(id: number, data: Partial<Payment>): Promise<Payment> {
    return await this.prisma.payment.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        }
      }
    });
  }

  async delete(id: number): Promise<Payment> {
    return await this.prisma.payment.delete({
      where: { id }
    });
  }

  async findByUserId(
    userId: number,
    skip: number,
    limit: number,
    filters?: {
      status?: PaymentStatus;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Payment[]> {
    const whereClause: any = {
      userId
    };

    if (filters?.status) {
      whereClause.status = filters.status;
    }



    if (filters?.startDate || filters?.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    return await this.findMany(whereClause, skip, limit);
  }

  async getStatistics(
    startDate?: Date,
    endDate?: Date,
    groupBy: 'day' | 'week' | 'month' = 'day'
  ): Promise<PaymentStatisticsResponse> {
    const whereClause: any = {};

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = startDate;
      }
      if (endDate) {
        whereClause.createdAt.lte = endDate;
      }
    }

    // Get basic statistics
    const [totalStats, methodBreakdown, statusBreakdown] = await Promise.all([
      this.prisma.payment.aggregate({
        where: whereClause,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        },
        _avg: {
          amount: true
        }
      }),
      this.prisma.paymentMethod.findMany({
        include: {
          _count: {
            select: {
              payments: {
                where: whereClause
              }
            }
          },
          payments: {
            where: whereClause,
            select: {
              amount: true
            }
          }
        }
      }),
      this.prisma.payment.groupBy({
        by: ['status'],
        where: whereClause,
        _sum: {
          amount: true
        },
        _count: {
          id: true
        }
      })
    ]);

    // Get successful payment statistics (assuming successful payments are topups)
    const topupStats = await this.prisma.payment.aggregate({
      where: {
        ...whereClause,
        status: PaymentStatus.CONFIRMED
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      },
      _avg: {
        amount: true
      }
    });

    // Get failed payment statistics (assuming failed payments need refunds)
    const refundStats = await this.prisma.payment.aggregate({
      where: {
        ...whereClause,
        status: PaymentStatus.FAILED
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Get time series data
    const timeSeriesData = await this.getTimeSeriesData(whereClause, groupBy);

    return {
      totalRevenue: Number(totalStats._sum?.amount || BigInt(0)),
      totalTransactions: totalStats._count?.id || 0,
      averageTransactionValue: totalStats._avg?.amount || 0,
      paymentMethodBreakdown: methodBreakdown.map(item => ({
        method: item.type,
        count: item._count.payments,
        totalAmount: item.payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
      })),
      statusBreakdown: statusBreakdown.map(item => ({
        status: item.status,
        count: item._count?.id || 0,
        totalAmount: Number(item._sum?.amount || BigInt(0))
      })),
      timeSeriesData,
      topupStats: {
        totalTopups: topupStats._count?.id || 0,
        totalTopupAmount: Number(topupStats._sum?.amount || BigInt(0)),
        averageTopupAmount: topupStats._avg?.amount || 0
      },
      refundStats: {
        totalRefunds: refundStats._count?.id || 0,
        totalRefundAmount: Math.abs(Number(refundStats._sum?.amount || BigInt(0))),
        refundRate: (totalStats._count?.id || 0) > 0 ? ((refundStats._count?.id || 0) / (totalStats._count?.id || 1)) * 100 : 0
      }
    };
  }

  private async getTimeSeriesData(
    whereClause: any,
    groupBy: 'day' | 'week' | 'month'
  ): Promise<{ date: string; totalAmount: number; transactionCount: number }[]> {
    // This is a simplified implementation
    // In a real application, you might want to use raw SQL for better performance
    const payments = await this.prisma.payment.findMany({
      where: whereClause,
      select: {
        amount: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const groupedData: { [key: string]: { totalAmount: number; transactionCount: number } } = {};

    payments.forEach(payment => {
      let dateKey: string;
      const date = new Date(payment.createdAt);

      switch (groupBy) {
        case 'day':
          dateKey = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          dateKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          dateKey = date.toISOString().split('T')[0];
      }

      if (!groupedData[dateKey]) {
        groupedData[dateKey] = { totalAmount: 0, transactionCount: 0 };
      }

      groupedData[dateKey].totalAmount += Number(payment.amount);
      groupedData[dateKey].transactionCount += 1;
    });

    return Object.entries(groupedData)
      .map(([date, data]) => ({
        date,
        totalAmount: data.totalAmount,
        transactionCount: data.transactionCount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async findPendingPayments(limit: number = 100): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000) // 30 minutes ago
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'asc'
      }
    });
  }

  async findFailedPayments(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<Payment[]> {
    return await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.FAILED,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phoneNumber: true
          }
        }
      }
    });
  }
}