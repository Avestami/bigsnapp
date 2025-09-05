import { User, UserType, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateUserInput {
  name?: string;
  passwordHash?: string;
  email?: string;
  phoneNumber?: string;
  userType: UserType;
}

export interface UpdateUserInput {
  name?: string;
  passwordHash?: string;
  email?: string;
  phoneNumber?: string;
  userType?: UserType;
}

export interface UserWithRelations extends User {
  wallet?: any;
  driver?: any;
}

export class UserRepository implements BaseRepository<User, CreateUserInput, UpdateUserInput> {
  async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        driver: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        wallet: true,
        driver: true,
      },
    });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        wallet: true,
        driver: true,
      },
    });
  }

  async findMany(options?: PaginationOptions & { userType?: UserType }): Promise<User[]> {
    const { page = 1, limit = 10, orderBy, userType } = options || {};
    const skip = (page - 1) * limit;

    return prisma.user.findMany({
      where: userType ? { userType } : undefined,
      skip,
      take: limit,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        wallet: true,
        driver: true,
      },
    });
  }

  async findManyPaginated(options?: PaginationOptions & { userType?: UserType }): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, orderBy, userType } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.user.findMany({
        where: userType ? { userType } : undefined,
        skip,
        take: limit,
        orderBy: orderBy || { createdAt: 'desc' },
        include: {
          wallet: true,
          driver: true,
        },
      }),
      this.count({ userType }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreateUserInput): Promise<User> {
    return prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data,
      });

      // Create wallet for the user
      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balanceRial: 0,
        },
      });

      // Update user with wallet ID
      return tx.user.update({
        where: { id: user.id },
        data: { walletId: wallet.id },
        include: {
          wallet: true,
          driver: true,
        },
      });
    });
  }

  async update(id: number, data: UpdateUserInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        wallet: true,
        driver: true,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async count(options?: { userType?: UserType }): Promise<number> {
    return prisma.user.count({
      where: options?.userType ? { userType: options.userType } : undefined,
    });
  }

  async findDrivers(options?: PaginationOptions): Promise<User[]> {
    return this.findMany({ ...options, userType: UserType.DRIVER });
  }

  async findRiders(options?: PaginationOptions): Promise<User[]> {
    return this.findMany({ ...options, userType: UserType.RIDER });
  }

  async findAdmins(options?: PaginationOptions): Promise<User[]> {
    return this.findMany({ ...options, userType: UserType.ADMIN });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    return !!user;
  }

  async existsByPhoneNumber(phoneNumber: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
      select: { id: true },
    });
    return !!user;
  }
}