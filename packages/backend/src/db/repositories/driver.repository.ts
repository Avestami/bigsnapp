import { Driver, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateDriverInput {
  userId: number;
  licenseNumber: string;
  isVerified?: boolean;
}

export interface UpdateDriverInput {
  licenseNumber?: string;
  isVerified?: boolean;
}

export interface DriverWithRelations extends Driver {
  user?: any;
  vehicles?: any[];
  rides?: any[];
  deliveryAssignments?: any[];
}

export class DriverRepository implements BaseRepository<Driver, CreateDriverInput, UpdateDriverInput> {
  async findById(id: number): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
        vehicles: {
          include: {
            model: true,
            vehicleType: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: number): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
        vehicles: {
          include: {
            model: true,
            vehicleType: true,
          },
        },
      },
    });
  }

  async findByLicenseNumber(licenseNumber: string): Promise<Driver | null> {
    return prisma.driver.findUnique({
      where: { licenseNumber },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
        vehicles: {
          include: {
            model: true,
            vehicleType: true,
          },
        },
      },
    });
  }

  async findMany(options?: PaginationOptions & { isVerified?: boolean }): Promise<Driver[]> {
    const { page = 1, limit = 10, orderBy, isVerified } = options || {};
    const skip = (page - 1) * limit;

    return prisma.driver.findMany({
      where: isVerified !== undefined ? { isVerified } : undefined,
      skip,
      take: limit,
      orderBy: orderBy || { id: 'desc' },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
        vehicles: {
          include: {
            model: true,
            vehicleType: true,
          },
        },
      },
    });
  }

  async findManyPaginated(options?: PaginationOptions & { isVerified?: boolean }): Promise<PaginatedResult<Driver>> {
    const { page = 1, limit = 10, orderBy, isVerified } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count({ isVerified }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreateDriverInput): Promise<Driver> {
    return prisma.driver.create({
      data,
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
        vehicles: {
          include: {
            model: true,
            vehicleType: true,
          },
        },
      },
    });
  }

  async update(id: number, data: UpdateDriverInput): Promise<Driver> {
    return prisma.driver.update({
      where: { id },
      data,
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
        vehicles: {
          include: {
            model: true,
            vehicleType: true,
          },
        },
      },
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.driver.delete({
      where: { id },
    });
  }

  async count(options?: { isVerified?: boolean }): Promise<number> {
    return prisma.driver.count({
      where: options?.isVerified !== undefined ? { isVerified: options.isVerified } : undefined,
    });
  }

  async findVerifiedDrivers(options?: PaginationOptions): Promise<Driver[]> {
    return this.findMany({ ...options, isVerified: true });
  }

  async findUnverifiedDrivers(options?: PaginationOptions): Promise<Driver[]> {
    return this.findMany({ ...options, isVerified: false });
  }

  async verifyDriver(id: number): Promise<Driver> {
    return this.update(id, { isVerified: true });
  }

  async unverifyDriver(id: number): Promise<Driver> {
    return this.update(id, { isVerified: false });
  }

  async existsByLicenseNumber(licenseNumber: string): Promise<boolean> {
    const driver = await prisma.driver.findUnique({
      where: { licenseNumber },
      select: { id: true },
    });
    return !!driver;
  }

  async findAvailableDrivers(vehicleTypeId?: number): Promise<Driver[]> {
    return prisma.driver.findMany({
      where: {
        isVerified: true,
        vehicles: vehicleTypeId
          ? {
              some: {
                vehicleTypeId,
              },
            }
          : {
              some: {},
            },
        // Not currently on an active ride
        rides: {
          none: {
            status: {
              in: ['ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'],
            },
          },
        },
        // Not currently on an active delivery
        deliveryAssignments: {
          none: {
            delivery: {
              status: {
                in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'],
              },
            },
          },
        },
      },
      include: {
        user: {
          include: {
            wallet: true,
          },
        },
        vehicles: {
          include: {
            model: true,
            vehicleType: true,
          },
        },
      },
    });
  }
}