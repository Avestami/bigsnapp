import { Payment, PaymentMethod, PaymentStatus, PaymentMethodType, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreatePaymentInput {
  userId: number;
  rideId?: number;
  amount: bigint;
  paymentMethodId: number;
  status?: PaymentStatus;
}

export interface UpdatePaymentInput {
  status?: PaymentStatus;
  paidAt?: Date;
}

export interface CreatePaymentMethodInput {
  type: PaymentMethodType;
}

export interface UpdatePaymentMethodInput {
  type?: PaymentMethodType;
}

export interface PaymentWithRelations extends Payment {
  user?: any;
  ride?: any;
  paymentMethod?: PaymentMethod;
}

export class PaymentRepository implements BaseRepository<Payment, CreatePaymentInput, UpdatePaymentInput> {
  async findById(id: number): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ride: {
          select: {
            id: true,
            status: true,
            fare: true,
          },
        },
        paymentMethod: true,
      },
    });
  }

  async findMany(options?: PaginationOptions & { status?: PaymentStatus; userId?: number; rideId?: number }): Promise<Payment[]> {
    const { page = 1, limit = 10, orderBy, status, userId, rideId } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (rideId) where.rideId = rideId;

    return prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ride: {
          select: {
            id: true,
            status: true,
            fare: true,
          },
        },
        paymentMethod: true,
      },
    });
  }

  async findManyPaginated(options?: PaginationOptions & { status?: PaymentStatus; userId?: number; rideId?: number }): Promise<PaginatedResult<Payment>> {
    const { page = 1, limit = 10, status, userId, rideId } = options || {};

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count({ status, userId, rideId }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreatePaymentInput): Promise<Payment> {
    return prisma.payment.create({
      data: {
        ...data,
        status: data.status || PaymentStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ride: {
          select: {
            id: true,
            status: true,
            fare: true,
          },
        },
        paymentMethod: true,
      },
    });
  }

  async update(id: number, data: UpdatePaymentInput): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        ride: {
          select: {
            id: true,
            status: true,
            fare: true,
          },
        },
        paymentMethod: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.payment.delete({
      where: { id },
    });
  }

  async count(options?: { status?: PaymentStatus; userId?: number; rideId?: number }): Promise<number> {
    const where: Prisma.PaymentWhereInput = {};
    if (options?.status) where.status = options.status;
    if (options?.userId) where.userId = options.userId;
    if (options?.rideId) where.rideId = options.rideId;

    return prisma.payment.count({ where });
  }

  // Payment status methods
  async confirmPayment(id: number): Promise<Payment> {
    return this.update(id, {
      status: PaymentStatus.CONFIRMED,
      paidAt: new Date(),
    });
  }

  async failPayment(id: number): Promise<Payment> {
    return this.update(id, {
      status: PaymentStatus.FAILED,
    });
  }

  async refundPayment(id: number): Promise<Payment> {
    return this.update(id, {
      status: PaymentStatus.REFUNDED,
    });
  }

  // Query methods
  async findByStatus(status: PaymentStatus, options?: PaginationOptions): Promise<Payment[]> {
    return this.findMany({ ...options, status });
  }

  async findByUserId(userId: number, options?: PaginationOptions): Promise<Payment[]> {
    return this.findMany({ ...options, userId });
  }

  async findByRideId(rideId: number): Promise<Payment[]> {
    return this.findMany({ rideId });
  }



  async findPendingPayments(options?: PaginationOptions): Promise<Payment[]> {
    return this.findByStatus(PaymentStatus.PENDING, options);
  }

  async findCompletedPayments(options?: PaginationOptions): Promise<Payment[]> {
    return this.findByStatus(PaymentStatus.CONFIRMED, options);
  }

  async findFailedPayments(options?: PaginationOptions): Promise<Payment[]> {
    return this.findByStatus(PaymentStatus.FAILED, options);
  }

  // Payment Method methods
  async findPaymentMethodById(id: number): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });
  }

  async findPaymentMethodsByUserId(userId: number): Promise<PaymentMethod[]> {
    return prisma.paymentMethod.findMany({
      where: {},
      orderBy: {
        id: 'desc',
      },
    });
  }

  async createPaymentMethod(data: CreatePaymentMethodInput): Promise<PaymentMethod> {
    return prisma.$transaction(async (tx) => {
      return tx.paymentMethod.create({
        data,
      });
    });
  }

  async updatePaymentMethod(id: number, data: UpdatePaymentMethodInput): Promise<PaymentMethod> {
    return prisma.paymentMethod.update({
      where: { id },
      data,
    });
  }

  async deletePaymentMethod(id: number): Promise<void> {
    await prisma.paymentMethod.delete({
      where: { id },
    });
  }

  async getDefaultPaymentMethod(userId: number): Promise<PaymentMethod | null> {
    return prisma.paymentMethod.findFirst({
      where: {},
    });
  }

  async setDefaultPaymentMethod(userId: number, paymentMethodId: number): Promise<PaymentMethod> {
    return this.updatePaymentMethod(paymentMethodId, {});
  }

  // Statistics and reporting
  async getPaymentStats(options?: { userId?: number; startDate?: Date; endDate?: Date }): Promise<{
    totalAmount: bigint;
    totalCount: number;
    completedAmount: bigint;
    completedCount: number;
    failedCount: number;
    refundedAmount: bigint;
    refundedCount: number;
  }> {
    const where: Prisma.PaymentWhereInput = {};
    if (options?.userId) where.userId = options.userId;
    if (options?.startDate || options?.endDate) {
      where.createdAt = {};
      if (options.startDate) where.createdAt.gte = options.startDate;
      if (options.endDate) where.createdAt.lte = options.endDate;
    }

    const [total, completed, failed, refunded] = await Promise.all([
      prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.CONFIRMED },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.payment.count({
        where: { ...where, status: PaymentStatus.FAILED },
      }),
      prisma.payment.aggregate({
        where: { ...where, status: PaymentStatus.REFUNDED },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalAmount: total._sum.amount || BigInt(0),
      totalCount: total._count.id,
      completedAmount: completed._sum.amount || BigInt(0),
      completedCount: completed._count.id,
      failedCount: failed,
      refundedAmount: refunded._sum.amount || BigInt(0),
      refundedCount: refunded._count.id,
    };
  }

  async getUserPaymentHistory(userId: number, options?: PaginationOptions): Promise<PaginatedResult<Payment>> {
    return this.findManyPaginated({ ...options, userId });
  }

  async getRidePayments(rideId: number): Promise<Payment[]> {
    return this.findByRideId(rideId);
  }


}