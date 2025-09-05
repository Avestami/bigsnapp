import { UserRepository, CreateUserInput, UpdateUserInput } from '../../../src/db/repositories/user.repository';
import { UserType } from '@prisma/client';
import { userFixtures } from '../../fixtures';
import { mockHelpers } from '../../utils/testHelpers';

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  wallet: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

// Mock the prisma import
jest.mock('../../../src/db/index', () => ({
  prisma: mockPrisma,
}));

describe('UserRepository', () => {
  let userRepository: UserRepository;
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    phoneNumber: '+1234567890',
    userType: UserType.USER,
    passwordHash: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    walletId: 1,
    wallet: { id: 1, balanceRial: 0, userId: 1 },
    driver: null,
  };

  beforeEach(() => {
    userRepository = new UserRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should find user by id with relations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findById(1);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          wallet: true,
          driver: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findById(999);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      mockPrisma.user.findUnique.mockRejectedValue(dbError);

      await expect(userRepository.findById(1)).rejects.toThrow('Database connection failed');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with relations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: {
          wallet: true,
          driver: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle invalid email format', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByEmail('invalid-email');

      expect(result).toBeNull();
    });
  });

  describe('findByPhoneNumber', () => {
    it('should find user by phone number with relations', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await userRepository.findByPhoneNumber('+1234567890');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { phoneNumber: '+1234567890' },
        include: {
          wallet: true,
          driver: true,
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.findByPhoneNumber('+9999999999');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    const mockUsers = [mockUser, { ...mockUser, id: 2, email: 'test2@example.com' }];

    it('should find users with default pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await userRepository.findMany();

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          driver: true,
        },
      });
      expect(result).toEqual(mockUsers);
    });

    it('should find users with custom pagination', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await userRepository.findMany({ page: 2, limit: 5 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          driver: true,
        },
      });
    });

    it('should filter by user type', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);

      const result = await userRepository.findMany({ userType: UserType.DRIVER });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { userType: UserType.DRIVER },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          driver: true,
        },
      });
    });

    it('should handle custom ordering', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await userRepository.findMany({ orderBy: { name: 'asc' } });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
        orderBy: { name: 'asc' },
        include: {
          wallet: true,
          driver: true,
        },
      });
    });
  });

  describe('findManyPaginated', () => {
    const mockUsers = [mockUser, { ...mockUser, id: 2, email: 'test2@example.com' }];

    it('should return paginated results', async () => {
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);
      mockPrisma.user.count.mockResolvedValue(25);

      const result = await userRepository.findManyPaginated({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: mockUsers,
        total: 25,
        page: 1,
        limit: 10,
        totalPages: 3,
        hasNext: true,
        hasPrev: false,
      });
    });

    it('should handle last page correctly', async () => {
      mockPrisma.user.findMany.mockResolvedValue([mockUser]);
      mockPrisma.user.count.mockResolvedValue(21);

      const result = await userRepository.findManyPaginated({ page: 3, limit: 10 });

      expect(result.hasNext).toBe(false);
      expect(result.hasPrev).toBe(true);
      expect(result.totalPages).toBe(3);
    });
  });

  describe('create', () => {
    const createUserInput: CreateUserInput = {
      name: 'New User',
      email: 'new@example.com',
      phoneNumber: '+1234567890',
      passwordHash: 'hashedpassword',
      userType: UserType.USER,
    };

    it('should create user with wallet in transaction', async () => {
      const mockCreatedUser = { ...mockUser, ...createUserInput };
      const mockWallet = { id: 1, balanceRial: 0, userId: mockUser.id };
      const mockUpdatedUser = { ...mockCreatedUser, wallet: mockWallet };

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue(mockCreatedUser),
            update: jest.fn().mockResolvedValue(mockUpdatedUser),
          },
          wallet: {
            create: jest.fn().mockResolvedValue(mockWallet),
          },
        };
        return callback(mockTx);
      });

      mockPrisma.$transaction.mockImplementation(mockTransaction);

      const result = await userRepository.create(createUserInput);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle transaction rollback on error', async () => {
      const dbError = new Error('Wallet creation failed');
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        const mockTx = {
          user: {
            create: jest.fn().mockResolvedValue(mockUser),
            update: jest.fn(),
          },
          wallet: {
            create: jest.fn().mockRejectedValue(dbError),
          },
        };
        return callback(mockTx);
      });

      mockPrisma.$transaction.mockImplementation(mockTransaction);

      await expect(userRepository.create(createUserInput)).rejects.toThrow('Wallet creation failed');
    });

    it('should handle duplicate email error', async () => {
      const duplicateError = new Error('Unique constraint failed on email');
      mockPrisma.$transaction.mockRejectedValue(duplicateError);

      await expect(userRepository.create(createUserInput)).rejects.toThrow('Unique constraint failed on email');
    });
  });

  describe('update', () => {
    const updateUserInput: UpdateUserInput = {
      name: 'Updated User',
      email: 'updated@example.com',
    };

    it('should update user with relations', async () => {
      const mockUpdatedUser = { ...mockUser, ...updateUserInput, updatedAt: new Date() };
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await userRepository.update(1, updateUserInput);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          ...updateUserInput,
          updatedAt: expect.any(Date),
        },
        include: {
          wallet: true,
          driver: true,
        },
      });
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should handle user not found error', async () => {
      const notFoundError = new Error('Record to update not found');
      mockPrisma.user.update.mockRejectedValue(notFoundError);

      await expect(userRepository.update(999, updateUserInput)).rejects.toThrow('Record to update not found');
    });

    it('should handle partial updates', async () => {
      const partialUpdate = { name: 'Only Name Updated' };
      const mockUpdatedUser = { ...mockUser, ...partialUpdate, updatedAt: new Date() };
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await userRepository.update(1, partialUpdate);

      expect(result.name).toBe('Only Name Updated');
      expect(result.email).toBe(mockUser.email); // Should remain unchanged
    });
  });

  describe('delete', () => {
    it('should delete user successfully', async () => {
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      await userRepository.delete(1);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should handle user not found error', async () => {
      const notFoundError = new Error('Record to delete does not exist');
      mockPrisma.user.delete.mockRejectedValue(notFoundError);

      await expect(userRepository.delete(999)).rejects.toThrow('Record to delete does not exist');
    });

    it('should handle foreign key constraint error', async () => {
      const constraintError = new Error('Foreign key constraint failed');
      mockPrisma.user.delete.mockRejectedValue(constraintError);

      await expect(userRepository.delete(1)).rejects.toThrow('Foreign key constraint failed');
    });
  });

  describe('count', () => {
    it('should count all users', async () => {
      mockPrisma.user.count.mockResolvedValue(42);

      const result = await userRepository.count();

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: undefined,
      });
      expect(result).toBe(42);
    });

    it('should count users by type', async () => {
      mockPrisma.user.count.mockResolvedValue(15);

      const result = await userRepository.count({ userType: UserType.DRIVER });

      expect(mockPrisma.user.count).toHaveBeenCalledWith({
        where: { userType: UserType.DRIVER },
      });
      expect(result).toBe(15);
    });
  });

  describe('findDrivers', () => {
    it('should find drivers with pagination', async () => {
      const mockDrivers = [{ ...mockUser, userType: UserType.DRIVER }];
      mockPrisma.user.findMany.mockResolvedValue(mockDrivers);

      const result = await userRepository.findDrivers({ page: 1, limit: 5 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { userType: UserType.DRIVER },
        skip: 0,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          driver: true,
        },
      });
      expect(result).toEqual(mockDrivers);
    });
  });

  describe('findRiders', () => {
    it('should find riders with pagination', async () => {
      const mockRiders = [{ ...mockUser, userType: UserType.RIDER }];
      mockPrisma.user.findMany.mockResolvedValue(mockRiders);

      const result = await userRepository.findRiders({ page: 1, limit: 5 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { userType: UserType.RIDER },
        skip: 0,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          driver: true,
        },
      });
    });
  });

  describe('findAdmins', () => {
    it('should find admins with pagination', async () => {
      const mockAdmins = [{ ...mockUser, userType: UserType.ADMIN }];
      mockPrisma.user.findMany.mockResolvedValue(mockAdmins);

      const result = await userRepository.findAdmins({ page: 1, limit: 5 });

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        where: { userType: UserType.ADMIN },
        skip: 0,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
          driver: true,
        },
      });
    });
  });

  describe('existsByEmail', () => {
    it('should return true when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const result = await userRepository.existsByEmail('test@example.com');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.existsByEmail('nonexistent@example.com');

      expect(result).toBe(false);
    });
  });

  describe('existsByPhoneNumber', () => {
    it('should return true when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1 });

      const result = await userRepository.existsByPhoneNumber('+1234567890');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { phoneNumber: '+1234567890' },
        select: { id: true },
      });
      expect(result).toBe(true);
    });

    it('should return false when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await userRepository.existsByPhoneNumber('+9999999999');

      expect(result).toBe(false);
    });
  });
});