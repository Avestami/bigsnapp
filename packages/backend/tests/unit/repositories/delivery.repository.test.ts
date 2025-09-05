import { DeliveryRepository } from '../../../src/db/repositories/delivery.repository';
import { prisma } from '../../../src/db';
import { DeliveryRequestStatus } from '@prisma/client';
import { mockDelivery, mockUser, mockDriver, mockLocation } from '../../fixtures';

// Mock Prisma
jest.mock('../../../src/db', () => ({
  prisma: {
    deliveryRequest: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    deliveryAssignment: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('DeliveryRepository', () => {
  let deliveryRepository: DeliveryRepository;

  beforeEach(() => {
    deliveryRepository = new DeliveryRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find delivery by id with all relations', async () => {
      const deliveryWithRelations = {
        ...mockDelivery,
        user: { ...mockUser, wallet: { id: 1, balance: BigInt(1000) } },
        driver: {
          ...mockDriver,
          user: { ...mockUser, wallet: { id: 2, balance: BigInt(500) } },
          vehicles: [{ id: 1, model: { name: 'Toyota' }, vehicleType: { name: 'Van' } }],
        },
        senderLocation: mockLocation,
        receiverLocation: mockLocation,
      };

      mockPrisma.deliveryRequest.findUnique.mockResolvedValue(deliveryWithRelations);

      const result = await deliveryRepository.findById(1);

      expect(mockPrisma.deliveryRequest.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          user: {
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
          senderLocation: true,
          receiverLocation: true,
          payments: true,
          reviews: true,
          assignments: true,
          statusHistory: true,
        },
      });
      expect(result).toEqual(deliveryWithRelations);
    });

    it('should return null when delivery not found', async () => {
      mockPrisma.deliveryRequest.findUnique.mockResolvedValue(null);

      const result = await deliveryRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrisma.deliveryRequest.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(deliveryRepository.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findMany', () => {
    it('should find deliveries with default options', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findMany();

      expect(mockPrisma.deliveryRequest.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          user: {
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
          senderLocation: true,
          receiverLocation: true,
          payments: true,
          reviews: true,
          assignments: true,
          statusHistory: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(deliveries);
    });

    it('should find deliveries with status filter', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      await deliveryRepository.findMany({ status: DeliveryRequestStatus.PENDING });

      expect(mockPrisma.deliveryRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: DeliveryRequestStatus.PENDING },
        })
      );
    });

    it('should find deliveries with userId filter', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      await deliveryRepository.findMany({ userId: 1 });

      expect(mockPrisma.deliveryRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 1 },
        })
      );
    });

    it('should find deliveries with driverId filter', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      await deliveryRepository.findMany({ driverId: 1 });

      expect(mockPrisma.deliveryRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { driverId: 1 },
        })
      );
    });

    it('should find deliveries with pagination', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      await deliveryRepository.findMany({ page: 2, limit: 5 });

      expect(mockPrisma.deliveryRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('findManyPaginated', () => {
    it('should return paginated results', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);
      mockPrisma.deliveryRequest.count.mockResolvedValue(10);

      const result = await deliveryRepository.findManyPaginated({ page: 1, limit: 5 });

      expect(result).toEqual({
        data: deliveries,
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      });
    });
  });

  describe('create', () => {
    it('should create delivery with status history', async () => {
      const createData = {
        userId: 1,
        senderName: 'John Doe',
        senderPhone: '+1234567890',
        senderLocationId: 1,
        receiverName: 'Jane Smith',
        receiverPhone: '+0987654321',
        receiverLocationId: 2,
        packageWeight: 2.5,
        packageType: 'Electronics',
        description: 'Laptop delivery',
        fare: BigInt(2000),
      };

      const createdDelivery = { ...mockDelivery, ...createData };
      mockPrisma.$transaction.mockResolvedValue(createdDelivery);

      const result = await deliveryRepository.create(createData);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toEqual(createdDelivery);
    });

    it('should handle creation errors', async () => {
      const createData = {
        userId: 1,
        senderName: 'John Doe',
        senderPhone: '+1234567890',
        senderLocationId: 1,
        receiverName: 'Jane Smith',
        receiverPhone: '+0987654321',
        receiverLocationId: 2,
      };

      mockPrisma.$transaction.mockRejectedValue(new Error('Creation failed'));

      await expect(deliveryRepository.create(createData)).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    it('should update delivery and create status history', async () => {
      const updateData = {
        driverId: 1,
        status: DeliveryRequestStatus.ASSIGNED,
      };

      const updatedDelivery = { ...mockDelivery, ...updateData };
      mockPrisma.$transaction.mockResolvedValue(updatedDelivery);

      const result = await deliveryRepository.update(1, updateData);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
      expect(result).toEqual(updatedDelivery);
    });

    it('should handle update errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Update failed'));

      await expect(deliveryRepository.update(1, { status: DeliveryRequestStatus.ASSIGNED })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete delivery', async () => {
      mockPrisma.deliveryRequest.delete.mockResolvedValue(mockDelivery);

      await deliveryRepository.delete(1);

      expect(mockPrisma.deliveryRequest.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle deletion errors', async () => {
      mockPrisma.deliveryRequest.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(deliveryRepository.delete(1)).rejects.toThrow('Deletion failed');
    });
  });

  describe('count', () => {
    it('should count all deliveries', async () => {
      mockPrisma.deliveryRequest.count.mockResolvedValue(5);

      const result = await deliveryRepository.count();

      expect(mockPrisma.deliveryRequest.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(5);
    });

    it('should count deliveries with filters', async () => {
      mockPrisma.deliveryRequest.count.mockResolvedValue(3);

      const result = await deliveryRepository.count({
        status: DeliveryRequestStatus.PENDING,
        userId: 1,
        driverId: 2,
      });

      expect(mockPrisma.deliveryRequest.count).toHaveBeenCalledWith({
        where: {
          status: DeliveryRequestStatus.PENDING,
          userId: 1,
          driverId: 2,
        },
      });
      expect(result).toBe(3);
    });
  });

  describe('findByStatus', () => {
    it('should find deliveries by status', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findByStatus(DeliveryRequestStatus.PENDING);

      expect(result).toEqual(deliveries);
    });
  });

  describe('findByUserId', () => {
    it('should find deliveries by user id', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findByUserId(1);

      expect(result).toEqual(deliveries);
    });
  });

  describe('findByDriverId', () => {
    it('should find deliveries by driver id', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findByDriverId(1);

      expect(result).toEqual(deliveries);
    });
  });

  describe('assignDriver', () => {
    it('should assign driver to delivery and create assignment record', async () => {
      const updatedDelivery = { ...mockDelivery, driverId: 1, status: DeliveryRequestStatus.ASSIGNED };
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          deliveryAssignment: {
            create: jest.fn(),
          },
        });
      });
      mockPrisma.$transaction.mockResolvedValue(updatedDelivery);

      const result = await deliveryRepository.assignDriver(1, 1);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(updatedDelivery);
    });

    it('should handle assignment errors', async () => {
      mockPrisma.$transaction.mockRejectedValue(new Error('Assignment failed'));

      await expect(deliveryRepository.assignDriver(1, 1)).rejects.toThrow('Assignment failed');
    });
  });

  describe('pickupDelivery', () => {
    it('should pickup delivery', async () => {
      const pickupTime = new Date();
      const updatedDelivery = { ...mockDelivery, status: DeliveryRequestStatus.PICKED_UP, pickupTime };
      mockPrisma.$transaction.mockResolvedValue(updatedDelivery);

      const result = await deliveryRepository.pickupDelivery(1);

      expect(result.status).toBe(DeliveryRequestStatus.PICKED_UP);
      expect(result.pickupTime).toBeDefined();
    });
  });

  describe('deliverPackage', () => {
    it('should deliver package', async () => {
      const deliveryTime = new Date();
      const updatedDelivery = { ...mockDelivery, status: DeliveryRequestStatus.DELIVERED, deliveryTime };
      mockPrisma.$transaction.mockResolvedValue(updatedDelivery);

      const result = await deliveryRepository.deliverPackage(1);

      expect(result.status).toBe(DeliveryRequestStatus.DELIVERED);
      expect(result.deliveryTime).toBeDefined();
    });
  });

  describe('cancelDelivery', () => {
    it('should cancel delivery', async () => {
      const updatedDelivery = { ...mockDelivery, status: DeliveryRequestStatus.CANCELLED };
      mockPrisma.$transaction.mockResolvedValue(updatedDelivery);

      const result = await deliveryRepository.cancelDelivery(1);

      expect(result.status).toBe(DeliveryRequestStatus.CANCELLED);
    });
  });

  describe('driverArrived', () => {
    it('should mark driver as arrived', async () => {
      const updatedDelivery = { ...mockDelivery, status: DeliveryRequestStatus.DRIVER_ARRIVED };
      mockPrisma.$transaction.mockResolvedValue(updatedDelivery);

      const result = await deliveryRepository.driverArrived(1);

      expect(result.status).toBe(DeliveryRequestStatus.DRIVER_ARRIVED);
    });
  });

  describe('findActiveDeliveries', () => {
    it('should find active deliveries', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findActiveDeliveries();

      expect(result).toEqual(deliveries);
    });
  });

  describe('findPendingDeliveries', () => {
    it('should find pending deliveries', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findPendingDeliveries();

      expect(result).toEqual(deliveries);
    });
  });

  describe('findDeliveryHistory', () => {
    it('should find delivery history for user', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findDeliveryHistory(1);

      expect(result).toEqual(deliveries);
    });
  });

  describe('findDriverDeliveryHistory', () => {
    it('should find delivery history for driver', async () => {
      const deliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(deliveries);

      const result = await deliveryRepository.findDriverDeliveryHistory(1);

      expect(result).toEqual(deliveries);
    });
  });

  describe('getActiveDeliveryForUser', () => {
    it('should get active delivery for user', async () => {
      const activeDelivery = { ...mockDelivery, status: DeliveryRequestStatus.PICKED_UP };
      mockPrisma.deliveryRequest.findFirst.mockResolvedValue(activeDelivery);

      const result = await deliveryRepository.getActiveDeliveryForUser(1);

      expect(mockPrisma.deliveryRequest.findFirst).toHaveBeenCalledWith({
        where: {
          userId: 1,
          status: {
            in: [
              DeliveryRequestStatus.PENDING,
              DeliveryRequestStatus.ASSIGNED,
              DeliveryRequestStatus.DRIVER_ARRIVED,
              DeliveryRequestStatus.PICKED_UP,
            ],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(activeDelivery);
    });

    it('should return null when no active delivery found', async () => {
      mockPrisma.deliveryRequest.findFirst.mockResolvedValue(null);

      const result = await deliveryRepository.getActiveDeliveryForUser(1);

      expect(result).toBeNull();
    });
  });

  describe('getActiveDeliveryForDriver', () => {
    it('should get active delivery for driver', async () => {
      const activeDelivery = { ...mockDelivery, status: DeliveryRequestStatus.ASSIGNED };
      mockPrisma.deliveryRequest.findFirst.mockResolvedValue(activeDelivery);

      const result = await deliveryRepository.getActiveDeliveryForDriver(1);

      expect(mockPrisma.deliveryRequest.findFirst).toHaveBeenCalledWith({
        where: {
          driverId: 1,
          status: {
            in: [
              DeliveryRequestStatus.ASSIGNED,
              DeliveryRequestStatus.DRIVER_ARRIVED,
              DeliveryRequestStatus.PICKED_UP,
            ],
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(activeDelivery);
    });

    it('should return null when no active delivery found', async () => {
      mockPrisma.deliveryRequest.findFirst.mockResolvedValue(null);

      const result = await deliveryRepository.getActiveDeliveryForDriver(1);

      expect(result).toBeNull();
    });
  });

  describe('findNearbyDeliveries', () => {
    it('should find nearby deliveries within radius', async () => {
      const nearbyDeliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(nearbyDeliveries);

      const result = await deliveryRepository.findNearbyDeliveries(40.7128, -74.0060, 5);

      expect(mockPrisma.deliveryRequest.findMany).toHaveBeenCalledWith({
        where: {
          status: DeliveryRequestStatus.PENDING,
          senderLocation: {
            latitude: {
              gte: expect.any(Number),
              lte: expect.any(Number),
            },
            longitude: {
              gte: expect.any(Number),
              lte: expect.any(Number),
            },
          },
        },
        include: {
          user: {
            include: {
              wallet: true,
            },
          },
          senderLocation: true,
          receiverLocation: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      expect(result).toEqual(nearbyDeliveries);
    });

    it('should use default radius when not provided', async () => {
      const nearbyDeliveries = [mockDelivery];
      mockPrisma.deliveryRequest.findMany.mockResolvedValue(nearbyDeliveries);

      await deliveryRepository.findNearbyDeliveries(40.7128, -74.0060);

      expect(mockPrisma.deliveryRequest.findMany).toHaveBeenCalled();
    });

    it('should handle database errors', async () => {
      mockPrisma.deliveryRequest.findMany.mockRejectedValue(new Error('Database error'));

      await expect(deliveryRepository.findNearbyDeliveries(40.7128, -74.0060)).rejects.toThrow('Database error');
    });
  });
});