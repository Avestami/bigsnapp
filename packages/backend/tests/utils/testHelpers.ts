import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient, User, UserType } from '@prisma/client';
import { testDb } from '../setup';
import { userFixtures } from '../fixtures';

// Authentication helpers
export const authHelpers = {
  // Generate JWT token for testing
  generateToken: (userId: number, userType: UserType = UserType.USER) => {
    return jwt.sign(
      { userId, userType },
      process.env.JWT_SECRET || 'test-jwt-secret-key',
      { expiresIn: '1h' }
    );
  },

  // Generate refresh token
  generateRefreshToken: (userId: number) => {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-key',
      { expiresIn: '7d' }
    );
  },

  // Hash password for testing
  hashPassword: async (password: string) => {
    return await bcrypt.hash(password, 10);
  },

  // Create authenticated user in database
  createAuthenticatedUser: async (userData = userFixtures.regularUser) => {
    const hashedPassword = await authHelpers.hashPassword(userData.password);
    const user = await testDb.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });
    
    const token = authHelpers.generateToken(user.id, user.userType);
    return { user, token };
  },

  // Create authenticated driver
  createAuthenticatedDriver: async (driverData = userFixtures.driver) => {
    const hashedPassword = await authHelpers.hashPassword(driverData.password);
    const driver = await testDb.user.create({
      data: {
        ...driverData,
        password: hashedPassword,
      },
    });
    
    const token = authHelpers.generateToken(driver.id, driver.userType);
    return { driver, token };
  },

  // Create authenticated admin
  createAuthenticatedAdmin: async (adminData = userFixtures.admin) => {
    const hashedPassword = await authHelpers.hashPassword(adminData.password);
    const admin = await testDb.user.create({
      data: {
        ...adminData,
        password: hashedPassword,
      },
    });
    
    const token = authHelpers.generateToken(admin.id, admin.userType);
    return { admin, token };
  },
};

// Database helpers
export const dbHelpers = {
  // Create user with wallet
  createUserWithWallet: async (userData = userFixtures.regularUser, walletBalance = 100.0) => {
    const hashedPassword = await authHelpers.hashPassword(userData.password);
    const user = await testDb.user.create({
      data: {
        ...userData,
        password: hashedPassword,
        wallet: {
          create: {
            balance: walletBalance,
            currency: 'IRR',
          },
        },
      },
      include: {
        wallet: true,
      },
    });
    return user;
  },

  // Create driver with vehicle
  createDriverWithVehicle: async (driverData = userFixtures.driver, vehicleData = {}) => {
    const hashedPassword = await authHelpers.hashPassword(driverData.password);
    const driver = await testDb.user.create({
      data: {
        ...driverData,
        password: hashedPassword,
        vehicles: {
          create: {
            make: 'Toyota',
            model: 'Camry',
            year: 2022,
            color: 'Black',
            licensePlate: 'TEST123',
            vehicleType: 'SEDAN',
            isVerified: true,
            ...vehicleData,
          },
        },
      },
      include: {
        vehicles: true,
      },
    });
    return driver;
  },

  // Create complete ride with user and driver
  createCompleteRide: async (rideData = {}) => {
    const { user } = await authHelpers.createAuthenticatedUser();
    const { driver } = await authHelpers.createAuthenticatedDriver();
    
    const ride = await testDb.ride.create({
      data: {
        userId: user.id,
        driverId: driver.id,
        pickupLatitude: 37.7749,
        pickupLongitude: -122.4194,
        pickupAddress: '123 Test St, San Francisco, CA',
        destinationLatitude: 37.7849,
        destinationLongitude: -122.4094,
        destinationAddress: '456 Test Ave, San Francisco, CA',
        vehicleType: 'SEDAN',
        estimatedDistance: 5.2,
        estimatedDuration: 15,
        estimatedFare: 12.50,
        status: 'PENDING',
        ...rideData,
      },
      include: {
        user: true,
        driver: true,
      },
    });
    
    return { ride, user, driver };
  },

  // Create complete delivery with user and driver
  createCompleteDelivery: async (deliveryData = {}) => {
    const { user } = await authHelpers.createAuthenticatedUser();
    const { driver } = await authHelpers.createAuthenticatedDriver();
    
    const delivery = await testDb.delivery.create({
      data: {
        userId: user.id,
        driverId: driver.id,
        pickupLatitude: 37.7749,
        pickupLongitude: -122.4194,
        pickupAddress: '123 Restaurant St, San Francisco, CA',
        deliveryLatitude: 37.7849,
        deliveryLongitude: -122.4094,
        deliveryAddress: '789 Customer Ave, San Francisco, CA',
        packageDescription: 'Test package',
        packageWeight: 2.5,
        estimatedDistance: 3.8,
        estimatedFare: 8.75,
        status: 'PENDING',
        ...deliveryData,
      },
      include: {
        user: true,
        driver: true,
      },
    });
    
    return { delivery, user, driver };
  },
};

// Mock helpers
export const mockHelpers = {
  // Mock socket.io
  createMockSocket: (overrides = {}) => ({
    id: 'mock-socket-id',
    userId: 1,
    driverId: null,
    emit: jest.fn(),
    broadcast: {
      emit: jest.fn(),
    },
    to: jest.fn().mockReturnThis(),
    join: jest.fn(),
    leave: jest.fn(),
    disconnect: jest.fn(),
    ...overrides,
  }),

  // Mock Express request
  createMockRequest: (overrides = {}) => ({
    body: {},
    params: {},
    query: {},
    headers: {},
    user: null,
    ...overrides,
  }),

  // Mock Express response
  createMockResponse: () => {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res;
  },

  // Mock next function
  createMockNext: () => jest.fn(),

  // Mock Redis client
  createMockRedis: () => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    expire: jest.fn(),
    hget: jest.fn(),
    hset: jest.fn(),
    hdel: jest.fn(),
    publish: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  }),
};

// Assertion helpers
export const assertionHelpers = {
  // Assert user structure
  assertUserStructure: (user: any) => {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('firstName');
    expect(user).toHaveProperty('lastName');
    expect(user).toHaveProperty('userType');
    expect(user).not.toHaveProperty('password'); // Should not expose password
  },

  // Assert ride structure
  assertRideStructure: (ride: any) => {
    expect(ride).toHaveProperty('id');
    expect(ride).toHaveProperty('userId');
    expect(ride).toHaveProperty('status');
    expect(ride).toHaveProperty('pickupAddress');
    expect(ride).toHaveProperty('destinationAddress');
    expect(ride).toHaveProperty('estimatedFare');
  },

  // Assert delivery structure
  assertDeliveryStructure: (delivery: any) => {
    expect(delivery).toHaveProperty('id');
    expect(delivery).toHaveProperty('userId');
    expect(delivery).toHaveProperty('status');
    expect(delivery).toHaveProperty('pickupAddress');
    expect(delivery).toHaveProperty('deliveryAddress');
    expect(delivery).toHaveProperty('packageDescription');
  },

  // Assert error response structure
  assertErrorResponse: (response: any, expectedStatus: number, expectedMessage?: string) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('error');
    if (expectedMessage) {
      expect(response.body.error).toContain(expectedMessage);
    }
  },
};

// Time helpers
export const timeHelpers = {
  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Get future date
  getFutureDate: (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  
  // Get past date
  getPastDate: (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000),
};