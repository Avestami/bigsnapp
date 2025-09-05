import { Ride, RideStatus, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateRideInput {
  userId: number;
  pickupLocationId: number;
  dropOffLocationId: number;
  fare?: bigint;
}

export interface UpdateRideInput {
  driverId?: number;
  fare?: bigint;
  startTime?: Date;
  endTime?: Date;
  status?: RideStatus;
}

export interface RideWithRelations extends Ride {
  rider?: any;
  driver?: any;
  pickupLocation?: any;
  dropoffLocation?: any;
  payments?: any[];
  reviews?: any[];
  statusHistory?: any[];
}

export class RideRepository implements BaseRepository<Ride, CreateRideInput, UpdateRideInput> {
  async findById(id: number): Promise<Ride | null> {
    return prisma.ride.findUnique({
      where: { id },
      include: {
        rider: {
          include: {
            wallet: true,
          },
        },
        driver: {
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
        },
        pickupLocation: true,
        dropoffLocation: true,
        payments: true,
        reviews: true,
        statusHistory: {
          orderBy: {
            statusTime: 'desc',
          },
        },
      },
    });
  }

  async findMany(options?: PaginationOptions & { status?: RideStatus; userId?: number; driverId?: number }): Promise<Ride[]> {
    const { page = 1, limit = 10, orderBy, status, userId, driverId } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.RideWhereInput = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (driverId) where.driverId = driverId;

    return prisma.ride.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        rider: {
          include: {
            wallet: true,
          },
        },
        driver: {
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
        },
        pickupLocation: true,
        dropoffLocation: true,
        payments: true,
        reviews: true,
      },
    });
  }

  async findManyPaginated(options?: PaginationOptions & { status?: RideStatus; userId?: number; driverId?: number }): Promise<PaginatedResult<Ride>> {
    const { page = 1, limit = 10, status, userId, driverId } = options || {};

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count({ status, userId, driverId }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreateRideInput): Promise<Ride> {
    return prisma.$transaction(async (tx) => {
      const ride = await tx.ride.create({
        data: {
          ...data,
          status: RideStatus.PENDING,
        },
        include: {
          rider: {
            include: {
              wallet: true,
            },
          },
          pickupLocation: true,
          dropoffLocation: true,
        },
      });

      // Create initial status history
      await tx.rideStatusHistory.create({
        data: {
          rideId: ride.id,
          status: RideStatus.PENDING,
          statusTime: new Date(),
        },
      });

      return ride;
    });
  }

  async update(id: number, data: UpdateRideInput): Promise<Ride> {
    return prisma.$transaction(async (tx) => {
      const ride = await tx.ride.update({
        where: { id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
        include: {
          rider: {
            include: {
              wallet: true,
            },
          },
          driver: {
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
          },
          pickupLocation: true,
          dropoffLocation: true,
          payments: true,
          reviews: true,
        },
      });

      // Create status history if status changed
      if (data.status) {
        await tx.rideStatusHistory.create({
          data: {
            rideId: id,
            status: data.status,
            statusTime: new Date(),
          },
        });
      }

      return ride;
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.ride.delete({
      where: { id },
    });
  }

  async count(options?: { status?: RideStatus; userId?: number; driverId?: number }): Promise<number> {
    const where: Prisma.RideWhereInput = {};
    if (options?.status) where.status = options.status;
    if (options?.userId) where.userId = options.userId;
    if (options?.driverId) where.driverId = options.driverId;

    return prisma.ride.count({ where });
  }

  async findByStatus(status: RideStatus, options?: PaginationOptions): Promise<Ride[]> {
    return this.findMany({ ...options, status });
  }

  async findByUserId(userId: number, options?: PaginationOptions): Promise<Ride[]> {
    return this.findMany({ ...options, userId });
  }

  async findByDriverId(driverId: number, options?: PaginationOptions): Promise<Ride[]> {
    return this.findMany({ ...options, driverId });
  }

  async assignDriver(rideId: number, driverId: number): Promise<Ride> {
    return this.update(rideId, {
      driverId,
      status: RideStatus.ASSIGNED,
    });
  }

  async startRide(rideId: number): Promise<Ride> {
    return this.update(rideId, {
      status: RideStatus.IN_PROGRESS,
      startTime: new Date(),
    });
  }

  async completeRide(rideId: number): Promise<Ride> {
    return this.update(rideId, {
      status: RideStatus.COMPLETED,
      endTime: new Date(),
    });
  }

  async cancelRide(rideId: number): Promise<Ride> {
    return this.update(rideId, {
      status: RideStatus.CANCELLED,
    });
  }

  async driverArrived(rideId: number): Promise<Ride> {
    return this.update(rideId, {
      status: RideStatus.DRIVER_ARRIVED,
    });
  }

  async findActiveRides(): Promise<Ride[]> {
    return this.findByStatus(RideStatus.IN_PROGRESS);
  }

  async findPendingRides(): Promise<Ride[]> {
    return this.findByStatus(RideStatus.PENDING);
  }

  async findRideHistory(userId: number, options?: PaginationOptions): Promise<Ride[]> {
    return this.findMany({
      ...options,
      userId,
    });
  }

  async findDriverRideHistory(driverId: number, options?: PaginationOptions): Promise<Ride[]> {
    return this.findMany({
      ...options,
      driverId,
    });
  }

  async getActiveRideForUser(userId: number): Promise<Ride | null> {
    return prisma.ride.findFirst({
      where: {
        userId,
        status: {
          in: [RideStatus.PENDING, RideStatus.ASSIGNED, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS],
        },
      },
      include: {
        rider: {
          include: {
            wallet: true,
          },
        },
        driver: {
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
        },
        pickupLocation: true,
        dropoffLocation: true,
      },
    });
  }

  async getActiveRideForDriver(driverId: number): Promise<Ride | null> {
    return prisma.ride.findFirst({
      where: {
        driverId,
        status: {
          in: [RideStatus.ASSIGNED, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS],
        },
      },
      include: {
        rider: {
          include: {
            wallet: true,
          },
        },
        driver: {
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
        },
        pickupLocation: true,
        dropoffLocation: true,
      },
    });
  }
}