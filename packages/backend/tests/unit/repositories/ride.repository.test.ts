import { RideRepository } from '../../../src/db/repositories/ride.repository';
import { prisma } from '../../../src/db';
import { RideStatus } from '@prisma/client';
import { mockRide, mockUser, mockDriver, mockLocation } from '../../fixtures';

// Mock Prisma
jest.mock('../../../src/db', () => ({
  prisma: {
    ride: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('RideRepository', () => {
  let rideRepository: RideRepository;

  beforeEach(() => {
    rideRepository = new RideRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find ride by id with all relations', async () => {
      const rideWithRelations = {
        ...mockRide,
        rider: { ...mockUser, wallet: { id: 1, balance: BigInt(1000) } },
        driver: {
          ...mockDriver,
          user: { ...mockUser, wallet: { id: 2, balance: BigInt(500) } },
          vehicles: [{ id: 1, model: { name: 'Toyota' }, vehicleType: { name: 'Sedan' } }],
        },
        pickupLocation: mockLocation,
        dropoffLocation: mockLocation,
      };

      mockPrisma.ride.findUnique.mockResolvedValue(rideWithRelations);

      const result = await rideRepository.findById(1);

      expect(mockPrisma.ride.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
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
          statusHistory: true,
        },
      });
      expect(result).toEqual(rideWithRelations);
    });

    it('should return null when ride not found', async () => {
      mockPrisma.ride.findUnique.mockResolvedValue(null);

      const result = await rideRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrisma.ride.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(rideRepository.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findMany', () => {
    it('should find rides with default options', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findMany();

      expect(mockPrisma.ride.findMany).toHaveBeenCalledWith({
        where: {},
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
          statusHistory: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(rides);
    });

    it('should find rides with status filter', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      await rideRepository.findMany({ status: RideStatus.PENDING });

      expect(mockPrisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: RideStatus.PENDING },
        })
      );
    });

    it('should find rides with userId filter', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      await rideRepository.findMany({ userId: 1 });

      expect(mockPrisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        })
      );
    });

    it('should find rides with driverId filter', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      await rideRepository.findMany({ driverId: 1 });

      expect(mockPrisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: 1 },
        })
      );
    });

    it('should find rides with pagination', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      await rideRepository.findMany({ page: 2, limit: 5 });

      expect(mockPrisma.ride.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('findManyPaginated', () => {
    it('should return paginated results', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);
      mockPrisma.ride.count.mockResolvedValue(10);

      const result = await rideRepository.findManyPaginated({ page: 1, limit: 5 });

      expect(result).toEqual({
        data: rides,
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      });
    });
  });

  describe('create', () => {
    it('should create ride with status history', async () => {
      const createData = {
        userId: 1,
        pickupLocationId: 1,
        dropOffLocationId: 2,
        fare: BigInt(1500),
      };

      const createdRide = { ...mockRide, ...createData };
      mockPrisma.$transaction.mockResolvedValue(createdRide);

      const result = await rideRepository.create(createData);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toEqual(createdRide);
    });

    it('should handle creation errors', async () => {
      const createData = {
        userId: 1,
        pickupLocationId: 1,
        dropOffLocationId: 2,
      };

      mockPrisma.$transaction.mockRejectedValue(new Error('Creation failed'));

      await expect(rideRepository.create(createData)).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    it('should update ride and create status history', async () => {
      const updateData = {
        driverId: 1,
        status: RideStatus.ASSIGNED,
      };

      const updatedRide = { ...mockRide, ...updateData };
      mockPrisma.$transaction.mockResolvedValue(updatedRide);

      const result = await rideRepository.update(1, updateData);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toEqual(updatedRide);
    });

    it('should handle update errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Update failed'));

      await expect(rideRepository.update(1, { status: RideStatus.ASSIGNED })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete ride', async () => {
      mockPrisma.ride.delete.mockResolvedValue(mockRide);

      await rideRepository.delete(1);

      expect(mockPrisma.ride.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle deletion errors', async () => {
      mockPrisma.ride.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(rideRepository.delete(1)).rejects.toThrow('Deletion failed');
    });
  });

  describe('count', () => {
    it('should count all rides', async () => {
      mockPrisma.ride.count.mockResolvedValue(5);

      const result = await rideRepository.count();

      expect(mockPrisma.ride.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(5);
    });

    it('should count rides with filters', async () => {
      mockPrisma.ride.count.mockResolvedValue(3);

      const result = await rideRepository.count({
        status: RideStatus.PENDING,
        userId: 1,
        driverId: 2,
      });

      expect(mockPrisma.ride.count).toHaveBeenCalledWith({
        where: {
          status: RideStatus.PENDING,
          userId: 1,
          driverId: 2,
        },
      });
      expect(result).toBe(3);
    });
  });

  describe('findByStatus', () => {
    it('should find rides by status', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findByStatus(RideStatus.PENDING);

      expect(result).toEqual(rides);
    });
  });

  describe('findByUserId', () => {
    it('should find rides by user id', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findByUserId(1);

      expect(result).toEqual(rides);
    });
  });

  describe('findByDriverId', () => {
    it('should find rides by driver id', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findByDriverId(1);

      expect(result).toEqual(rides);
    });
  });

  describe('assignDriver', () => {
    it('should assign driver to ride', async () => {
      const updatedRide = { ...mockRide, driverId: 1, status: RideStatus.ASSIGNED };
      mockPrisma.$transaction.mockResolvedValue(updatedRide);

      const result = await rideRepository.assignDriver(1, 1);

      expect(result).toEqual(updatedRide);
    });
  });

  describe('startRide', () => {
    it('should start ride', async () => {
      const startTime = new Date();
      const updatedRide = { ...mockRide, status: RideStatus.IN_PROGRESS, startTime };
      mockPrisma.$transaction.mockResolvedValue(updatedRide);

      const result = await rideRepository.startRide(1);

      expect(result.status).toBe(RideStatus.IN_PROGRESS);
      expect(result.startTime).toBeDefined();
    });
  });

  describe('completeRide', () => {
    it('should complete ride', async () => {
      const endTime = new Date();
      const updatedRide = { ...mockRide, status: RideStatus.COMPLETED, endTime };
      mockPrisma.$transaction.mockResolvedValue(updatedRide);

      const result = await rideRepository.completeRide(1);

      expect(result.status).toBe(RideStatus.COMPLETED);
      expect(result.endTime).toBeDefined();
    });
  });

  describe('cancelRide', () => {
    it('should cancel ride', async () => {
      const updatedRide = { ...mockRide, status: RideStatus.CANCELLED };
      mockPrisma.$transaction.mockResolvedValue(updatedRide);

      const result = await rideRepository.cancelRide(1);

      expect(result.status).toBe(RideStatus.CANCELLED);
    });
  });

  describe('driverArrived', () => {
    it('should mark driver as arrived', async () => {
      const updatedRide = { ...mockRide, status: RideStatus.DRIVER_ARRIVED };
      mockPrisma.$transaction.mockResolvedValue(updatedRide);

      const result = await rideRepository.driverArrived(1);

      expect(result.status).toBe(RideStatus.DRIVER_ARRIVED);
    });
  });

  describe('findActiveRides', () => {
    it('should find active rides', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findActiveRides();

      expect(result).toEqual(rides);
    });
  });

  describe('findPendingRides', () => {
    it('should find pending rides', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findPendingRides();

      expect(result).toEqual(rides);
    });
  });

  describe('findRideHistory', () => {
    it('should find ride history for user', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findRideHistory(1);

      expect(result).toEqual(rides);
    });
  });

  describe('findDriverRideHistory', () => {
    it('should find ride history for driver', async () => {
      const rides = [mockRide];
      mockPrisma.ride.findMany.mockResolvedValue(rides);

      const result = await rideRepository.findDriverRideHistory(1);

      expect(result).toEqual(rides);
    });
  });

  describe('getActiveRideForUser', () => {
    it('should get active ride for user', async () => {
      const activeRide = { ...mockRide, status: RideStatus.IN_PROGRESS };
      mockPrisma.ride.findFirst.mockResolvedValue(activeRide);

      const result = await rideRepository.getActiveRideForUser(1);

      expect(mockPrisma.ride.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: {
            in: [RideStatus.PENDING, RideStatus.ASSIGNED, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(activeRide);
    });

    it('should return null when no active ride found', async () => {
      mockPrisma.ride.findFirst.mockResolvedValue(null);

      const result = await rideRepository.getActiveRideForUser(1);

      expect(result).toBeNull();
    });
  });

  describe('getActiveRideForDriver', () => {
    it('should get active ride for driver', async () => {
      const activeRide = { ...mockRide, status: RideStatus.ASSIGNED };
      mockPrisma.ride.findFirst.mockResolvedValue(activeRide);

      const result = await rideRepository.getActiveRideForDriver(1);

      expect(mockPrisma.ride.findFirst).toHaveBeenCalledWith({
        where: {
          driverId: 1,
          status: {
            in: [RideStatus.ASSIGNED, RideStatus.DRIVER_ARRIVED, RideStatus.IN_PROGRESS],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(activeRide);
    });

    it('should return null when no active ride found', async () => {
      mockPrisma.ride.findFirst.mockResolvedValue(null);

      const result = await rideRepository.getActiveRideForDriver(1);

      expect(result).toBeNull();
    });
  });
});