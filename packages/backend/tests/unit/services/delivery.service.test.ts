import { DeliveryService } from '../../../src/services/delivery.service';
import { DeliveryRepository } from '../../../src/db/repositories/delivery.repository';
import { UserRepository } from '../../../src/db/repositories/user.repository';
import { DriverRepository } from '../../../src/db/repositories/driver.repository';
import { PaymentRepository } from '../../../src/db/repositories/payment.repository';
import { AdminLogRepository } from '../../../src/db/repositories/adminlog.repository';
import { AppError } from '../../../src/middleware/error.middleware';
import { DeliveryStatus, UserType, PaymentStatus } from '@prisma/client';
import { CreateDeliveryRequest, DeliveryFilters, UpdateDeliveryLocationData, DeliveryStatisticsFilters } from '../../../src/types/delivery.types';

// Mock all repositories
jest.mock('../../../src/db/repositories/delivery.repository');
jest.mock('../../../src/db/repositories/user.repository');
jest.mock('../../../src/db/repositories/driver.repository');
jest.mock('../../../src/db/repositories/payment.repository');
jest.mock('../../../src/db/repositories/adminlog.repository');

describe('DeliveryService', () => {
  let deliveryService: DeliveryService;
  let mockDeliveryRepository: jest.Mocked<DeliveryRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockDriverRepository: jest.Mocked<DriverRepository>;
  let mockPaymentRepository: jest.Mocked<PaymentRepository>;
  let mockAdminLogRepository: jest.Mocked<AdminLogRepository>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock instances
    mockDeliveryRepository = new DeliveryRepository() as jest.Mocked<DeliveryRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockDriverRepository = new DriverRepository() as jest.Mocked<DriverRepository>;
    mockPaymentRepository = new PaymentRepository() as jest.Mocked<PaymentRepository>;
    mockAdminLogRepository = new AdminLogRepository() as jest.Mocked<AdminLogRepository>;

    // Create service instance
    deliveryService = new DeliveryService();

    // Replace private properties with mocks
    (deliveryService as any).deliveryRepository = mockDeliveryRepository;
    (deliveryService as any).userRepository = mockUserRepository;
    (deliveryService as any).driverRepository = mockDriverRepository;
    (deliveryService as any).paymentRepository = mockPaymentRepository;
    (deliveryService as any).adminLogRepository = mockAdminLogRepository;
  });

  describe('createDelivery', () => {
    const mockUserId = 1;
    const mockDeliveryData: CreateDeliveryRequest = {
      pickupAddress: '123 Main St',
      deliveryAddress: '456 Oak Ave',
      pickupLatitude: 40.7128,
      pickupLongitude: -74.0060,
      deliveryLatitude: 40.7589,
      deliveryLongitude: -73.9851,
      recipientName: 'John Doe',
      recipientPhone: '+1234567890',
      packageDescription: 'Documents',
      packageWeight: 1.5,
      packageValue: 100,
      deliveryInstructions: 'Ring doorbell',
      scheduledPickupTime: new Date('2024-01-15T10:00:00Z')
    };

    it('should create a delivery successfully', async () => {
      const mockUser = { id: mockUserId, userType: UserType.USER };
      const mockCreatedDelivery = {
        id: 1,
        userId: mockUserId,
        ...mockDeliveryData,
        status: DeliveryStatus.PENDING,
        estimatedFare: 85,
        deliveryCode: 'ABC123'
      };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockDeliveryRepository.getActiveDeliveryForUser.mockResolvedValue(null);
      mockDeliveryRepository.create.mockResolvedValue(mockCreatedDelivery as any);

      const result = await deliveryService.createDelivery(mockUserId, mockDeliveryData);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserId);
      expect(mockDeliveryRepository.getActiveDeliveryForUser).toHaveBeenCalledWith(mockUserId);
      expect(mockDeliveryRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        status: DeliveryStatus.PENDING,
        estimatedFare: expect.any(Number),
        deliveryCode: expect.any(String)
      }));
      expect(result).toEqual(mockCreatedDelivery);
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(deliveryService.createDelivery(mockUserId, mockDeliveryData))
        .rejects.toThrow(new AppError('User not found', 404));
    });

    it('should throw error if user has active delivery', async () => {
      const mockUser = { id: mockUserId, userType: UserType.USER };
      const mockActiveDelivery = { id: 1, status: DeliveryStatus.PENDING };

      mockUserRepository.findById.mockResolvedValue(mockUser as any);
      mockDeliveryRepository.getActiveDeliveryForUser.mockResolvedValue(mockActiveDelivery as any);

      await expect(deliveryService.createDelivery(mockUserId, mockDeliveryData))
        .rejects.toThrow(new AppError('You already have an active delivery', 400));
    });
  });

  describe('getDeliveryById', () => {
    const mockDeliveryId = '1';
    const mockUserId = 1;
    const mockDelivery = {
      id: 1,
      userId: mockUserId,
      driverId: 2,
      status: DeliveryStatus.PENDING
    };

    it('should return delivery for admin user', async () => {
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      const result = await deliveryService.getDeliveryById(mockDeliveryId, mockUserId, UserType.ADMIN);

      expect(mockDeliveryRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDelivery);
    });

    it('should return delivery for owner user', async () => {
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      const result = await deliveryService.getDeliveryById(mockDeliveryId, mockUserId, UserType.USER);

      expect(result).toEqual(mockDelivery);
    });

    it('should return delivery for assigned driver', async () => {
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      const result = await deliveryService.getDeliveryById(mockDeliveryId, 2, UserType.DRIVER);

      expect(result).toEqual(mockDelivery);
    });

    it('should throw error for invalid delivery ID', async () => {
      await expect(deliveryService.getDeliveryById('invalid', mockUserId, UserType.USER))
        .rejects.toThrow(new AppError('Invalid delivery ID', 400));
    });

    it('should throw error if delivery not found', async () => {
      mockDeliveryRepository.findById.mockResolvedValue(null);

      await expect(deliveryService.getDeliveryById(mockDeliveryId, mockUserId, UserType.USER))
        .rejects.toThrow(new AppError('Delivery not found', 404));
    });

    it('should throw error for unauthorized access', async () => {
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.getDeliveryById(mockDeliveryId, 999, UserType.USER))
        .rejects.toThrow(new AppError('You do not have permission to view this delivery', 403));
    });
  });

  describe('getDeliveries', () => {
    const mockUserId = 1;
    const mockFilters: DeliveryFilters = {
      page: 1,
      limit: 10,
      status: DeliveryStatus.PENDING,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    it('should return deliveries for user', async () => {
      const mockDeliveries = [{ id: 1, userId: mockUserId }];
      const mockTotal = 1;

      mockDeliveryRepository.findMany.mockResolvedValue(mockDeliveries as any);
      mockDeliveryRepository.count.mockResolvedValue(mockTotal);

      const result = await deliveryService.getDeliveries(mockUserId, UserType.USER, mockFilters);

      expect(mockDeliveryRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId: mockUserId, status: DeliveryStatus.PENDING }
      }));
      expect(result.deliveries).toEqual(mockDeliveries);
      expect(result.pagination.total).toBe(mockTotal);
    });

    it('should return deliveries for driver', async () => {
      const mockDeliveries = [{ id: 1, driverId: mockUserId }];

      mockDeliveryRepository.findMany.mockResolvedValue(mockDeliveries as any);
      mockDeliveryRepository.count.mockResolvedValue(1);

      await deliveryService.getDeliveries(mockUserId, UserType.DRIVER, mockFilters);

      expect(mockDeliveryRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { driverId: mockUserId, status: DeliveryStatus.PENDING }
      }));
    });

    it('should return all deliveries for admin', async () => {
      const mockDeliveries = [{ id: 1 }, { id: 2 }];

      mockDeliveryRepository.findMany.mockResolvedValue(mockDeliveries as any);
      mockDeliveryRepository.count.mockResolvedValue(2);

      await deliveryService.getDeliveries(mockUserId, UserType.ADMIN, mockFilters);

      expect(mockDeliveryRepository.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { status: DeliveryStatus.PENDING }
      }));
    });
  });

  describe('getAvailableDeliveries', () => {
    const mockDriverId = 1;
    const mockFilters = { page: 1, limit: 10, latitude: 40.7128, longitude: -74.0060, radius: 10 };

    it('should return available deliveries for driver', async () => {
      const mockDriver = { id: mockDriverId, status: 'AVAILABLE' };
      const mockDeliveries = [{ id: 1, status: DeliveryStatus.PENDING }];

      mockDriverRepository.findById.mockResolvedValue(mockDriver as any);
      mockDeliveryRepository.findMany.mockResolvedValue(mockDeliveries as any);
      mockDeliveryRepository.count.mockResolvedValue(1);

      const result = await deliveryService.getAvailableDeliveries(mockDriverId, mockFilters);

      expect(mockDriverRepository.findById).toHaveBeenCalledWith(mockDriverId);
      expect(result.deliveries).toEqual(mockDeliveries);
    });

    it('should throw error if driver not found', async () => {
      mockDriverRepository.findById.mockResolvedValue(null);

      await expect(deliveryService.getAvailableDeliveries(mockDriverId, mockFilters))
        .rejects.toThrow(new AppError('Driver not found or not available', 404));
    });

    it('should throw error if driver not available', async () => {
      const mockDriver = { id: mockDriverId, status: 'BUSY' };
      mockDriverRepository.findById.mockResolvedValue(mockDriver as any);

      await expect(deliveryService.getAvailableDeliveries(mockDriverId, mockFilters))
        .rejects.toThrow(new AppError('Driver not found or not available', 404));
    });
  });

  describe('assignDriver', () => {
    const mockDeliveryId = '1';
    const mockDriverId = 1;
    const mockAdminId = 1;

    it('should assign driver to delivery successfully', async () => {
      const mockDelivery = { id: 1, status: DeliveryStatus.PENDING };
      const mockDriver = { id: mockDriverId, status: 'AVAILABLE' };
      const mockUpdatedDelivery = { ...mockDelivery, driverId: mockDriverId, status: DeliveryStatus.DRIVER_ASSIGNED };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDriverRepository.findById.mockResolvedValue(mockDriver as any);
      mockDeliveryRepository.update.mockResolvedValue(mockUpdatedDelivery as any);
      mockDriverRepository.update.mockResolvedValue({} as any);
      mockAdminLogRepository.logDeliveryAction.mockResolvedValue({} as any);

      const result = await deliveryService.assignDriver(mockDeliveryId, mockDriverId, mockAdminId);

      expect(mockDeliveryRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        driverId: mockDriverId,
        status: DeliveryStatus.DRIVER_ASSIGNED
      }));
      expect(mockDriverRepository.update).toHaveBeenCalledWith(mockDriverId, { status: 'BUSY' });
      expect(result).toEqual(mockUpdatedDelivery);
    });

    it('should throw error for invalid delivery ID', async () => {
      await expect(deliveryService.assignDriver('invalid', mockDriverId, mockAdminId))
        .rejects.toThrow(new AppError('Invalid delivery ID', 400));
    });

    it('should throw error if delivery not found', async () => {
      mockDeliveryRepository.findById.mockResolvedValue(null);

      await expect(deliveryService.assignDriver(mockDeliveryId, mockDriverId, mockAdminId))
        .rejects.toThrow(new AppError('Delivery not found', 404));
    });

    it('should throw error if delivery cannot be assigned', async () => {
      const mockDelivery = { id: 1, status: DeliveryStatus.DELIVERED };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.assignDriver(mockDeliveryId, mockDriverId, mockAdminId))
        .rejects.toThrow(new AppError('Delivery cannot be assigned at this stage', 400));
    });

    it('should throw error if driver not available', async () => {
      const mockDelivery = { id: 1, status: DeliveryStatus.PENDING };
      const mockDriver = { id: mockDriverId, status: 'BUSY' };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDriverRepository.findById.mockResolvedValue(mockDriver as any);

      await expect(deliveryService.assignDriver(mockDeliveryId, mockDriverId, mockAdminId))
        .rejects.toThrow(new AppError('Driver not found or not available', 404));
    });
  });

  describe('acceptDelivery', () => {
    const mockDeliveryId = '1';
    const mockDriverId = 1;

    it('should accept delivery successfully', async () => {
      const mockDelivery = { id: 1, status: DeliveryStatus.PENDING };
      const mockDriver = { id: mockDriverId, status: 'AVAILABLE' };
      const mockUpdatedDelivery = { ...mockDelivery, driverId: mockDriverId, status: DeliveryStatus.DRIVER_ASSIGNED };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDriverRepository.findById.mockResolvedValue(mockDriver as any);
      mockDeliveryRepository.update.mockResolvedValue(mockUpdatedDelivery as any);
      mockDriverRepository.update.mockResolvedValue({} as any);

      const result = await deliveryService.acceptDelivery(mockDeliveryId, mockDriverId);

      expect(result).toEqual(mockUpdatedDelivery);
    });

    it('should throw error if delivery no longer available', async () => {
      const mockDelivery = { id: 1, status: DeliveryStatus.DRIVER_ASSIGNED };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.acceptDelivery(mockDeliveryId, mockDriverId))
        .rejects.toThrow(new AppError('Delivery is no longer available', 400));
    });
  });

  describe('markPickedUp', () => {
    const mockDeliveryId = '1';
    const mockDriverId = 1;

    it('should mark delivery as picked up successfully', async () => {
      const mockDelivery = { id: 1, driverId: mockDriverId, status: DeliveryStatus.DRIVER_ASSIGNED };
      const mockUpdatedDelivery = { ...mockDelivery, status: DeliveryStatus.PICKED_UP };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDeliveryRepository.update.mockResolvedValue(mockUpdatedDelivery as any);

      const result = await deliveryService.markPickedUp(mockDeliveryId, mockDriverId);

      expect(mockDeliveryRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: DeliveryStatus.PICKED_UP,
        pickedUpAt: expect.any(Date)
      }));
      expect(result).toEqual(mockUpdatedDelivery);
    });

    it('should throw error if driver not assigned to delivery', async () => {
      const mockDelivery = { id: 1, driverId: 999, status: DeliveryStatus.DRIVER_ASSIGNED };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.markPickedUp(mockDeliveryId, mockDriverId))
        .rejects.toThrow(new AppError('You are not assigned to this delivery', 403));
    });

    it('should throw error if delivery cannot be picked up', async () => {
      const mockDelivery = { id: 1, driverId: mockDriverId, status: DeliveryStatus.DELIVERED };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.markPickedUp(mockDeliveryId, mockDriverId))
        .rejects.toThrow(new AppError('Delivery cannot be picked up at this stage', 400));
    });
  });

  describe('markDelivered', () => {
    const mockDeliveryId = '1';
    const mockDriverId = 1;
    const mockDeliveryCode = 'ABC123';

    it('should mark delivery as delivered successfully', async () => {
      const mockDelivery = {
        id: 1,
        userId: 1,
        driverId: mockDriverId,
        status: DeliveryStatus.PICKED_UP,
        estimatedFare: 100,
        deliveryCode: mockDeliveryCode
      };
      const mockUpdatedDelivery = { ...mockDelivery, status: DeliveryStatus.DELIVERED };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDeliveryRepository.update.mockResolvedValue(mockUpdatedDelivery as any);
      mockPaymentRepository.create.mockResolvedValue({} as any);
      mockDriverRepository.update.mockResolvedValue({} as any);

      const result = await deliveryService.markDelivered(mockDeliveryId, mockDriverId, mockDeliveryCode);

      expect(mockDeliveryRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: DeliveryStatus.DELIVERED,
        deliveredAt: expect.any(Date),
        finalFare: 100
      }));
      expect(mockPaymentRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 1,
        driverId: mockDriverId,
        deliveryId: 1,
        amount: 100,
        commission: 15,
        driverEarnings: 85,
        status: PaymentStatus.COMPLETED
      }));
      expect(mockDriverRepository.update).toHaveBeenCalledWith(mockDriverId, { status: 'AVAILABLE' });
      expect(result).toEqual(mockUpdatedDelivery);
    });

    it('should throw error for invalid delivery code', async () => {
      const mockDelivery = {
        id: 1,
        driverId: mockDriverId,
        status: DeliveryStatus.PICKED_UP,
        deliveryCode: 'DIFFERENT'
      };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.markDelivered(mockDeliveryId, mockDriverId, mockDeliveryCode))
        .rejects.toThrow(new AppError('Invalid delivery code', 400));
    });

    it('should throw error if delivery cannot be completed', async () => {
      const mockDelivery = {
        id: 1,
        driverId: mockDriverId,
        status: DeliveryStatus.PENDING
      };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.markDelivered(mockDeliveryId, mockDriverId))
        .rejects.toThrow(new AppError('Delivery cannot be completed at this stage', 400));
    });
  });

  describe('cancelDelivery', () => {
    const mockDeliveryId = '1';
    const mockUserId = 1;
    const mockReason = 'Customer request';

    it('should cancel delivery successfully', async () => {
      const mockDelivery = {
        id: 1,
        userId: mockUserId,
        driverId: 2,
        status: DeliveryStatus.PENDING
      };
      const mockUpdatedDelivery = { ...mockDelivery, status: DeliveryStatus.CANCELLED };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDeliveryRepository.update.mockResolvedValue(mockUpdatedDelivery as any);
      mockDriverRepository.update.mockResolvedValue({} as any);

      const result = await deliveryService.cancelDelivery(mockDeliveryId, mockUserId, UserType.USER, mockReason);

      expect(mockDeliveryRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: DeliveryStatus.CANCELLED,
        cancelledAt: expect.any(Date),
        cancellationReason: mockReason
      }));
      expect(mockDriverRepository.update).toHaveBeenCalledWith(2, { status: 'AVAILABLE' });
      expect(result).toEqual(mockUpdatedDelivery);
    });

    it('should throw error for unauthorized cancellation', async () => {
      const mockDelivery = { id: 1, userId: 999, driverId: null, status: DeliveryStatus.PENDING };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.cancelDelivery(mockDeliveryId, mockUserId, UserType.USER, mockReason))
        .rejects.toThrow(new AppError('You do not have permission to cancel this delivery', 403));
    });

    it('should throw error if delivery cannot be cancelled', async () => {
      const mockDelivery = { id: 1, userId: mockUserId, status: DeliveryStatus.DELIVERED };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.cancelDelivery(mockDeliveryId, mockUserId, UserType.USER, mockReason))
        .rejects.toThrow(new AppError('Delivery cannot be cancelled', 400));
    });
  });

  describe('updateLocation', () => {
    const mockDeliveryId = '1';
    const mockDriverId = 1;
    const mockLocationData: UpdateDeliveryLocationData = {
      latitude: 40.7128,
      longitude: -74.0060
    };

    it('should update location successfully', async () => {
      const mockDelivery = {
        id: 1,
        driverId: mockDriverId,
        status: DeliveryStatus.DRIVER_ASSIGNED
      };
      const mockUpdatedDelivery = { ...mockDelivery, currentLatitude: 40.7128, currentLongitude: -74.0060 };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDeliveryRepository.update.mockResolvedValue(mockUpdatedDelivery as any);

      const result = await deliveryService.updateLocation(mockDeliveryId, mockDriverId, mockLocationData);

      expect(mockDeliveryRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        currentLatitude: 40.7128,
        currentLongitude: -74.0060
      }));
      expect(result).toEqual(mockUpdatedDelivery);
    });

    it('should update status to IN_TRANSIT if picked up', async () => {
      const mockDelivery = {
        id: 1,
        driverId: mockDriverId,
        status: DeliveryStatus.PICKED_UP
      };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);
      mockDeliveryRepository.update.mockResolvedValue({} as any);

      await deliveryService.updateLocation(mockDeliveryId, mockDriverId, mockLocationData);

      expect(mockDeliveryRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({
        status: DeliveryStatus.IN_TRANSIT
      }));
    });

    it('should throw error for invalid coordinates', async () => {
      const mockDelivery = { id: 1, driverId: mockDriverId, status: DeliveryStatus.PICKED_UP };
      const invalidLocationData = { latitude: 91, longitude: -74.0060 };

      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.updateLocation(mockDeliveryId, mockDriverId, invalidLocationData))
        .rejects.toThrow(new AppError('Invalid coordinates', 400));
    });

    it('should throw error if cannot update location for status', async () => {
      const mockDelivery = {
        id: 1,
        driverId: mockDriverId,
        status: DeliveryStatus.DELIVERED
      };
      mockDeliveryRepository.findById.mockResolvedValue(mockDelivery as any);

      await expect(deliveryService.updateLocation(mockDeliveryId, mockDriverId, mockLocationData))
        .rejects.toThrow(new AppError('Cannot update location for this delivery status', 400));
    });
  });

  describe('getDeliveryStatistics', () => {
    const mockAdminId = 1;
    const mockFilters: DeliveryStatisticsFilters = {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31')
    };

    it('should return delivery statistics successfully', async () => {
      const mockAdmin = { id: mockAdminId, userType: UserType.ADMIN };
      const mockCounts = [100, 80, 10, 5, 5]; // total, delivered, cancelled, pending, inProgress

      mockUserRepository.findById.mockResolvedValue(mockAdmin as any);
      mockDeliveryRepository.count
        .mockResolvedValueOnce(mockCounts[0])
        .mockResolvedValueOnce(mockCounts[1])
        .mockResolvedValueOnce(mockCounts[2])
        .mockResolvedValueOnce(mockCounts[3])
        .mockResolvedValueOnce(mockCounts[4]);

      const result = await deliveryService.getDeliveryStatistics(mockAdminId, mockFilters);

      expect(result).toEqual({
        totalDeliveries: 100,
        deliveredCount: 80,
        cancelledCount: 10,
        pendingCount: 5,
        inProgressCount: 5,
        deliveryRate: 80,
        cancellationRate: 10
      });
    });

    it('should throw error if not admin', async () => {
      const mockUser = { id: mockAdminId, userType: UserType.USER };
      mockUserRepository.findById.mockResolvedValue(mockUser as any);

      await expect(deliveryService.getDeliveryStatistics(mockAdminId, mockFilters))
        .rejects.toThrow(new AppError('Admin access required', 403));
    });

    it('should handle zero deliveries', async () => {
      const mockAdmin = { id: mockAdminId, userType: UserType.ADMIN };
      mockUserRepository.findById.mockResolvedValue(mockAdmin as any);
      mockDeliveryRepository.count.mockResolvedValue(0);

      const result = await deliveryService.getDeliveryStatistics(mockAdminId, mockFilters);

      expect(result.deliveryRate).toBe(0);
      expect(result.cancellationRate).toBe(0);
    });
  });

  describe('private methods', () => {
    describe('calculateDistance', () => {
      it('should calculate distance between two points', () => {
        // Access private method for testing
        const calculateDistance = (deliveryService as any).calculateDistance.bind(deliveryService);
        
        const distance = calculateDistance(40.7128, -74.0060, 40.7589, -73.9851);
        
        expect(distance).toBeGreaterThan(0);
        expect(typeof distance).toBe('number');
      });
    });

    describe('calculateDeliveryFare', () => {
      it('should calculate fare based on distance', () => {
        const calculateDeliveryFare = (deliveryService as any).calculateDeliveryFare.bind(deliveryService);
        
        const fare = calculateDeliveryFare(5); // 5km
        
        expect(fare).toBe(125); // 50 + (5 * 15) = 125
      });

      it('should apply weight multiplier for heavy packages', () => {
        const calculateDeliveryFare = (deliveryService as any).calculateDeliveryFare.bind(deliveryService);
        
        const fare = calculateDeliveryFare(5, 10); // 5km, 10kg
        
        expect(fare).toBeGreaterThan(125); // Should be higher due to weight
      });
    });

    describe('generateDeliveryCode', () => {
      it('should generate a delivery code', () => {
        const generateDeliveryCode = (deliveryService as any).generateDeliveryCode.bind(deliveryService);
        
        const code = generateDeliveryCode();
        
        expect(typeof code).toBe('string');
        expect(code.length).toBe(6);
        expect(code).toMatch(/^[A-Z0-9]+$/);
      });
    });
  });
});