import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { RideService, CreateRideData, RideFilters, UpdateLocationData, CompleteRideData } from '../services/ride.service';
import { AppError } from '../middleware/error.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { RideStatus, VehicleType, UserType } from '@prisma/client';

interface CreateRideRequest {
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

interface AssignDriverRequest {
  driverId: number;
}

interface UpdateLocationRequest {
  latitude: number;
  longitude: number;
}

export class RideController {
  private rideService: RideService;

  constructor() {
    this.rideService = new RideService();
  }

  // Create a new ride request
  createRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const {
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      destinationLatitude,
      destinationLongitude,
      destinationAddress,
      vehicleType,
      estimatedDistance,
      estimatedDuration,
      estimatedFare,
      notes,
    } = req.body as CreateRideRequest;

    const userId = req.user!.id;

    const rideData: CreateRideData = {
      userId: userId.toString(),
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      destinationLatitude,
      destinationLongitude,
      destinationAddress,
      vehicleType,
      estimatedDistance,
      estimatedDuration,
      estimatedFare,
      notes,
    };

    const ride = await this.rideService.createRide(rideData);

    res.status(201).json({
      success: true,
      message: 'Ride request created successfully',
      data: ride,
    });
  });

  // Get ride by ID
  getRideById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const userId = req.user!.id;
    const userType = req.user!.userType;

    if (!rideId) {
      throw new AppError('Ride ID is required', 400);
    }

    const ride = await this.rideService.getRideById(rideId, userId.toString(), userType);

    res.status(200).json({
      success: true,
      data: ride,
    });
  });

  // Get rides with filters and pagination
  getRides = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = 1,
      limit = 10,
      status,
      userId,
      driverId,
      vehicleType,
      startDate,
      endDate,
    } = req.query;

    // Convert and validate pagination parameters
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new AppError('Invalid page number', 400);
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError('Invalid limit (must be between 1 and 100)', 400);
    }

    const filters: RideFilters = {
      page: pageNum,
      limit: limitNum,
      status: status ? status as RideStatus : undefined,
      userId: userId ? userId as string : undefined,
      driverId: driverId ? driverId as string : undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const requestingUserId = req.user!.id;
    const userType = req.user!.userType;

    const result = await this.rideService.getRides(filters, requestingUserId.toString(), userType);

    res.status(200).json({
      success: true,
      message: 'Rides retrieved successfully',
      data: result,
    });
  });

  // Assign driver to ride (Admin only)
  assignDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const { driverId } = req.body as AssignDriverRequest;
    const adminId = req.user!.id;

    if (!rideId || !driverId) {
      throw new AppError('Ride ID and driver ID are required', 400);
    }

    const updatedRide = await this.rideService.assignDriver(rideId, driverId.toString(), adminId.toString());

    res.status(200).json({
      success: true,
      message: 'Driver assigned successfully',
      data: updatedRide,
    });
  });

  // Driver accepts ride
  acceptRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const driverId = req.user!.id;

    if (!rideId) {
      throw new AppError('Ride ID is required', 400);
    }

    const updatedRide = await this.rideService.acceptRide(rideId, driverId.toString());

    res.status(200).json({
      success: true,
      message: 'Ride accepted successfully',
      data: updatedRide,
    });
  });

  // Driver arrives at pickup location
  arriveAtPickup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const driverId = req.user!.id;

    if (!rideId) {
      throw new AppError('Ride ID is required', 400);
    }

    const updatedRide = await this.rideService.arriveAtPickup(rideId, driverId.toString());

    res.status(200).json({
      success: true,
      message: 'Arrival marked successfully',
      data: updatedRide,
    });
  });

  // Start ride (passenger picked up)
  startRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const driverId = req.user!.id;

    if (!rideId) {
      throw new AppError('Ride ID is required', 400);
    }

    const updatedRide = await this.rideService.startRide(rideId, driverId.toString());

    res.status(200).json({
      success: true,
      message: 'Ride started successfully',
      data: updatedRide,
    });
  });

  // Complete ride
  completeRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const { actualFare, actualDistance, actualDuration } = req.body;
    const driverId = req.user!.id;

    if (!rideId) {
      throw new AppError('Ride ID is required', 400);
    }

    const completeData: CompleteRideData = {
      actualFare,
      actualDistance,
      actualDuration,
    };

    const updatedRide = await this.rideService.completeRide(rideId, driverId.toString(), completeData);

    res.status(200).json({
      success: true,
      message: 'Ride completed successfully',
      data: updatedRide,
    });
  });

  // Cancel ride
  cancelRide = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;
    const userType = req.user!.userType;

    if (!rideId) {
      throw new AppError('Ride ID is required', 400);
    }

    const updatedRide = await this.rideService.cancelRide(rideId, userId.toString(), userType, reason);

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: updatedRide,
    });
  });

  // Update ride location (for tracking)
  updateLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const { latitude, longitude } = req.body as UpdateLocationRequest;
    const driverId = req.user!.id;

    if (!rideId) {
      throw new AppError('Ride ID is required', 400);
    }

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    const locationData: UpdateLocationData = {
      latitude,
      longitude,
    };

    const updatedRide = await this.rideService.updateLocation(rideId, driverId.toString(), locationData);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: updatedRide,
    });
  });

  // Get available rides for drivers
  getAvailableRides = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page = 1, limit = 10, vehicleType } = req.query;
    const driverId = req.user!.id;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new AppError('Invalid page number', 400);
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError('Invalid limit (must be between 1 and 100)', 400);
    }

    const filters = {
      page: pageNum,
      limit: limitNum,
    };

    const result = await this.rideService.getAvailableRides(driverId.toString(), filters);

    res.status(200).json({
      success: true,
      message: 'Available rides retrieved successfully',
      data: result,
    });
  });

  // Get ride statistics (Admin only)
  getRideStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate } = req.query;
    const adminId = req.user!.id;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const statistics = await this.rideService.getRideStatistics(filters.startDate, filters.endDate);

    res.status(200).json({
      success: true,
      message: 'Ride statistics retrieved successfully',
      data: statistics,
    });
  });
}