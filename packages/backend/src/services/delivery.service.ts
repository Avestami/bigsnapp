import { DeliveryRepository } from '../db/repositories/delivery.repository';
import { UserRepository } from '../db/repositories/user.repository';
import { DriverRepository } from '../db/repositories/driver.repository';
import { PaymentRepository } from '../db/repositories/payment.repository';
import { AdminLogRepository } from '../db/repositories/adminlog.repository';
import { AppError } from '../middleware/error.middleware';
import {
  CreateDeliveryRequest,
  DeliveryFilters,
  UpdateDeliveryLocationData,
  DeliveryStatisticsFilters,
} from '../types/delivery.types';
import { DeliveryRequestStatus, UserType, PaymentStatus } from '@prisma/client';

export class DeliveryService {
  private deliveryRepository: DeliveryRepository;
  private userRepository: UserRepository;
  private driverRepository: DriverRepository;
  private paymentRepository: PaymentRepository;
  private adminLogRepository: AdminLogRepository;

  constructor() {
    this.deliveryRepository = new DeliveryRepository();
    this.userRepository = new UserRepository();
    this.driverRepository = new DriverRepository();
    this.paymentRepository = new PaymentRepository();
    this.adminLogRepository = new AdminLogRepository();
  }

  async createDelivery(userId: number, deliveryData: CreateDeliveryRequest) {
    // Verify user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Calculate estimated fare based on distance
    const distance = this.calculateDistance(
      deliveryData.pickupLatitude,
      deliveryData.pickupLongitude,
      deliveryData.deliveryLatitude,
      deliveryData.deliveryLongitude
    );

    const estimatedFare = this.calculateDeliveryFare(distance, deliveryData.packageWeight);

    // Generate delivery code
    const deliveryCode = this.generateDeliveryCode();

    // TODO: Create location records and get their IDs
    const senderLocationId = 1; // Placeholder - should create location from pickupAddress/coordinates
    const receiverLocationId = 2; // Placeholder - should create location from deliveryAddress/coordinates
    
    const delivery = await this.deliveryRepository.create({
      senderId: userId,
      receiverId: userId, // TODO: Should be actual receiver ID
      weightKg: deliveryData.packageWeight || 1,
      pickupLocationId: senderLocationId,
      dropOffLocationId: receiverLocationId,
      vehicleTypeId: 1, // TODO: Should be based on delivery type
      valueRial: BigInt(estimatedFare),
    });

    return delivery;
  }

  async getDeliveryById(deliveryId: string, userId: number, userType: UserType) {
    const id = parseInt(deliveryId);
    if (isNaN(id)) {
      throw new AppError('Invalid delivery ID', 400);
    }

    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    // Check permissions
    const hasAccess = 
      userType === UserType.ADMIN ||
      delivery.senderId === userId ||
      delivery.receiverId === userId ||
      delivery.assignment?.driverId === userId;

    if (!hasAccess) {
      throw new AppError('You do not have permission to view this delivery', 403);
    }

    return delivery;
  }

