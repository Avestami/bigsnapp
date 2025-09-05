import { RideRepository } from '../db/repositories/ride.repository';
import { UserRepository } from '../db/repositories/user.repository';
import { DriverRepository } from '../db/repositories/driver.repository';
import { VehicleRepository } from '../db/repositories/vehicle.repository';
import { WalletRepository } from '../db/repositories/wallet.repository';
import { AdminLogRepository } from '../db/repositories/adminlog.repository';
import { AppError } from '../middleware/error.middleware';
import { RideStatus, UserType, WalletTransactionType, VehicleType } from '@prisma/client';

export interface CreateRideData {
  userId: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress: string;
  destinationLatitude: number;
  destinationLongitude: number;
  destinationAddress: string;
  vehicleType: VehicleType;
  estimatedDistance?: number;
  estimatedDuration?: number;
  estimatedFare?: number;
  notes?: string;
}

export interface RideFilters {
  status?: RideStatus;
  userId?: string;
  driverId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface UpdateLocationData {
  latitude: number;
  longitude: number;
}

export interface CompleteRideData {
  actualFare?: number;
  actualDistance?: number;
  actualDuration?: number;
}

export class RideService {
  private rideRepository: RideRepository;
  private userRepository: UserRepository;
  private driverRepository: DriverRepository;
  private vehicleRepository: VehicleRepository;
  private walletRepository: WalletRepository;
  private adminLogRepository: AdminLogRepository;

  constructor() {
    this.rideRepository = new RideRepository();
    this.userRepository = new UserRepository();
    this.driverRepository = new DriverRepository();
    this.vehicleRepository = new VehicleRepository();
    this.walletRepository = new WalletRepository();
    this.adminLogRepository = new AdminLogRepository();
  }

  async createRide(data: CreateRideData) {
    // Validate user exists and is active
    const user = await this.userRepository.findById(parseInt(data.userId));
    if (!user) {
      throw new AppError('User not found', 404);
    }
    if (user.userType !== UserType.RIDER) {
      throw new AppError('Only riders can create ride requests', 403);
    }

    // Check if user has any active rides
    const activeRides = await this.rideRepository.findMany({
      userId: parseInt(data.userId),
      status: RideStatus.PENDING, // Check for pending rides
    });
    if (activeRides.length > 0) {
      throw new AppError('You already have an active ride request', 400);
    }

    // Calculate estimated fare if not provided
    let estimatedFare = data.estimatedFare;
    if (!estimatedFare && data.estimatedDistance) {
      estimatedFare = this.calculateEstimatedFare(data.vehicleType, data.estimatedDistance, data.estimatedDuration);
    }

    // Create the ride
    const ride = await this.rideRepository.create({
      userId: parseInt(data.userId),
      pickupLocationId: 1, // TODO: Create location records
      dropOffLocationId: 2, // TODO: Create location records
      fare: BigInt(Math.round((estimatedFare || 0) * 100)), // Convert to cents
    });

    // Log the ride creation
    await this.adminLogRepository.create({
      adminId: parseInt(data.userId),
      actionType: 'ride_created',
      targetUserId: ride.id,
      details: JSON.stringify({ vehicleType: data.vehicleType, estimatedFare })
    });

    return ride;
  }

  async getRideById(rideId: string, requestingUserId: string, userType: UserType) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    // Check access permissions
    const requestingUserIdNum = parseInt(requestingUserId);
    const hasAccess = 
      userType === UserType.ADMIN ||
      ride.userId === requestingUserIdNum ||
      ride.driverId === requestingUserIdNum;

    if (!hasAccess) {
      throw new AppError('Access denied', 403);
    }

    return ride;
  }

  async getRides(filters: RideFilters, requestingUserId: string, userType: UserType) {
    // Apply user-specific filters based on user type
    let finalFilters: any = { ...filters };
    
    // Convert string IDs to numbers
    if (finalFilters.userId) {
      finalFilters.userId = parseInt(finalFilters.userId);
    }
    if (finalFilters.driverId) {
      finalFilters.driverId = parseInt(finalFilters.driverId);
    }

    if (userType === UserType.RIDER) {
      finalFilters.userId = parseInt(requestingUserId);
    } else if (userType === UserType.DRIVER) {
      finalFilters.driverId = parseInt(requestingUserId);
    }
    // Admin can see all rides without additional filters

    return await this.rideRepository.findMany(finalFilters);
  }

  async getAvailableRides(driverId: string, filters: { page?: number; limit?: number }) {
    // Validate driver exists and is verified
    const driver = await this.driverRepository.findById(parseInt(driverId));
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    if (!driver.isVerified) {
      throw new AppError('Driver is not verified for rides', 403);
    }

    // Get available rides for the driver
    return await this.rideRepository.findByStatus(RideStatus.PENDING, {
      page: filters.page,
      limit: filters.limit,
    });
  }

