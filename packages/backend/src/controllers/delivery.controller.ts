import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { DeliveryService } from '../services/delivery.service';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../middleware/error.middleware';
import {
  CreateDeliveryRequest,
  UpdateDeliveryLocationRequest,
  DeliveryFilters,
} from '../types/delivery.types';

export class DeliveryController {
  private deliveryService: DeliveryService;

  constructor() {
    this.deliveryService = new DeliveryService();
  }

  // Create new delivery request
  createDelivery = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const deliveryData = req.body as CreateDeliveryRequest;
    const userId = req.user!.id;

    const delivery = await this.deliveryService.createDelivery(userId, deliveryData);

    res.status(201).json({
      success: true,
      message: 'Delivery request created successfully',
      data: delivery,
    });
  });

  // Get delivery by ID
  getDeliveryById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;
    const userId = req.user!.id;
    const userType = req.user!.userType;

    if (!deliveryId) {
      throw new AppError('Delivery ID is required', 400);
    }

    const delivery = await this.deliveryService.getDeliveryById(deliveryId, userId, userType);

    res.status(200).json({
      success: true,
      message: 'Delivery retrieved successfully',
      data: delivery,
    });
  });

  // Get deliveries with filters
  getDeliveries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      status,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const userId = req.user!.id;
    const userType = req.user!.userType;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new AppError('Invalid page number', 400);
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new AppError('Invalid limit (1-100)', 400);
    }

    const filters: DeliveryFilters = {
      status: status as string,
      page: pageNum,
      limit: limitNum,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    };

    const result = await this.deliveryService.getDeliveries(userId, userType, filters);

    res.status(200).json({
      success: true,
      message: 'Deliveries retrieved successfully',
      data: result,
    });
  });

  // Get available deliveries for drivers
  getAvailableDeliveries = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      latitude,
      longitude,
      radius = '10',
      page = '1',
      limit = '10',
    } = req.query;

    const driverId = req.user!.id;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const radiusNum = parseFloat(radius as string);

    if (isNaN(pageNum) || pageNum < 1) {
      throw new AppError('Invalid page number', 400);
    }

    if (isNaN(limitNum) || limitNum < 1 || limitNum > 50) {
      throw new AppError('Invalid limit (1-50)', 400);
    }

    if (isNaN(radiusNum) || radiusNum < 1 || radiusNum > 50) {
      throw new AppError('Invalid radius (1-50 km)', 400);
    }

    const filters = {
      latitude: latitude ? parseFloat(latitude as string) : undefined,
      longitude: longitude ? parseFloat(longitude as string) : undefined,
      radius: radiusNum,
      page: pageNum,
      limit: limitNum,
    };

    const result = await this.deliveryService.getAvailableDeliveries(driverId, filters);

    res.status(200).json({
      success: true,
      message: 'Available deliveries retrieved successfully',
      data: result,
    });
  });

  // Assign driver to delivery (Admin only)
  assignDriver = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;
    const { driverId } = req.body;
    const adminId = req.user!.id;

    if (!deliveryId || !driverId) {
      throw new AppError('Delivery ID and Driver ID are required', 400);
    }

    const delivery = await this.deliveryService.assignDriver(deliveryId, driverId, adminId);

    res.status(200).json({
      success: true,
      message: 'Driver assigned successfully',
      data: delivery,
    });
  });

  // Accept delivery (Driver)
  acceptDelivery = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;
    const driverId = req.user!.id;

    if (!deliveryId) {
      throw new AppError('Delivery ID is required', 400);
    }

    const delivery = await this.deliveryService.acceptDelivery(deliveryId, driverId);

    res.status(200).json({
      success: true,
      message: 'Delivery accepted successfully',
      data: delivery,
    });
  });

  // Mark as picked up (Driver)
  markPickedUp = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;
    const driverId = req.user!.id;

    if (!deliveryId) {
      throw new AppError('Delivery ID is required', 400);
    }

    const delivery = await this.deliveryService.markPickedUp(deliveryId, driverId);

    res.status(200).json({
      success: true,
      message: 'Delivery marked as picked up successfully',
      data: delivery,
    });
  });

  // Mark as delivered (Driver)
  markDelivered = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;
    const { deliveryCode } = req.body;
    const driverId = req.user!.id;

    if (!deliveryId) {
      throw new AppError('Delivery ID is required', 400);
    }

    const delivery = await this.deliveryService.markDelivered(deliveryId, driverId, deliveryCode);

    res.status(200).json({
      success: true,
      message: 'Delivery completed successfully',
      data: delivery,
    });
  });

  // Cancel delivery
  cancelDelivery = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;
    const { reason } = req.body;
    const userId = req.user!.id;
    const userType = req.user!.userType;

    if (!deliveryId) {
      throw new AppError('Delivery ID is required', 400);
    }

    const delivery = await this.deliveryService.cancelDelivery(deliveryId, userId, userType, reason);

    res.status(200).json({
      success: true,
      message: 'Delivery cancelled successfully',
      data: delivery,
    });
  });

  // Update delivery location (Driver)
  updateLocation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;
    const { latitude, longitude } = req.body as UpdateDeliveryLocationRequest;
    const driverId = req.user!.id;

    if (!deliveryId) {
      throw new AppError('Delivery ID is required', 400);
    }

    if (!latitude || !longitude) {
      throw new AppError('Latitude and longitude are required', 400);
    }

    const locationData = {
      latitude,
      longitude,
    };

    const delivery = await this.deliveryService.updateLocation(deliveryId, driverId, locationData);

    res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: delivery,
    });
  });

  // Get delivery statistics (Admin only)
  getDeliveryStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { startDate, endDate } = req.query;
    const adminId = req.user!.id;

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
    };

    const statistics = await this.deliveryService.getDeliveryStatistics(adminId, filters);

    res.status(200).json({
      success: true,
      message: 'Delivery statistics retrieved successfully',
      data: statistics,
    });
  });
}