  async getDeliveries(userId: number, userType: UserType, filters: DeliveryFilters) {
    let queryFilters: any = {};

    // Apply user-specific filters
    if (userType === UserType.RIDER) {
      queryFilters.userId = userId;
    } else if (userType === UserType.DRIVER) {
      queryFilters.driverId = userId;
    }
    // Admin can see all deliveries

    // Apply status filter
    if (filters.status) {
      queryFilters.status = filters.status;
    }

    const deliveries = await this.deliveryRepository.findMany({
      ...queryFilters,
      page: filters.page,
      limit: filters.limit,
      orderBy: {
        [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc',
      },
    });

    const total = await this.deliveryRepository.count(queryFilters);

    return {
      deliveries,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async getAvailableDeliveries(driverId: number, filters: any) {
    // Verify driver exists and is available
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    // TODO: Check driver availability when status field is available

    let queryFilters: any = {
      status: DeliveryRequestStatus.PENDING,
    };

    // Apply location-based filtering if coordinates provided
    if (filters.latitude && filters.longitude) {
      // This would typically use a spatial query in production
      // For now, we'll fetch all and filter in memory (not optimal for large datasets)
      queryFilters.pickupLatitude = {
        gte: filters.latitude - (filters.radius / 111), // Rough conversion
        lte: filters.latitude + (filters.radius / 111),
      };
      queryFilters.pickupLongitude = {
        gte: filters.longitude - (filters.radius / (111 * Math.cos(filters.latitude * Math.PI / 180))),
        lte: filters.longitude + (filters.radius / (111 * Math.cos(filters.latitude * Math.PI / 180))),
      };
    }

    const deliveries = await this.deliveryRepository.findMany({
      ...queryFilters,
      page: filters.page,
      limit: filters.limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await this.deliveryRepository.count(queryFilters);

    return {
      deliveries,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  }

  async assignDriver(deliveryId: string, driverId: number, adminId: number) {
    const id = parseInt(deliveryId);
    if (isNaN(id)) {
      throw new AppError('Invalid delivery ID', 400);
    }

    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    if (delivery.status !== DeliveryRequestStatus.PENDING) {
      throw new AppError('Delivery cannot be assigned at this stage', 400);
    }

    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    // TODO: Check driver availability when status field is available

    // Update delivery and driver status
    const updatedDelivery = await this.deliveryRepository.update(id, {
      status: DeliveryRequestStatus.ASSIGNED,
      // TODO: Add assignedAt field to schema if needed
    });
    
    // TODO: Update driver status when UpdateDriverInput supports status field

    // Log admin action
    await this.adminLogRepository.logDeliveryAction(
      adminId,
      'investigate',
      id
    );

    return updatedDelivery;
  }

  async acceptDelivery(deliveryId: string, driverId: number) {
    const id = parseInt(deliveryId);
    if (isNaN(id)) {
      throw new AppError('Invalid delivery ID', 400);
    }

    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    if (delivery.status !== DeliveryRequestStatus.PENDING) {
      throw new AppError('Delivery is no longer available', 400);
    }

    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      throw new AppError('Driver not found', 400);
    }
    // TODO: Check driver availability when status field is available

    // Update delivery status
    const updatedDelivery = await this.deliveryRepository.update(id, {
      status: DeliveryRequestStatus.ASSIGNED,
      // TODO: Add assignedAt field to schema if needed
    });
    
    // TODO: Update driver status when UpdateDriverInput supports status field

    return updatedDelivery;
  }

  async markPickedUp(deliveryId: string, driverId: number) {
    const id = parseInt(deliveryId);
    if (isNaN(id)) {
      throw new AppError('Invalid delivery ID', 400);
    }

    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    // Check if driver is assigned to this delivery through assignment
    const currentAssignment = delivery.assignment;
    if (!currentAssignment || currentAssignment.driverId !== driverId) {
      throw new AppError('You are not assigned to this delivery', 403);
    }

    if (delivery.status !== DeliveryRequestStatus.ASSIGNED) {
      throw new AppError('Delivery cannot be picked up at this stage', 400);
    }

    const updatedDelivery = await this.deliveryRepository.update(id, {
      status: DeliveryRequestStatus.PICKED_UP,
    });

    return updatedDelivery;
  }

  async markDelivered(deliveryId: string, driverId: number, deliveryCode?: string) {
    const id = parseInt(deliveryId);
    if (isNaN(id)) {
      throw new AppError('Invalid delivery ID', 400);
    }

    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    // Check if driver is assigned to this delivery through assignment
    const currentAssignment = delivery.assignment;
    if (!currentAssignment || currentAssignment.driverId !== driverId) {
      throw new AppError('You are not assigned to this delivery', 403);
    }

    const completableStatuses = [DeliveryRequestStatus.PICKED_UP, DeliveryRequestStatus.IN_TRANSIT];
    if (!completableStatuses.includes(delivery.status as any)) {
      throw new AppError('Delivery cannot be completed at this stage', 400);
    }

    // TODO: Implement delivery code verification if needed
    // Note: deliveryCode field not available in current schema

    // Calculate final fare and commission
    const finalFare = delivery.valueRial; // Use valueRial as the fare
    const commission = Number(finalFare) * 0.15; // 15% commission
    const driverEarnings = Number(finalFare) - commission;

    // Update delivery status
    const updatedDelivery = await this.deliveryRepository.update(id, {
      status: DeliveryRequestStatus.DELIVERED,
    });

    // Process payment
    await this.paymentRepository.create({
      userId: delivery.senderId,
      rideId: id, // Using rideId as the reference field
      amount: BigInt(finalFare),
      paymentMethodId: 1, // Default payment method
      status: PaymentStatus.CONFIRMED,
    });

    // TODO: Driver status management should be handled separately

    return updatedDelivery;
  }

  async cancelDelivery(deliveryId: string, userId: number, userType: UserType, reason?: string) {
    const id = parseInt(deliveryId);
    if (isNaN(id)) {
      throw new AppError('Invalid delivery ID', 400);
    }

    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    // Check permissions
    const currentAssignment = delivery.assignment;
    const canCancel = 
      userType === UserType.ADMIN ||
      delivery.senderId === userId ||
      (currentAssignment && currentAssignment.driverId === userId);

    if (!canCancel) {
      throw new AppError('You do not have permission to cancel this delivery', 403);
    }

    const finalStatuses = [DeliveryRequestStatus.DELIVERED, DeliveryRequestStatus.CANCELLED];
    if (finalStatuses.includes(delivery.status as any)) {
      throw new AppError('Delivery cannot be cancelled', 400);
    }

    const updatedDelivery = await this.deliveryRepository.update(id, {
      status: DeliveryRequestStatus.CANCELLED,
    });

    // Note: Driver status management would be handled separately if needed

    return updatedDelivery;
  }

  async updateLocation(deliveryId: string, driverId: number, locationData: UpdateDeliveryLocationData) {
    const id = parseInt(deliveryId);
    if (isNaN(id)) {
      throw new AppError('Invalid delivery ID', 400);
    }

    const delivery = await this.deliveryRepository.findById(id);
    if (!delivery) {
      throw new AppError('Delivery not found', 404);
    }

    // Check if driver is assigned to this delivery through assignment
    const currentAssignment = delivery.assignment;
    if (!currentAssignment || currentAssignment.driverId !== driverId) {
      throw new AppError('You are not assigned to this delivery', 403);
    }

    const validStatusesForLocationUpdate = [DeliveryRequestStatus.ASSIGNED, DeliveryRequestStatus.PICKED_UP, DeliveryRequestStatus.IN_TRANSIT];
    if (!validStatusesForLocationUpdate.includes(delivery.status as any)) {
      throw new AppError('Cannot update location for this delivery status', 400);
    }

    // Validate coordinates
    if (Math.abs(locationData.latitude) > 90 || Math.abs(locationData.longitude) > 180) {
      throw new AppError('Invalid coordinates', 400);
    }

    // Update status to IN_TRANSIT if picked up and moving
    let updateData: any = {
      currentLatitude: locationData.latitude,
      currentLongitude: locationData.longitude,
    };

    if (delivery.status === DeliveryRequestStatus.PICKED_UP) {
      updateData.status = DeliveryRequestStatus.IN_TRANSIT;
    }

    const updatedDelivery = await this.deliveryRepository.update(id, updateData);

    return updatedDelivery;
  }

  async getDeliveryStatistics(adminId: number, filters: DeliveryStatisticsFilters) {
    // Verify admin access
    const admin = await this.userRepository.findById(adminId);
    if (!admin || admin.userType !== UserType.ADMIN) {
      throw new AppError('Admin access required', 403);
    }

    let queryFilters: any = {};

    if (filters.startDate || filters.endDate) {
      queryFilters.createdAt = {};
      if (filters.startDate) {
        queryFilters.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        queryFilters.createdAt.lte = filters.endDate;
      }
    }

    const [totalDeliveries, deliveredCount, cancelledCount, pendingCount, inProgressCount] = await Promise.all([
      this.deliveryRepository.count(queryFilters),
      this.deliveryRepository.count({ ...queryFilters, status: DeliveryRequestStatus.DELIVERED }),
      this.deliveryRepository.count({ ...queryFilters, status: DeliveryRequestStatus.CANCELLED }),
      this.deliveryRepository.count({ ...queryFilters, status: DeliveryRequestStatus.PENDING }),
      this.deliveryRepository.count({
        ...queryFilters,
        status: {
          in: [DeliveryRequestStatus.ASSIGNED, DeliveryRequestStatus.PICKED_UP, DeliveryRequestStatus.IN_TRANSIT],
        },
      }),
    ]);

    const statistics = {
      totalDeliveries,
      deliveredCount,
      cancelledCount,
      pendingCount,
      inProgressCount,
      deliveryRate: totalDeliveries > 0 ? (deliveredCount / totalDeliveries) * 100 : 0,
      cancellationRate: totalDeliveries > 0 ? (cancelledCount / totalDeliveries) * 100 : 0,
    };

    return statistics;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private calculateDeliveryFare(distance: number, weight?: number): number {
    const baseFare = 50; // Base fare in currency units
    const perKmRate = 15; // Rate per kilometer
    const weightMultiplier = weight && weight > 5 ? 1 + (weight - 5) * 0.1 : 1; // Extra charge for heavy packages
    
    return Math.round((baseFare + (distance * perKmRate)) * weightMultiplier);
  }

  private generateDeliveryCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }
}