  async assignDriver(rideId: string, driverId: string, adminId: string) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }
    if (ride.status !== RideStatus.PENDING) {
      throw new AppError('Ride is not available for assignment', 400);
    }

    // Validate driver
    const driver = await this.driverRepository.findById(parseInt(driverId));
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    if (!driver.isVerified) {
      throw new AppError('Driver is not verified', 400);
    }

    // Check if driver has vehicles
    const vehicles = await this.vehicleRepository.findByDriverId(parseInt(driverId));
    if (vehicles.length === 0) {
      throw new AppError('Driver does not have any vehicles', 400);
    }

    // Update ride status
    const updatedRide = await this.rideRepository.update(parseInt(rideId), {
      driverId: parseInt(driverId),
      status: RideStatus.ASSIGNED,
    });

    // Log the assignment
    await this.adminLogRepository.logRideAction(
      parseInt(adminId),
      'resolve_dispute',
      parseInt(rideId),
      JSON.stringify({ action: 'ride_assigned' })
    );

    return updatedRide;
  }

  async acceptRide(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }
    if (ride.status !== RideStatus.PENDING) {
      throw new AppError('Ride is not available for acceptance', 400);
    }

    // Validate driver
    const driver = await this.driverRepository.findById(parseInt(driverId));
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }
    if (!driver.isVerified) {
      throw new AppError('Driver is not verified', 400);
    }

    // Check if driver has active vehicles
    const vehicles = await this.vehicleRepository.findByDriverId(parseInt(driverId));
    if (vehicles.length === 0) {
      throw new AppError('You do not have any active vehicles', 400);
    }

    // Update ride status
    const updatedRide = await this.rideRepository.update(parseInt(rideId), {
      driverId: parseInt(driverId),
      status: RideStatus.ASSIGNED,
    });

    // Log the acceptance
    await this.adminLogRepository.logRideAction(
      parseInt(driverId),
      'resolve_dispute',
      parseInt(rideId),
      JSON.stringify({ action: 'ride_accepted' })
    );

    return updatedRide;
  }

  async arriveAtPickup(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }
    if (ride.driverId !== parseInt(driverId)) {
      throw new AppError('Access denied', 403);
    }
    if (ride.status !== RideStatus.ASSIGNED) {
      throw new AppError('Invalid ride status for arrival', 400);
    }

    const updatedRide = await this.rideRepository.update(parseInt(rideId), {
      status: RideStatus.DRIVER_ARRIVED,
    });

    // Log the arrival
    await this.adminLogRepository.logRideAction(
      parseInt(driverId),
      'resolve_dispute',
      parseInt(rideId),
      JSON.stringify({ action: 'driver_arrived' })
    );

    return updatedRide;
  }

  async startRide(rideId: string, driverId: string) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }
    if (ride.driverId !== parseInt(driverId)) {
      throw new AppError('Access denied', 403);
    }
    if (ride.status !== RideStatus.DRIVER_ARRIVED) {
      throw new AppError('Invalid ride status for starting', 400);
    }

    const updatedRide = await this.rideRepository.update(parseInt(rideId), {
      status: RideStatus.IN_PROGRESS,
      startTime: new Date(),
    });

    // Log the start
    await this.adminLogRepository.logRideAction(
      parseInt(driverId),
      'resolve_dispute',
      parseInt(rideId),
      JSON.stringify({ action: 'ride_started' })
    );

    return updatedRide;
  }

  async completeRide(rideId: string, driverId: string, data: CompleteRideData) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }
    if (ride.driverId !== parseInt(driverId)) {
      throw new AppError('Access denied', 403);
    }
    if (ride.status !== RideStatus.IN_PROGRESS) {
      throw new AppError('Invalid ride status for completion', 400);
    }

    const finalFare = data.actualFare || Number(ride.fare) || 0;

    // Update ride status
    const updatedRide = await this.rideRepository.update(parseInt(rideId), {
      status: RideStatus.COMPLETED,
      fare: BigInt(finalFare),
      endTime: new Date(),
    });

    // Process payment (deduct from rider's wallet, add to driver's wallet)
    if (finalFare > 0) {
      await this.processRidePayment(ride.userId.toString(), driverId, finalFare, rideId);
    }

    // Log the completion
    await this.adminLogRepository.logRideAction(
      parseInt(driverId),
      'resolve_dispute',
      parseInt(rideId),
      JSON.stringify({ action: 'ride_completed', fare: finalFare })
    );

    return updatedRide;
  }

  async cancelRide(rideId: string, userId: string, userType: UserType, reason?: string) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }

    // Check permissions
    const canCancel = 
      userType === UserType.ADMIN ||
      ride.userId === parseInt(userId) ||
      ride.driverId === parseInt(userId);

    if (!canCancel) {
      throw new AppError('Access denied', 403);
    }

    const allowedStatuses = [RideStatus.PENDING, RideStatus.ASSIGNED, RideStatus.DRIVER_ARRIVED] as const;
    if (!allowedStatuses.includes(ride.status as any)) {
      throw new AppError('Ride cannot be cancelled at this stage', 400);
    }

    // Update ride status to cancelled
    const updatedRide = await this.rideRepository.update(parseInt(rideId), {
      status: RideStatus.CANCELLED,
    });

    // Log the cancellation
    await this.adminLogRepository.logRideAction(
      parseInt(userId),
      'cancel',
      parseInt(rideId),
      JSON.stringify({ reason: `Ride cancelled: ${reason || 'No reason provided'}` })
    );

    return updatedRide;
  }

  async updateLocation(rideId: string, driverId: string, location: UpdateLocationData) {
    const ride = await this.rideRepository.findById(parseInt(rideId));
    if (!ride) {
      throw new AppError('Ride not found', 404);
    }
    if (ride.driverId !== parseInt(driverId)) {
      throw new AppError('Access denied', 403);
    }
    const allowedStatuses = [RideStatus.ASSIGNED, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS] as const;
    if (!allowedStatuses.includes(ride.status as any)) {
      throw new AppError('Cannot update location for this ride status', 400);
    }

    // For now, just return the ride as location updates would need additional schema fields
    return ride;
  }

  async getRideStatistics(startDate?: Date, endDate?: Date) {
    // Basic statistics implementation using count methods
    const totalRides = await this.rideRepository.count();
    const completedRides = await this.rideRepository.count({ status: RideStatus.COMPLETED });
    const cancelledRides = await this.rideRepository.count({ status: RideStatus.CANCELLED });
    const pendingRides = await this.rideRepository.count({ status: RideStatus.PENDING });
    const inProgressRides = await this.rideRepository.count({ status: RideStatus.IN_PROGRESS });
    
    return {
      totalRides,
      completedRides,
      cancelledRides,
      pendingRides,
      inProgressRides,
      completionRate: totalRides > 0 ? Math.round((completedRides / totalRides) * 100 * 100) / 100 : 0
    };
  }

  private calculateEstimatedFare(vehicleType: VehicleType, distance: number, duration?: number): number {
    const baseFares: Record<string, { base: number; perKm: number; perMin: number }> = {
      'ECONOMY': { base: 2.5, perKm: 1.2, perMin: 0.3 },
      'COMFORT': { base: 3.5, perKm: 1.8, perMin: 0.4 },
      'BUSINESS': { base: 5.0, perKm: 2.5, perMin: 0.6 },
      'MOTORCYCLE': { base: 1.5, perKm: 0.8, perMin: 0.2 },
      'BICYCLE': { base: 1.0, perKm: 0.5, perMin: 0.1 },
    };

    const rates = baseFares[vehicleType.name] || baseFares['ECONOMY']; // Default to ECONOMY if type not found
    let fare = rates.base + (distance * rates.perKm);
    
    if (duration) {
      fare += (duration / 60) * rates.perMin; // duration in seconds, convert to minutes
    }

    return Math.round(fare * 100) / 100; // Round to 2 decimal places
  }

  private async processRidePayment(riderId: string, driverId: string, amount: number, rideId: string) {
    try {
      // Deduct from rider's wallet
      const riderWallet = await this.walletRepository.findByUserId(parseInt(riderId));
      if (riderWallet) {
        await this.walletRepository.createTransaction({
          walletId: riderWallet.id,
          type: WalletTransactionType.PAYMENT,
          amountRial: -BigInt(Math.round(amount * 100)), // Negative for deduction, convert to rial cents
          description: `Payment for ride ${rideId}`,
          referenceId: parseInt(rideId),
          referenceType: 'ride',
          status: 'CONFIRMED'
        });
      }

      // Add to driver's wallet (minus platform commission)
      const platformCommission = amount * 0.15; // 15% commission
      const driverEarning = amount - platformCommission;
      
      // Get driver's wallet
      const driverWallet = await this.walletRepository.findByUserId(parseInt(driverId));
      if (driverWallet) {
        await this.walletRepository.createTransaction({
          walletId: driverWallet.id,
          type: WalletTransactionType.PAYOUT,
          amountRial: BigInt(Math.round(driverEarning * 100)), // Convert to rial cents
          description: `Earning from ride ${rideId}`,
          referenceId: parseInt(rideId),
          referenceType: 'ride',
          status: 'CONFIRMED'
        });
      }

      // Log the payment processing
      await this.adminLogRepository.logRideAction(
        parseInt(riderId),
        'resolve_dispute',
        parseInt(rideId),
        JSON.stringify({ amount, driverEarning, commission: platformCommission, action: 'payment_processed' })
      );
    } catch (error) {
      // Log payment failure
      await this.adminLogRepository.logRideAction(
        parseInt(riderId),
        'investigate',
        parseInt(rideId),
        JSON.stringify({ amount, error: error instanceof Error ? error.message : 'Unknown error', action: 'payment_failed' })
      );
      throw new AppError('Payment processing failed', 500);
    }
  }
}