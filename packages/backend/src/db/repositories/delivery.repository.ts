import { DeliveryRequest, DeliveryRequestStatus, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateDeliveryInput {
  senderId: number;
  receiverId: number;
  weightKg: number;
  pickupLocationId: number;
  dropOffLocationId: number;
  vehicleTypeId: number;
  valueRial: bigint;
  scheduledTime?: Date;
}

export interface UpdateDeliveryInput {
  senderId?: number;
  receiverId?: number;
  weightKg?: number;
  pickupLocationId?: number;
  dropOffLocationId?: number;
  vehicleTypeId?: number;
  valueRial?: bigint;
  status?: DeliveryRequestStatus;
  scheduledTime?: Date;
}

export interface DeliveryWithRelations extends DeliveryRequest {
  sender?: any;
  receiver?: any;
  pickupLocation?: any;
  dropoffLocation?: any;
  vehicleType?: any;
  assignment?: any;
  reviews?: any[];
  statusHistory?: any[];
}

export class DeliveryRepository implements BaseRepository<DeliveryRequest, CreateDeliveryInput, UpdateDeliveryInput> {
  async findById(id: number): Promise<DeliveryWithRelations | null> {
    return prisma.deliveryRequest.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        pickupLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        dropoffLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicleType: {
          select: {
            id: true,
            name: true,
          },
        },
        assignment: {
          select: {
            driverId: true,
            assignedAt: true,
          },
        },
        reviews: true,
        statusHistory: {
          orderBy: {
            statusTime: 'desc',
          },
        },
      },
    });
  }

  async findMany(options?: PaginationOptions & { status?: DeliveryRequestStatus; userId?: number; driverId?: number }): Promise<DeliveryRequest[]> {
    const { page = 1, limit = 10, orderBy, status, userId, driverId } = options || {};
    const skip = (page - 1) * limit;

    const where: Prisma.DeliveryRequestWhereInput = {};
    if (status) where.status = status;
    if (userId) where.senderId = userId;
    if (driverId) where.assignment = { driverId };

    return prisma.deliveryRequest.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        pickupLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        dropoffLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicleType: {
          select: {
            id: true,
            name: true,
          },
        },
        assignment: {
          select: {
            driverId: true,
            assignedAt: true,
          },
        },
        reviews: true,
      },
    });
  }

  async findManyPaginated(options?: PaginationOptions & { status?: DeliveryRequestStatus; userId?: number; driverId?: number }): Promise<PaginatedResult<DeliveryRequest>> {
    const { page = 1, limit = 10, status, userId, driverId } = options || {};

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count({ status, userId, driverId }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreateDeliveryInput): Promise<DeliveryRequest> {
    return prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryRequest.create({
        data: {
          ...data,
          status: DeliveryRequestStatus.PENDING,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          pickupLocation: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          dropoffLocation: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          vehicleType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Create initial status history
      await tx.deliveryStatusHistory.create({
        data: {
          deliveryId: delivery.id,
          status: DeliveryRequestStatus.PENDING,
          statusTime: new Date(),
        },
      });

      return delivery;
    });
  }

  async update(id: number, data: UpdateDeliveryInput): Promise<DeliveryRequest> {
    return prisma.$transaction(async (tx) => {
      const delivery = await tx.deliveryRequest.update({
        where: { id },
        data,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              phoneNumber: true,
            },
          },
          pickupLocation: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          dropoffLocation: {
            select: {
              id: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          vehicleType: {
            select: {
              id: true,
              name: true,
            },
          },
          assignment: {
            select: {
              driverId: true,
              assignedAt: true,
            },
          },
          reviews: true,
        },
      });

      // Create status history if status changed
      if (data.status) {
        await tx.deliveryStatusHistory.create({
          data: {
            deliveryId: id,
            status: data.status,
            statusTime: new Date(),
          },
        });
      }

      return delivery;
    });
  }

  async delete(id: number): Promise<void> {
    await prisma.deliveryRequest.delete({
      where: { id },
    });
  }

  async count(options?: { status?: DeliveryRequestStatus; userId?: number; driverId?: number }): Promise<number> {
    const where: Prisma.DeliveryRequestWhereInput = {};
    if (options?.status) where.status = options.status;
    if (options?.userId) where.senderId = options.userId;
    if (options?.driverId) where.assignment = { driverId: options.driverId };

    return prisma.deliveryRequest.count({ where });
  }

  async findByStatus(status: DeliveryRequestStatus, options?: PaginationOptions): Promise<DeliveryRequest[]> {
    return this.findMany({ ...options, status });
  }

  async findByUserId(userId: number, options?: PaginationOptions): Promise<DeliveryRequest[]> {
    return this.findMany({ ...options, userId });
  }

  async findByDriverId(driverId: number, options?: PaginationOptions): Promise<DeliveryRequest[]> {
    return this.findMany({ ...options, driverId });
  }

  async assignDriver(deliveryId: number, driverId: number): Promise<DeliveryRequest> {
    return prisma.$transaction(async (tx) => {
      // Create assignment record
      await tx.deliveryAssignment.create({
        data: {
          deliveryId: deliveryId,
          driverId,
          assignedAt: new Date(),
        },
      });

      // Update delivery status
      return this.update(deliveryId, {
        status: DeliveryRequestStatus.ASSIGNED,
      });
    });
  }

  async pickupDelivery(deliveryId: number): Promise<DeliveryRequest> {
    return this.update(deliveryId, {
      status: DeliveryRequestStatus.PICKED_UP,
    });
  }

  async deliverPackage(deliveryId: number): Promise<DeliveryRequest> {
    return this.update(deliveryId, {
      status: DeliveryRequestStatus.DELIVERED,
    });
  }

  async cancelDelivery(deliveryId: number): Promise<DeliveryRequest> {
    return this.update(deliveryId, {
      status: DeliveryRequestStatus.CANCELLED,
    });
  }

  async driverArrived(deliveryId: number): Promise<DeliveryRequest> {
    return this.update(deliveryId, {
      status: DeliveryRequestStatus.PICKED_UP,
    });
  }

  async findActiveDeliveries(): Promise<DeliveryRequest[]> {
    return this.findByStatus(DeliveryRequestStatus.PICKED_UP);
  }

  async findPendingDeliveries(): Promise<DeliveryRequest[]> {
    return this.findByStatus(DeliveryRequestStatus.PENDING);
  }

  async findDeliveryHistory(userId: number, options?: PaginationOptions): Promise<DeliveryRequest[]> {
    return this.findMany({
      ...options,
      userId,
    });
  }

  async findDriverDeliveryHistory(driverId: number, options?: PaginationOptions): Promise<DeliveryRequest[]> {
    return this.findMany({
      ...options,
      driverId,
    });
  }

  async getActiveDeliveryForUser(userId: number): Promise<DeliveryRequest | null> {
    return prisma.deliveryRequest.findFirst({
      where: {
        senderId: userId,
        status: {
          in: [
            DeliveryRequestStatus.PENDING,
            DeliveryRequestStatus.ASSIGNED,
            DeliveryRequestStatus.PICKED_UP,
          ],
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        pickupLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        dropoffLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicleType: {
          select: {
            id: true,
            name: true,
          },
        },
        assignment: {
          select: {
            driverId: true,
            assignedAt: true,
          },
        },
      },
    });
  }

  async getActiveDeliveryForDriver(driverId: number): Promise<DeliveryRequest | null> {
    return prisma.deliveryRequest.findFirst({
      where: {
        assignment: {
          driverId,
        },
        status: {
          in: [
            DeliveryRequestStatus.ASSIGNED,
            DeliveryRequestStatus.PICKED_UP,
          ],
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        pickupLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        dropoffLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicleType: {
          select: {
            id: true,
            name: true,
          },
        },
        assignment: {
          select: {
            driverId: true,
            assignedAt: true,
          },
        },
      },
    });
  }

  async findNearbyDeliveries(latitude: number, longitude: number, radiusKm: number = 10): Promise<DeliveryRequest[]> {
    // This is a simplified version - in production you'd use PostGIS or similar for proper geospatial queries
    return prisma.deliveryRequest.findMany({
      where: {
        status: DeliveryRequestStatus.PENDING,
        pickupLocation: {
          latitude: {
            gte: latitude - (radiusKm / 111), // Rough conversion: 1 degree ≈ 111km
            lte: latitude + (radiusKm / 111),
          },
          longitude: {
            gte: longitude - (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))),
            lte: longitude + (radiusKm / (111 * Math.cos(latitude * Math.PI / 180))),
          },
        },
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            phoneNumber: true,
          },
        },
        pickupLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        dropoffLocation: {
          select: {
            id: true,
            address: true,
            latitude: true,
            longitude: true,
          },
        },
        vehicleType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}