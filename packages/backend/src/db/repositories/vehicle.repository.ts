import { Vehicle, VehicleType, VehicleModel, Prisma } from '@prisma/client';
import { prisma } from '../index';
import { BaseRepository, PaginationOptions, PaginatedResult, createPaginatedResult } from './base.repository';

export interface CreateVehicleTypeInput {
  name: string;
  maxWeight?: number;
  passengerCapacity?: number;
  hasCargoBox?: boolean;
}

export interface UpdateVehicleTypeInput {
  name?: string;
  maxWeight?: number;
  passengerCapacity?: number;
  hasCargoBox?: boolean;
}

export interface CreateVehicleModelInput {
  brand: string;
  modelName: string;
}

export interface UpdateVehicleModelInput {
  brand?: string;
  modelName?: string;
}

export interface CreateVehicleInput {
  driverId: number;
  modelId: number;
  vehicleTypeId: number;
  licensePlate: string;
  color: string;
}

export interface UpdateVehicleInput {
  modelId?: number;
  vehicleTypeId?: number;
  licensePlate?: string;
  color?: string;
}

export interface VehicleWithRelations extends Vehicle {
  driver?: any;
  model?: VehicleModel & {
    vehicleType?: VehicleType;
  };
}

export class VehicleRepository {
  // Vehicle Type methods
  async findVehicleTypeById(id: number): Promise<VehicleType | null> {
    return prisma.vehicleType.findUnique({
      where: { id },
      include: {
        vehicles: {
          select: {
            id: true,
            licensePlate: true,
            color: true,
          },
        },
      },
    });
  }

  async findAllVehicleTypes(): Promise<VehicleType[]> {
    return prisma.vehicleType.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async createVehicleType(data: CreateVehicleTypeInput): Promise<VehicleType> {
    return prisma.vehicleType.create({
      data,
    });
  }

  async updateVehicleType(id: number, data: UpdateVehicleTypeInput): Promise<VehicleType> {
    return prisma.vehicleType.update({
      where: { id },
      data,
    });
  }

  async deleteVehicleType(id: number): Promise<void> {
    await prisma.vehicleType.delete({
      where: { id },
    });
  }

  // Vehicle Model methods
  async findVehicleModelById(id: number): Promise<VehicleModel | null> {
    return prisma.vehicleModel.findUnique({
      where: { id },
      include: {
        vehicles: {
          select: {
            id: true,
            licensePlate: true,
            color: true,
          },
        },
      },
    });
  }

  async findVehicleModelsByBrand(brand: string): Promise<VehicleModel[]> {
    return prisma.vehicleModel.findMany({
      where: { brand },
      orderBy: [
        { brand: 'asc' },
        { modelName: 'asc' },
      ],
    });
  }

  async findAllVehicleModels(): Promise<VehicleModel[]> {
    return prisma.vehicleModel.findMany({
      orderBy: [
        { brand: 'asc' },
        { modelName: 'asc' },
      ],
    });
  }

  async createVehicleModel(data: CreateVehicleModelInput): Promise<VehicleModel> {
    return prisma.vehicleModel.create({
      data,
    });
  }

  async updateVehicleModel(id: number, data: UpdateVehicleModelInput): Promise<VehicleModel> {
    return prisma.vehicleModel.update({
      where: { id },
      data,
    });
  }

  async deleteVehicleModel(id: number): Promise<void> {
    await prisma.vehicleModel.delete({
      where: { id },
    });
  }

  // Vehicle methods
  async findById(id: number): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { id },
      include: {
        driver: {
          select: {
            id: true,
            userId: true,
          },
        },
        model: {
          select: {
            id: true,
            brand: true,
            modelName: true,
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
  }

  async findByDriverId(driverId: number): Promise<Vehicle[]> {
    return prisma.vehicle.findMany({
      where: { driverId },
      include: {
        model: {
          select: {
            id: true,
            brand: true,
            modelName: true,
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
        id: 'desc',
      },
    });
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return prisma.vehicle.findUnique({
      where: { licensePlate },
      include: {
        driver: {
          select: {
            id: true,
            userId: true,
          },
        },
        model: {
          select: {
            id: true,
            brand: true,
            modelName: true,
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
  }

  async findMany(options?: PaginationOptions & { vehicleTypeId?: number }): Promise<Vehicle[]> {
    const { page = 1, limit = 10, orderBy, vehicleTypeId } = options || {};
    const skip = (page - 1) * limit;
    const where: any = {};
    if (vehicleTypeId) where.vehicleTypeId = vehicleTypeId;

    return prisma.vehicle.findMany({
      where,
      skip,
      take: limit,
      orderBy: orderBy || { id: 'desc' },
      include: {
        model: {
          select: {
            id: true,
            brand: true,
            modelName: true,
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
  }

  async findManyPaginated(options?: PaginationOptions & { vehicleTypeId?: number }): Promise<PaginatedResult<Vehicle>> {
    const { page = 1, limit = 10, vehicleTypeId } = options || {};

    const [data, total] = await Promise.all([
      this.findMany(options),
      this.count({ vehicleTypeId }),
    ]);

    return createPaginatedResult(data, total, page, limit);
  }

  async create(data: CreateVehicleInput): Promise<Vehicle> {
    return prisma.vehicle.create({
      data: {
        ...data,
  
      },
      include: {
        model: {
          select: {
            id: true,
            brand: true,
            modelName: true,
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
  }

  async update(id: number, data: UpdateVehicleInput): Promise<Vehicle> {
    return prisma.vehicle.update({
      where: { id },
      data,
      include: {
        model: {
          select: {
            id: true,
            brand: true,
            modelName: true,
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
  }

  async delete(id: number): Promise<void> {
    await prisma.vehicle.delete({
      where: { id },
    });
  }

  async count(options?: { vehicleTypeId?: number }): Promise<number> {
    const where: any = {};
    if (options?.vehicleTypeId) where.vehicleTypeId = options.vehicleTypeId;

    return prisma.vehicle.count({ where });
  }

  // Verification methods
  



  // Utility methods
  async licensePlateExists(licensePlate: string, excludeId?: number): Promise<boolean> {
    const where: Prisma.VehicleWhereInput = { licensePlate };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const count = await prisma.vehicle.count({ where });
    return count > 0;
  }

  async findVehiclesByType(vehicleTypeId: number, options?: PaginationOptions): Promise<Vehicle[]> {
    return this.findMany({ ...options, vehicleTypeId });
  }

  async getDriverVehicleCount(driverId: number): Promise<number> {
    return prisma.vehicle.count({
      where: { driverId },
    });
  }

  async getVerifiedVehicleForDriver(driverId: number): Promise<Vehicle | null> {
    return prisma.vehicle.findFirst({
      where: {
        driverId,
  
      },
      include: {
        model: {
          select: {
            id: true,
            brand: true,
            modelName: true,
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
        id: 'desc',
      },
    });
  }

  // Statistics
  async getVehicleStats(): Promise<{
    totalVehicles: number;
    vehiclesByType: Array<{ type: string; count: number }>;
  }> {
    const total = await prisma.vehicle.count();

    const vehiclesByType = await prisma.vehicle.groupBy({
      by: ['vehicleTypeId'],
      _count: {
        id: true,
      },
    });

    const typeStats = await Promise.all(
      vehiclesByType.map(async (group) => {
        const vehicleType = await prisma.vehicleType.findUnique({
          where: { id: group.vehicleTypeId },
          select: { name: true },
        });
        return {
          type: vehicleType?.name || 'Unknown',
          count: group._count.id,
        };
      })
    );

    return {
      totalVehicles: total,
      vehiclesByType: typeStats,
    };
  }
}