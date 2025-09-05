import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

// Global test database instance
export let testDb: PrismaClient;

// Test database URL
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || 
  `postgresql://postgres:password@localhost:5432/snappclone_test_${randomBytes(8).toString('hex')}`;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test database
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  
  // Initialize Prisma client
  testDb = new PrismaClient({
    datasources: {
      db: {
        url: TEST_DATABASE_URL,
      },
    },
  });

  // Connect to database
  await testDb.$connect();
});

// Clean up after all tests
afterAll(async () => {
  if (testDb) {
    await testDb.$disconnect();
  }
});

// Clean database before each test
beforeEach(async () => {
  if (testDb) {
    // Clean all tables in reverse order to handle foreign key constraints
    const tableNames = [
      'RideReview',
      'DeliveryReview', 
      'AdminLog',
      'WalletTransaction',
      'Payment',
      'RideStatusHistory',
      'Ride',
      'Delivery',
      'Vehicle',
      'Driver',
      'User',
      'VehicleModel',
      'Location'
    ];

    for (const tableName of tableNames) {
      try {
        await testDb.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
      } catch (error) {
        // Table might not exist, continue
      }
    }
  }
});

// Export test utilities
export const testUtils = {
  // Generate test user data
  createTestUser: (overrides = {}) => ({
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    userType: 'USER' as const,
    ...overrides,
  }),

  // Generate test driver data
  createTestDriver: (overrides = {}) => ({
    email: `driver${Date.now()}@example.com`,
    password: 'password123',
    firstName: 'Test',
    lastName: 'Driver',
    phoneNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
    userType: 'DRIVER' as const,
    licenseNumber: `DL${Date.now()}`,
    licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    isVerified: true,
    isAvailable: true,
    ...overrides,
  }),

  // Generate test ride data
  createTestRide: (userId: number, overrides = {}) => ({
    userId,
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    pickupAddress: '123 Test St, San Francisco, CA',
    destinationLatitude: 37.7849,
    destinationLongitude: -122.4094,
    destinationAddress: '456 Test Ave, San Francisco, CA',
    vehicleType: 'SEDAN' as const,
    estimatedDistance: 5.2,
    estimatedDuration: 15,
    estimatedFare: 12.50,
    status: 'PENDING' as const,
    ...overrides,
  }),

  // Generate test delivery data
  createTestDelivery: (userId: number, overrides = {}) => ({
    userId,
    pickupLatitude: 37.7749,
    pickupLongitude: -122.4194,
    pickupAddress: '123 Pickup St, San Francisco, CA',
    deliveryLatitude: 37.7849,
    deliveryLongitude: -122.4094,
    deliveryAddress: '456 Delivery Ave, San Francisco, CA',
    packageDescription: 'Test package',
    packageWeight: 2.5,
    estimatedDistance: 3.8,
    estimatedFare: 8.75,
    status: 'PENDING' as const,
    ...overrides,
  }),

  // Wait for async operations
  wait: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  // Clean specific table
  cleanTable: async (tableName: string) => {
    if (testDb) {
      await testDb.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
    }
  },
};