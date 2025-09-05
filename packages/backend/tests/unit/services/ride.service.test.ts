import { RideService, CreateRideData, RideFilters, UpdateLocationData, CompleteRideData } from '../../../src/services/ride.service';
import { RideRepository } from '../../../src/db/repositories/ride.repository';
import { UserRepository } from '../../../src/db/repositories/user.repository';
import { DriverRepository } from '../../../src/db/repositories/driver.repository';
import { VehicleRepository } from '../../../src/db/repositories/vehicle.repository';
import { WalletRepository } from '../../../src/db/repositories/wallet.repository';
import { AdminLogRepository } from '../../../src/db/repositories/adminlog.repository';
import { AppError } from '../../../src/middleware/error.middleware';
import { RideStatus, VehicleType, UserType } from '@prisma/client';

// Mock all repositories
jest.mock('../../../src/db/repositories/ride.repository');
jest.mock('../../../src/db/repositories/user.repository');
jest.mock('../../../src/db/repositories/driver.repository');
jest.mock('../../../src/db/repositories/vehicle.repository');
jest.mock('../../../src/db/repositories/wallet.repository');
jest.mock('../../../src/db/repositories/adminlog.repository');

describe('RideService', () => {
  let rideService: RideService;
  let mockRideRepository: jest.Mocked<RideRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockDriverRepository: jest.Mocked<DriverRepository>;
  let mockVehicleRepository: jest.Mocked<VehicleRepository>;
  let mockWalletRepository: jest.Mocked<WalletRepository>;
  let mockAdminLogRepository: jest.Mocked<AdminLogRepository>;

  const mockUser = {
    id: 'user-1',
    email: 'user@test.com',
    phoneNumber: '+1234567890',
    firstName: 'John',
    lastName: 'Doe',
    userType: UserType.RIDER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockDriver = {
    id: 'driver-1',
    userId: 'user-2',
    licenseNumber: 'DL123456',
    vehicleType: VehicleType.ECONOMY,
    isVerified: true,
    isActive: true,
    status: 'AVAILABLE',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockVehicle = {
    id: 'vehicle-1',
    driverId: 'driver-1',
    vehicleType: VehicleType.ECONOMY,
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    licensePlate: 'ABC123',
    color: 'White',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockRide = {
    id: 'ride-1',
    userId: 'user-1',
    driverId: null,
    pickupLatitude: 40.7128,
    pickupLongitude: -74.0060,
    pickupAddress: '123 Main St',
    destinationLatitude: 40.7589,
    destinationLongitude: -73.9851,
    destinationAddress: '456 Broadway',
    vehicleType: VehicleType.ECONOMY,
    status: RideStatus.PENDING,
    estimatedDistance: 5.2,
    estimatedDuration: 900,
    estimatedFare: 12.50,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mocked instances
    mockRideRepository = new RideRepository() as jest.Mocked<RideRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;
    mockDriverRepository = new DriverRepository() as jest.Mocked<DriverRepository>;
    mockVehicleRepository = new VehicleRepository() as jest.Mocked<VehicleRepository>;
    mockWalletRepository = new WalletRepository() as jest.Mocked<WalletRepository>;
    mockAdminLogRepository = new AdminLogRepository() as jest.Mocked<AdminLogRepository>;

    // Mock constructors to return our mocked instances
    (RideRepository as jest.MockedClass<typeof RideRepository>).mockImplementation(() => mockRideRepository);
    (UserRepository as jest.MockedClass<typeof UserRepository>).mockImplementation(() => mockUserRepository);
    (DriverRepository as jest.MockedClass<typeof DriverRepository>).mockImplementation(() => mockDriverRepository);
    (VehicleRepository as jest.MockedClass<typeof VehicleRepository>).mockImplementation(() => mockVehicleRepository);
    (WalletRepository as jest.MockedClass<typeof WalletRepository>).mockImplementation(() => mockWalletRepository);
    (AdminLogRepository as jest.MockedClass<typeof AdminLogRepository>).mockImplementation(() => mockAdminLogRepository);

    rideService = new RideService();
  });

  describe('createRide', () => {
    const createRideData: CreateRideData = {
      userId: 'user-1',
      pickupLatitude: 40.7128,
      pickupLongitude: -74.0060,
      pickupAddress: '123 Main St',
      destinationLatitude: 40.7589,
      destinationLongitude: -73.9851,
      destinationAddress: '456 Broadway',
      vehicleType: VehicleType.ECONOMY,
      estimatedDistance: 5.2,
      estimatedDuration: 900,
      notes: 'Please wait at the entrance'
    };

    it('should create a ride successfully', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRideRepository.findByUserId.mockResolvedValue([]);
      mockRideRepository.create.mockResolvedValue({ ...mockRide, notes: 'Please wait at the entrance' });
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      const result = await rideService.createRide(createRideData);

      expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
      expect(mockRideRepository.findByUserId).toHaveBeenCalledWith('user-1', {
        status: [RideStatus.PENDING, RideStatus.ACCEPTED, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS]
      });
      expect(mockRideRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: 'user-1',
        status: RideStatus.PENDING,
        notes: 'Please wait at the entrance'
      }));
      expect(mockAdminLogRepository.logRideAction).toHaveBeenCalled();
      expect(result.notes).toBe('Please wait at the entrance');
    });

    it('should throw error if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await expect(rideService.createRide(createRideData))
        .rejects.toThrow(new AppError('User not found', 404));
    });

    it('should throw error if user is not active', async () => {
      mockUserRepository.findById.mockResolvedValue({ ...mockUser, isActive: false });

      await expect(rideService.createRide(createRideData))
        .rejects.toThrow(new AppError('User account is not active', 403));
    });

    it('should throw error if user is not a rider', async () => {
      mockUserRepository.findById.mockResolvedValue({ ...mockUser, userType: UserType.DRIVER });

      await expect(rideService.createRide(createRideData))
        .rejects.toThrow(new AppError('Only riders can create ride requests', 403));
    });

    it('should throw error if user has active rides', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRideRepository.findByUserId.mockResolvedValue([mockRide]);

      await expect(rideService.createRide(createRideData))
        .rejects.toThrow(new AppError('You already have an active ride request', 400));
    });

    it('should calculate estimated fare if not provided', async () => {
      const dataWithoutFare = { ...createRideData };
      delete dataWithoutFare.estimatedFare;

      mockUserRepository.findById.mockResolvedValue(mockUser);
      mockRideRepository.findByUserId.mockResolvedValue([]);
      mockRideRepository.create.mockResolvedValue(mockRide);
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      await rideService.createRide(dataWithoutFare);

      expect(mockRideRepository.create).toHaveBeenCalledWith(expect.objectContaining({
        estimatedFare: expect.any(Number)
      }));
    });
  });

  describe('getRideById', () => {
    it('should return ride for authorized user', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);

      const result = await rideService.getRideById('ride-1', 'user-1', UserType.RIDER);

      expect(mockRideRepository.findById).toHaveBeenCalledWith('ride-1');
      expect(result).toEqual(mockRide);
    });

    it('should return ride for admin', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);

      const result = await rideService.getRideById('ride-1', 'admin-1', UserType.ADMIN);

      expect(result).toEqual(mockRide);
    });

    it('should throw error if ride not found', async () => {
      mockRideRepository.findById.mockResolvedValue(null);

      await expect(rideService.getRideById('ride-1', 'user-1', UserType.RIDER))
        .rejects.toThrow(new AppError('Ride not found', 404));
    });

    it('should throw error for unauthorized access', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);

      await expect(rideService.getRideById('ride-1', 'other-user', UserType.RIDER))
        .rejects.toThrow(new AppError('Access denied', 403));
    });
  });

  describe('getRides', () => {
    const filters: RideFilters = {
      status: RideStatus.PENDING,
      page: 1,
      limit: 10
    };

    it('should return rides for rider with user filter', async () => {
      const rides = [mockRide];
      mockRideRepository.findMany.mockResolvedValue(rides);

      const result = await rideService.getRides(filters, 'user-1', UserType.RIDER);

      expect(mockRideRepository.findMany).toHaveBeenCalledWith({
        ...filters,
        userId: 'user-1'
      });
      expect(result).toEqual(rides);
    });

    it('should return rides for driver with driver filter', async () => {
      const rides = [mockRide];
      mockRideRepository.findMany.mockResolvedValue(rides);

      const result = await rideService.getRides(filters, 'driver-1', UserType.DRIVER);

      expect(mockRideRepository.findMany).toHaveBeenCalledWith({
        ...filters,
        driverId: 'driver-1'
      });
      expect(result).toEqual(rides);
    });

    it('should return all rides for admin', async () => {
      const rides = [mockRide];
      mockRideRepository.findMany.mockResolvedValue(rides);

      const result = await rideService.getRides(filters, 'admin-1', UserType.ADMIN);

      expect(mockRideRepository.findMany).toHaveBeenCalledWith(filters);
      expect(result).toEqual(rides);
    });
  });

  describe('getAvailableRides', () => {
    it('should return available rides for driver', async () => {
      const availableRides = [mockRide];
      mockDriverRepository.findById.mockResolvedValue(mockDriver);
      mockVehicleRepository.findByDriverId.mockResolvedValue([mockVehicle]);
      mockRideRepository.findAvailableRides.mockResolvedValue(availableRides);

      const result = await rideService.getAvailableRides('driver-1', { page: 1, limit: 10 });

      expect(mockDriverRepository.findById).toHaveBeenCalledWith('driver-1');
      expect(mockVehicleRepository.findByDriverId).toHaveBeenCalledWith('driver-1', { isActive: true });
      expect(mockRideRepository.findAvailableRides).toHaveBeenCalledWith({
        vehicleTypes: [VehicleType.ECONOMY],
        page: 1,
        limit: 10
      });
      expect(result).toEqual(availableRides);
    });

    it('should throw error if driver not found', async () => {
      mockDriverRepository.findById.mockResolvedValue(null);

      await expect(rideService.getAvailableRides('driver-1', {}))
        .rejects.toThrow(new AppError('Driver not found', 404));
    });

    it('should throw error if driver not available', async () => {
      mockDriverRepository.findById.mockResolvedValue({ ...mockDriver, status: 'BUSY' });

      await expect(rideService.getAvailableRides('driver-1', {}))
        .rejects.toThrow(new AppError('Driver is not available for rides', 403));
    });
  });

  describe('assignDriver', () => {
    it('should assign driver to ride successfully', async () => {
      const updatedRide = { ...mockRide, driverId: 'driver-1', status: RideStatus.ACCEPTED };
      mockRideRepository.findById.mockResolvedValue(mockRide);
      mockDriverRepository.findById.mockResolvedValue(mockDriver);
      mockVehicleRepository.findByDriverId.mockResolvedValue([mockVehicle]);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockDriverRepository.update.mockResolvedValue({ ...mockDriver, status: 'BUSY' });
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      const result = await rideService.assignDriver('ride-1', 'driver-1', 'admin-1');

      expect(mockRideRepository.update).toHaveBeenCalledWith('ride-1', {
        driverId: 'driver-1',
        status: RideStatus.ACCEPTED,
        acceptedAt: expect.any(Date)
      });
      expect(mockDriverRepository.update).toHaveBeenCalledWith('driver-1', { status: 'BUSY' });
      expect(result).toEqual(updatedRide);
    });

    it('should throw error if ride not found', async () => {
      mockRideRepository.findById.mockResolvedValue(null);

      await expect(rideService.assignDriver('ride-1', 'driver-1', 'admin-1'))
        .rejects.toThrow(new AppError('Ride not found', 404));
    });

    it('should throw error if ride not pending', async () => {
      mockRideRepository.findById.mockResolvedValue({ ...mockRide, status: RideStatus.ACCEPTED });

      await expect(rideService.assignDriver('ride-1', 'driver-1', 'admin-1'))
        .rejects.toThrow(new AppError('Ride is not available for assignment', 400));
    });

    it('should throw error if driver not found', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);
      mockDriverRepository.findById.mockResolvedValue(null);

      await expect(rideService.assignDriver('ride-1', 'driver-1', 'admin-1'))
        .rejects.toThrow(new AppError('Driver not found', 404));
    });

    it('should throw error if driver not available', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);
      mockDriverRepository.findById.mockResolvedValue({ ...mockDriver, status: 'BUSY' });

      await expect(rideService.assignDriver('ride-1', 'driver-1', 'admin-1'))
        .rejects.toThrow(new AppError('Driver is not available', 400));
    });

    it('should throw error if no compatible vehicle', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);
      mockDriverRepository.findById.mockResolvedValue(mockDriver);
      mockVehicleRepository.findByDriverId.mockResolvedValue([]);

      await expect(rideService.assignDriver('ride-1', 'driver-1', 'admin-1'))
        .rejects.toThrow(new AppError('Driver does not have a compatible vehicle', 400));
    });
  });

  describe('acceptRide', () => {
    it('should accept ride successfully', async () => {
      const updatedRide = { ...mockRide, driverId: 'driver-1', status: RideStatus.ACCEPTED };
      mockRideRepository.findById.mockResolvedValue(mockRide);
      mockDriverRepository.findById.mockResolvedValue(mockDriver);
      mockVehicleRepository.findByDriverId.mockResolvedValue([mockVehicle]);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockDriverRepository.update.mockResolvedValue({ ...mockDriver, status: 'BUSY' });
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      const result = await rideService.acceptRide('ride-1', 'driver-1');

      expect(result).toEqual(updatedRide);
    });

    it('should throw error if ride not pending', async () => {
      mockRideRepository.findById.mockResolvedValue({ ...mockRide, status: RideStatus.ACCEPTED });

      await expect(rideService.acceptRide('ride-1', 'driver-1'))
        .rejects.toThrow(new AppError('Ride is not available for acceptance', 400));
    });
  });

  describe('arriveAtPickup', () => {
    it('should mark driver as arrived successfully', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.ACCEPTED };
      const updatedRide = { ...rideWithDriver, status: RideStatus.DRIVER_ARRIVED };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      const result = await rideService.arriveAtPickup('ride-1', 'driver-1');

      expect(mockRideRepository.update).toHaveBeenCalledWith('ride-1', {
        status: RideStatus.DRIVER_ARRIVED,
        arrivedAt: expect.any(Date)
      });
      expect(result).toEqual(updatedRide);
    });

    it('should throw error if ride not found', async () => {
      mockRideRepository.findById.mockResolvedValue(null);

      await expect(rideService.arriveAtPickup('ride-1', 'driver-1'))
        .rejects.toThrow(new AppError('Ride not found', 404));
    });

    it('should throw error if access denied', async () => {
      const rideWithDifferentDriver = { ...mockRide, driverId: 'other-driver' };
      mockRideRepository.findById.mockResolvedValue(rideWithDifferentDriver);

      await expect(rideService.arriveAtPickup('ride-1', 'driver-1'))
        .rejects.toThrow(new AppError('Access denied', 403));
    });

    it('should throw error if invalid status', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.PENDING };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);

      await expect(rideService.arriveAtPickup('ride-1', 'driver-1'))
        .rejects.toThrow(new AppError('Invalid ride status for arrival', 400));
    });
  });

  describe('startRide', () => {
    it('should start ride successfully', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.DRIVER_ARRIVED };
      const updatedRide = { ...rideWithDriver, status: RideStatus.IN_PROGRESS };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      const result = await rideService.startRide('ride-1', 'driver-1');

      expect(mockRideRepository.update).toHaveBeenCalledWith('ride-1', {
        status: RideStatus.IN_PROGRESS,
        startedAt: expect.any(Date)
      });
      expect(result).toEqual(updatedRide);
    });

    it('should throw error if invalid status', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.ACCEPTED };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);

      await expect(rideService.startRide('ride-1', 'driver-1'))
        .rejects.toThrow(new AppError('Invalid ride status for starting', 400));
    });
  });

  describe('completeRide', () => {
    const completeRideData: CompleteRideData = {
      actualFare: 15.00,
      actualDistance: 5.5,
      actualDuration: 1200
    };

    it('should complete ride successfully', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.IN_PROGRESS };
      const updatedRide = { ...rideWithDriver, status: RideStatus.COMPLETED, actualFare: 15.00 };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockWalletRepository.deductBalance.mockResolvedValue(undefined);
      mockWalletRepository.addBalance.mockResolvedValue(undefined);
      mockDriverRepository.update.mockResolvedValue({ ...mockDriver, status: 'AVAILABLE' });
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);
      mockAdminLogRepository.logPaymentAction.mockResolvedValue(undefined);

      const result = await rideService.completeRide('ride-1', 'driver-1', completeRideData);

      expect(mockRideRepository.update).toHaveBeenCalledWith('ride-1', {
        status: RideStatus.COMPLETED,
        completedAt: expect.any(Date),
        actualFare: 15.00,
        actualDistance: 5.5,
        actualDuration: 1200
      });
      expect(mockWalletRepository.deductBalance).toHaveBeenCalledWith('user-1', 15.00, expect.any(Object));
      expect(mockWalletRepository.addBalance).toHaveBeenCalledWith('driver-1', 12.75, expect.any(Object)); // 15 - 15% commission
      expect(mockDriverRepository.update).toHaveBeenCalledWith('driver-1', { status: 'AVAILABLE' });
      expect(result).toEqual(updatedRide);
    });

    it('should use estimated fare if actual fare not provided', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.IN_PROGRESS, estimatedFare: 12.50 };
      const updatedRide = { ...rideWithDriver, status: RideStatus.COMPLETED, actualFare: 12.50 };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockWalletRepository.deductBalance.mockResolvedValue(undefined);
      mockWalletRepository.addBalance.mockResolvedValue(undefined);
      mockDriverRepository.update.mockResolvedValue({ ...mockDriver, status: 'AVAILABLE' });
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);
      mockAdminLogRepository.logPaymentAction.mockResolvedValue(undefined);

      await rideService.completeRide('ride-1', 'driver-1', { actualDistance: 5.0 });

      expect(mockWalletRepository.deductBalance).toHaveBeenCalledWith('user-1', 12.50, expect.any(Object));
    });

    it('should handle payment failure', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.IN_PROGRESS };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);
      mockWalletRepository.deductBalance.mockRejectedValue(new Error('Insufficient balance'));
      mockAdminLogRepository.logPaymentAction.mockResolvedValue(undefined);

      await expect(rideService.completeRide('ride-1', 'driver-1', completeRideData))
        .rejects.toThrow(new AppError('Payment processing failed', 500));

      expect(mockAdminLogRepository.logPaymentAction).toHaveBeenCalledWith(
        'user-1',
        'RIDE_PAYMENT_FAILED',
        expect.stringContaining('Insufficient balance'),
        expect.any(Object)
      );
    });
  });

  describe('cancelRide', () => {
    it('should cancel ride successfully by rider', async () => {
      const updatedRide = { ...mockRide, status: RideStatus.CANCELLED };
      mockRideRepository.findById.mockResolvedValue(mockRide);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      const result = await rideService.cancelRide('ride-1', 'user-1', UserType.RIDER, 'Changed plans');

      expect(mockRideRepository.update).toHaveBeenCalledWith('ride-1', {
        status: RideStatus.CANCELLED,
        cancelledAt: expect.any(Date),
        cancellationReason: 'Changed plans'
      });
      expect(result).toEqual(updatedRide);
    });

    it('should cancel ride and free driver', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.ACCEPTED };
      const updatedRide = { ...rideWithDriver, status: RideStatus.CANCELLED };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);
      mockRideRepository.update.mockResolvedValue(updatedRide);
      mockDriverRepository.update.mockResolvedValue({ ...mockDriver, status: 'AVAILABLE' });
      mockAdminLogRepository.logRideAction.mockResolvedValue(undefined);

      await rideService.cancelRide('ride-1', 'user-1', UserType.RIDER);

      expect(mockDriverRepository.update).toHaveBeenCalledWith('driver-1', { status: 'AVAILABLE' });
    });

    it('should throw error for unauthorized cancellation', async () => {
      mockRideRepository.findById.mockResolvedValue(mockRide);

      await expect(rideService.cancelRide('ride-1', 'other-user', UserType.RIDER))
        .rejects.toThrow(new AppError('Access denied', 403));
    });

    it('should throw error for invalid status', async () => {
      const completedRide = { ...mockRide, status: RideStatus.COMPLETED };
      mockRideRepository.findById.mockResolvedValue(completedRide);

      await expect(rideService.cancelRide('ride-1', 'user-1', UserType.RIDER))
        .rejects.toThrow(new AppError('Ride cannot be cancelled at this stage', 400));
    });
  });

  describe('updateLocation', () => {
    const locationData: UpdateLocationData = {
      latitude: 40.7500,
      longitude: -73.9900
    };

    it('should update location successfully', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.ACCEPTED };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);
      mockRideRepository.updateLocation.mockResolvedValue(rideWithDriver);

      const result = await rideService.updateLocation('ride-1', 'driver-1', locationData);

      expect(mockRideRepository.updateLocation).toHaveBeenCalledWith('ride-1', 40.7500, -73.9900);
      expect(result).toEqual(rideWithDriver);
    });

    it('should throw error if ride not found', async () => {
      mockRideRepository.findById.mockResolvedValue(null);

      await expect(rideService.updateLocation('ride-1', 'driver-1', locationData))
        .rejects.toThrow(new AppError('Ride not found', 404));
    });

    it('should throw error for access denied', async () => {
      const rideWithDifferentDriver = { ...mockRide, driverId: 'other-driver' };
      mockRideRepository.findById.mockResolvedValue(rideWithDifferentDriver);

      await expect(rideService.updateLocation('ride-1', 'driver-1', locationData))
        .rejects.toThrow(new AppError('Access denied', 403));
    });

    it('should throw error for invalid status', async () => {
      const rideWithDriver = { ...mockRide, driverId: 'driver-1', status: RideStatus.COMPLETED };
      mockRideRepository.findById.mockResolvedValue(rideWithDriver);

      await expect(rideService.updateLocation('ride-1', 'driver-1', locationData))
        .rejects.toThrow(new AppError('Cannot update location for this ride status', 400));
    });
  });

  describe('getRideStatistics', () => {
    it('should return ride statistics', async () => {
      const mockStats = {
        totalRides: 100,
        completedRides: 85,
        cancelledRides: 15,
        totalRevenue: 2500.00
      };
      mockRideRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await rideService.getRideStatistics();

      expect(mockRideRepository.getStatistics).toHaveBeenCalledWith(undefined, undefined);
      expect(result).toEqual(mockStats);
    });

    it('should return statistics with date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const mockStats = { totalRides: 50 };
      mockRideRepository.getStatistics.mockResolvedValue(mockStats);

      const result = await rideService.getRideStatistics(startDate, endDate);

      expect(mockRideRepository.getStatistics).toHaveBeenCalledWith(startDate, endDate);
      expect(result).toEqual(mockStats);
    });
  });

  describe('calculateEstimatedFare', () => {
    it('should calculate fare for economy vehicle', () => {
      // Access private method through any casting
      const service = rideService as any;
      const fare = service.calculateEstimatedFare(VehicleType.ECONOMY, 5.0, 600);
      
      // Base: 2.5, Distance: 5 * 1.2 = 6, Time: 10 * 0.3 = 3, Total: 11.5
      expect(fare).toBe(11.5);
    });

    it('should calculate fare without duration', () => {
      const service = rideService as any;
      const fare = service.calculateEstimatedFare(VehicleType.COMFORT, 3.0);
      
      // Base: 3.5, Distance: 3 * 1.8 = 5.4, Total: 8.9
      expect(fare).toBe(8.9);
    });

    it('should calculate fare for different vehicle types', () => {
      const service = rideService as any;
      
      const businessFare = service.calculateEstimatedFare(VehicleType.BUSINESS, 2.0, 300);
      const motorcycleFare = service.calculateEstimatedFare(VehicleType.MOTORCYCLE, 2.0, 300);
      const bicycleFare = service.calculateEstimatedFare(VehicleType.BICYCLE, 2.0, 300);
      
      expect(businessFare).toBeGreaterThan(motorcycleFare);
      expect(motorcycleFare).toBeGreaterThan(bicycleFare);
    });
  });
});