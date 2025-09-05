import { DriverRepository } from '../../../src/db/repositories/driver.repository';
import { prisma } from '../../../src/db';
import { mockDriver, mockUser, mockVehicle } from '../../fixtures';

// Mock Prisma
jest.mock('../../../src/db', () => ({
  prisma: {
    driver: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('DriverRepository', () => {
  let driverRepository: DriverRepository;

  beforeEach(() => {
    driverRepository = new DriverRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find driver by id with relations', async () => {
      const driverWithRelations = {
        ...mockDriver,
        user: { ...mockUser, wallet: { id: 1, balance: BigInt(1000) } },
        vehicles: [{ ...mockVehicle, model: { name: 'Toyota' }, vehicleType: { name: 'Sedan' } }],
      };

      mockPrisma.driver.findUnique.mockResolvedValue(driverWithRelations);

      const result = await driverRepository.findById(1);

      expect(mockPrisma.driver.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
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
      });
      expect(result).toEqual(driverWithRelations);
    });

    it('should return null when driver not found', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue(null);

      const result = await driverRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      mockPrisma.driver.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(driverRepository.findById(1)).rejects.toThrow('Database error');
    });
  });

  describe('findByUserId', () => {
    it('should find driver by user id', async () => {
      const driverWithRelations = {
        ...mockDriver,
        user: { ...mockUser, wallet: { id: 1, balance: BigInt(1000) } },
        vehicles: [mockVehicle],
      };

      mockPrisma.driver.findUnique.mockResolvedValue(driverWithRelations);

      const result = await driverRepository.findByUserId(1);

      expect(mockPrisma.driver.findUnique).toHaveBeenCalledWith({
        where: { userId: 1 },
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
      });
      expect(result).toEqual(driverWithRelations);
    });

    it('should return null when driver not found', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue(null);

      const result = await driverRepository.findByUserId(999);

      expect(result).toBeNull();
    });
  });

  describe('findByLicenseNumber', () => {
    it('should find driver by license number', async () => {
      const driverWithRelations = {
        ...mockDriver,
        user: { ...mockUser, wallet: { id: 1, balance: BigInt(1000) } },
        vehicles: [mockVehicle],
      };

      mockPrisma.driver.findUnique.mockResolvedValue(driverWithRelations);

      const result = await driverRepository.findByLicenseNumber('DL123456');

      expect(mockPrisma.driver.findUnique).toHaveBeenCalledWith({
        where: { licenseNumber: 'DL123456' },
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
      });
      expect(result).toEqual(driverWithRelations);
    });

    it('should return null when driver not found', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue(null);

      const result = await driverRepository.findByLicenseNumber('INVALID');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('should find drivers with default options', async () => {
      const drivers = [mockDriver];
      mockPrisma.driver.findMany.mockResolvedValue(drivers);

      const result = await driverRepository.findMany();

      expect(mockPrisma.driver.findMany).toHaveBeenCalledWith({
        where: {},
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
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(drivers);
    });

    it('should find drivers with verification filter', async () => {
      const drivers = [mockDriver];
      mockPrisma.driver.findMany.mockResolvedValue(drivers);

      await driverRepository.findMany({ isVerified: true });

      expect(mockPrisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isVerified: true },
        })
      );
    });

    it('should find drivers with pagination', async () => {
      const drivers = [mockDriver];
      mockPrisma.driver.findMany.mockResolvedValue(drivers);

      await driverRepository.findMany({ page: 2, limit: 5 });

      expect(mockPrisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );
    });
  });

  describe('findManyPaginated', () => {
    it('should return paginated results', async () => {
      const drivers = [mockDriver];
      mockPrisma.driver.findMany.mockResolvedValue(drivers);
      mockPrisma.driver.count.mockResolvedValue(10);

      const result = await driverRepository.findManyPaginated({ page: 1, limit: 5 });

      expect(result).toEqual({
        data: drivers,
        total: 10,
        page: 1,
        limit: 5,
        totalPages: 2,
      });
    });
  });

  describe('create', () => {
    it('should create driver', async () => {
      const createData = {
        userId: 1,
        licenseNumber: 'DL123456',
        isVerified: false,
      };

      const createdDriver = { ...mockDriver, ...createData };
      mockPrisma.driver.create.mockResolvedValue(createdDriver);

      const result = await driverRepository.create(createData);

      expect(mockPrisma.driver.create).toHaveBeenCalledWith({
        data: createData,
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
      });
      expect(result).toEqual(createdDriver);
    });

    it('should handle creation errors', async () => {
      const createData = {
        userId: 1,
        licenseNumber: 'DL123456',
      };

      mockPrisma.driver.create.mockRejectedValue(new Error('Creation failed'));

      await expect(driverRepository.create(createData)).rejects.toThrow('Creation failed');
    });
  });

  describe('update', () => {
    it('should update driver', async () => {
      const updateData = {
        licenseNumber: 'DL654321',
        isVerified: true,
      };

      const updatedDriver = { ...mockDriver, ...updateData };
      mockPrisma.driver.update.mockResolvedValue(updatedDriver);

      const result = await driverRepository.update(1, updateData);

      expect(mockPrisma.driver.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: updateData,
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
      });
      expect(result).toEqual(updatedDriver);
    });

    it('should handle update errors', async () => {
      mockPrisma.driver.update.mockRejectedValue(new Error('Update failed'));

      await expect(driverRepository.update(1, { isVerified: true })).rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete driver', async () => {
      mockPrisma.driver.delete.mockResolvedValue(mockDriver);

      await driverRepository.delete(1);

      expect(mockPrisma.driver.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle deletion errors', async () => {
      mockPrisma.driver.delete.mockRejectedValue(new Error('Deletion failed'));

      await expect(driverRepository.delete(1)).rejects.toThrow('Deletion failed');
    });
  });

  describe('count', () => {
    it('should count all drivers', async () => {
      mockPrisma.driver.count.mockResolvedValue(5);

      const result = await driverRepository.count();

      expect(mockPrisma.driver.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toBe(5);
    });

    it('should count drivers with verification filter', async () => {
      mockPrisma.driver.count.mockResolvedValue(3);

      const result = await driverRepository.count({ isVerified: true });

      expect(mockPrisma.driver.count).toHaveBeenCalledWith({
        where: { isVerified: true },
      });
      expect(result).toBe(3);
    });
  });

  describe('findVerifiedDrivers', () => {
    it('should find verified drivers', async () => {
      const drivers = [mockDriver];
      mockPrisma.driver.findMany.mockResolvedValue(drivers);

      const result = await driverRepository.findVerifiedDrivers();

      expect(result).toEqual(drivers);
    });
  });

  describe('findUnverifiedDrivers', () => {
    it('should find unverified drivers', async () => {
      const drivers = [mockDriver];
      mockPrisma.driver.findMany.mockResolvedValue(drivers);

      const result = await driverRepository.findUnverifiedDrivers();

      expect(result).toEqual(drivers);
    });
  });

  describe('verifyDriver', () => {
    it('should verify driver', async () => {
      const verifiedDriver = { ...mockDriver, isVerified: true };
      mockPrisma.driver.update.mockResolvedValue(verifiedDriver);

      const result = await driverRepository.verifyDriver(1);

      expect(result.isVerified).toBe(true);
    });
  });

  describe('unverifyDriver', () => {
    it('should unverify driver', async () => {
      const unverifiedDriver = { ...mockDriver, isVerified: false };
      mockPrisma.driver.update.mockResolvedValue(unverifiedDriver);

      const result = await driverRepository.unverifyDriver(1);

      expect(result.isVerified).toBe(false);
    });
  });

  describe('existsByLicenseNumber', () => {
    it('should return true when driver exists', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue({ id: 1 } as any);

      const result = await driverRepository.existsByLicenseNumber('DL123456');

      expect(mockPrisma.driver.findUnique).toHaveBeenCalledWith({
        where: { licenseNumber: 'DL123456' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when driver does not exist', async () => {
      mockPrisma.driver.findUnique.mockResolvedValue(null);

      const result = await driverRepository.existsByLicenseNumber('INVALID');

      expect(result).toBe(false);
    });
  });

  describe('findAvailableDrivers', () => {
    it('should find available drivers without vehicle type filter', async () => {
      const availableDrivers = [{
        ...mockDriver,
        isVerified: true,
        user: { ...mockUser, wallet: { id: 1, balance: BigInt(1000) } },
        vehicles: [mockVehicle],
      }];

      mockPrisma.driver.findMany.mockResolvedValue(availableDrivers);

      const result = await driverRepository.findAvailableDrivers();

      expect(mockPrisma.driver.findMany).toHaveBeenCalledWith({
        where: {
          isVerified: true,
          vehicles: {
            some: {},
          },
          rides: {
            none: {
              status: {
                in: ['ASSIGNED', 'DRIVER_ARRIVED', 'IN_PROGRESS'],
              },
            },
          },
          deliveryAssignments: {
            none: {
              delivery: {
                status: {
                  in: ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'],
                },
              },
            },
          },
        },
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
      });
      expect(result).toEqual(availableDrivers);
    });

    it('should find available drivers with vehicle type filter', async () => {
      const availableDrivers = [mockDriver];
      mockPrisma.driver.findMany.mockResolvedValue(availableDrivers);

      const result = await driverRepository.findAvailableDrivers(1);

      expect(mockPrisma.driver.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vehicles: {
              some: {
                vehicleTypeId: 1,
              },
            },
          }),
        })
      );
      expect(result).toEqual(availableDrivers);
    });

    it('should handle database errors', async () => {
      mockPrisma.driver.findMany.mockRejectedValue(new Error('Database error'));

      await expect(driverRepository.findAvailableDrivers()).rejects.toThrow('Database error');
    });
  });
});