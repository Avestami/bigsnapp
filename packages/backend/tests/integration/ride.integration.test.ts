import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, cleanupTestDatabase } from '../utils/test-database';
import { createTestUser, createTestDriver, getAuthToken } from '../utils/test-helpers';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Ride Integration Tests', () => {
  let riderToken: string;
  let driverToken: string;
  let adminToken: string;
  let riderId: number;
  let driverId: number;
  let adminId: number;
  let vehicleId: number;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create test users
    const rider = await createTestUser({
      firstName: 'John',
      lastName: 'Rider',
      email: 'rider@example.com',
      phoneNumber: '+1234567890',
      userType: 'RIDER'
    });
    riderId = rider.id;
    riderToken = await getAuthToken(rider.id);

    const driver = await createTestDriver({
      firstName: 'Jane',
      lastName: 'Driver',
      email: 'driver@example.com',
      phoneNumber: '+1234567891',
      userType: 'DRIVER'
    });
    driverId = driver.id;
    driverToken = await getAuthToken(driver.id);

    const admin = await createTestUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phoneNumber: '+1234567892',
      userType: 'ADMIN'
    });
    adminId = admin.id;
    adminToken = await getAuthToken(admin.id);

    // Create test vehicle
    const vehicle = await prisma.vehicle.create({
      data: {
        driverId: driverId,
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        color: 'Blue',
        licensePlate: 'ABC123',
        vehicleType: 'SEDAN',
        isActive: true
      }
    });
    vehicleId = vehicle.id;

    // Create wallet for rider
    await prisma.wallet.create({
      data: {
        userId: riderId,
        balance: 100.00
      }
    });

    // Create wallet for driver
    await prisma.wallet.create({
      data: {
        userId: driverId,
        balance: 0.00
      }
    });
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up rides before each test
    await prisma.ride.deleteMany();
    
    // Reset driver status
    await prisma.driver.update({
      where: { id: driverId },
      data: { status: 'AVAILABLE' }
    });
  });

  describe('POST /api/rides', () => {
    const validRideData = {
      pickupLatitude: 40.7128,
      pickupLongitude: -74.0060,
      pickupAddress: '123 Main St, New York, NY',
      destinationLatitude: 40.7589,
      destinationLongitude: -73.9851,
      destinationAddress: '456 Broadway, New York, NY',
      vehicleType: 'SEDAN',
      estimatedDistance: 5.2,
      estimatedDuration: 15,
      notes: 'Please call when you arrive'
    };

    it('should create a new ride request successfully', async () => {
      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send(validRideData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Ride created successfully',
        data: {
          ride: {
            userId: riderId,
            pickupAddress: validRideData.pickupAddress,
            destinationAddress: validRideData.destinationAddress,
            vehicleType: validRideData.vehicleType,
            status: 'PENDING',
            estimatedFare: expect.any(Number)
          }
        }
      });

      // Verify ride was created in database
      const ride = await prisma.ride.findFirst({
        where: { userId: riderId }
      });
      expect(ride).toBeTruthy();
      expect(ride?.status).toBe('PENDING');
    });

    it('should not allow driver to create ride', async () => {
      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(validRideData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLatitude: 40.7128
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate coordinate ranges', async () => {
      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          ...validRideData,
          pickupLatitude: 200 // Invalid latitude
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/rides')
        .send(validRideData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/rides', () => {
    let rideId: number;

    beforeEach(async () => {
      const ride = await prisma.ride.create({
        data: {
          userId: riderId,
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          pickupAddress: '123 Main St, New York, NY',
          destinationLatitude: 40.7589,
          destinationLongitude: -73.9851,
          destinationAddress: '456 Broadway, New York, NY',
          vehicleType: 'SEDAN',
          status: 'PENDING',
          estimatedFare: 25.50
        }
      });
      rideId = ride.id;
    });

    it('should get rides for rider', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          rides: expect.arrayContaining([
            expect.objectContaining({
              id: rideId,
              userId: riderId,
              status: 'PENDING'
            })
          ]),
          pagination: expect.any(Object)
        }
      });
    });

    it('should get rides for admin with all rides', async () => {
      const response = await request(app)
        .get('/api/rides')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rides).toHaveLength(1);
    });

    it('should filter rides by status', async () => {
      const response = await request(app)
        .get('/api/rides?status=PENDING')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rides.every((ride: any) => ride.status === 'PENDING')).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/rides?page=1&limit=5')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number)
      });
    });
  });

  describe('GET /api/rides/available', () => {
    beforeEach(async () => {
      await prisma.ride.create({
        data: {
          userId: riderId,
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          pickupAddress: '123 Main St, New York, NY',
          destinationLatitude: 40.7589,
          destinationLongitude: -73.9851,
          destinationAddress: '456 Broadway, New York, NY',
          vehicleType: 'SEDAN',
          status: 'PENDING',
          estimatedFare: 25.50
        }
      });
    });

    it('should get available rides for driver', async () => {
      const response = await request(app)
        .get('/api/rides/available')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          rides: expect.arrayContaining([
            expect.objectContaining({
              status: 'PENDING',
              vehicleType: 'SEDAN'
            })
          ])
        }
      });
    });

    it('should not allow rider to access available rides', async () => {
      const response = await request(app)
        .get('/api/rides/available')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter by vehicle type', async () => {
      const response = await request(app)
        .get('/api/rides/available?vehicleType=SEDAN')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rides.every((ride: any) => ride.vehicleType === 'SEDAN')).toBe(true);
    });
  });

  describe('Complete Ride Flow', () => {
    let rideId: number;

    beforeEach(async () => {
      const ride = await prisma.ride.create({
        data: {
          userId: riderId,
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          pickupAddress: '123 Main St, New York, NY',
          destinationLatitude: 40.7589,
          destinationLongitude: -73.9851,
          destinationAddress: '456 Broadway, New York, NY',
          vehicleType: 'SEDAN',
          status: 'PENDING',
          estimatedFare: 25.50
        }
      });
      rideId = ride.id;
    });

    it('should complete full ride flow: accept -> arrive -> start -> complete', async () => {
      // 1. Driver accepts ride
      const acceptResponse = await request(app)
        .put(`/api/rides/${rideId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(acceptResponse.body).toMatchObject({
        success: true,
        message: 'Ride accepted successfully'
      });

      // Verify ride status updated
      let ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.status).toBe('ACCEPTED');
      expect(ride?.driverId).toBe(driverId);

      // 2. Driver arrives at pickup
      const arriveResponse = await request(app)
        .put(`/api/rides/${rideId}/arrive`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(arriveResponse.body.success).toBe(true);
      
      ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.status).toBe('DRIVER_ARRIVED');

      // 3. Driver starts ride
      const startResponse = await request(app)
        .put(`/api/rides/${rideId}/start`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(startResponse.body.success).toBe(true);
      
      ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.status).toBe('IN_PROGRESS');

      // 4. Driver completes ride
      const completeResponse = await request(app)
        .put(`/api/rides/${rideId}/complete`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          actualFare: 28.00,
          actualDistance: 5.5,
          actualDuration: 18
        })
        .expect(200);

      expect(completeResponse.body.success).toBe(true);
      
      ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.status).toBe('COMPLETED');
      expect(ride?.actualFare).toBe(28.00);

      // Verify payment processed
      const riderWallet = await prisma.wallet.findUnique({ where: { userId: riderId } });
      const driverWallet = await prisma.wallet.findUnique({ where: { userId: driverId } });
      
      expect(riderWallet?.balance).toBeLessThan(100.00); // Money deducted
      expect(driverWallet?.balance).toBeGreaterThan(0); // Money added
    });

    it('should allow ride cancellation by rider', async () => {
      const response = await request(app)
        .put(`/api/rides/${rideId}/cancel`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.status).toBe('CANCELLED');
    });

    it('should allow ride cancellation by driver after acceptance', async () => {
      // First accept the ride
      await request(app)
        .put(`/api/rides/${rideId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      // Then cancel it
      const response = await request(app)
        .put(`/api/rides/${rideId}/cancel`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ reason: 'Emergency' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.status).toBe('CANCELLED');
      
      // Driver should be available again
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      expect(driver?.status).toBe('AVAILABLE');
    });

    it('should update ride location during trip', async () => {
      // Accept and start ride first
      await request(app)
        .put(`/api/rides/${rideId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      await request(app)
        .put(`/api/rides/${rideId}/arrive`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      await request(app)
        .put(`/api/rides/${rideId}/start`)
        .set('Authorization', `Bearer ${driverToken}`);

      // Update location
      const response = await request(app)
        .put(`/api/rides/${rideId}/location`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          latitude: 40.7300,
          longitude: -74.0000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.currentLatitude).toBe(40.7300);
      expect(ride?.currentLongitude).toBe(-74.0000);
    });
  });

  describe('GET /api/rides/statistics', () => {
    beforeEach(async () => {
      // Create some test rides for statistics
      await prisma.ride.createMany({
        data: [
          {
            userId: riderId,
            pickupLatitude: 40.7128,
            pickupLongitude: -74.0060,
            pickupAddress: '123 Main St',
            destinationLatitude: 40.7589,
            destinationLongitude: -73.9851,
            destinationAddress: '456 Broadway',
            vehicleType: 'SEDAN',
            status: 'COMPLETED',
            estimatedFare: 25.50,
            actualFare: 28.00
          },
          {
            userId: riderId,
            pickupLatitude: 40.7128,
            pickupLongitude: -74.0060,
            pickupAddress: '789 Oak St',
            destinationLatitude: 40.7589,
            destinationLongitude: -73.9851,
            destinationAddress: '321 Pine St',
            vehicleType: 'SUV',
            status: 'CANCELLED',
            estimatedFare: 35.00
          }
        ]
      });
    });

    it('should get ride statistics for admin', async () => {
      const response = await request(app)
        .get('/api/rides/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalRides: expect.any(Number),
          completedRides: expect.any(Number),
          cancelledRides: expect.any(Number),
          pendingRides: expect.any(Number),
          totalRevenue: expect.any(Number),
          averageFare: expect.any(Number),
          completionRate: expect.any(Number),
          cancellationRate: expect.any(Number)
        }
      });
    });

    it('should not allow non-admin to access statistics', async () => {
      const response = await request(app)
        .get('/api/rides/statistics')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/rides/statistics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Admin Actions', () => {
    let rideId: number;

    beforeEach(async () => {
      const ride = await prisma.ride.create({
        data: {
          userId: riderId,
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          pickupAddress: '123 Main St, New York, NY',
          destinationLatitude: 40.7589,
          destinationLongitude: -73.9851,
          destinationAddress: '456 Broadway, New York, NY',
          vehicleType: 'SEDAN',
          status: 'PENDING',
          estimatedFare: 25.50
        }
      });
      rideId = ride.id;
    });

    it('should allow admin to assign driver to ride', async () => {
      const response = await request(app)
        .put(`/api/rides/${rideId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ driverId: driverId })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const ride = await prisma.ride.findUnique({ where: { id: rideId } });
      expect(ride?.driverId).toBe(driverId);
      expect(ride?.status).toBe('ACCEPTED');
    });

    it('should not allow non-admin to assign driver', async () => {
      const response = await request(app)
        .put(`/api/rides/${rideId}/assign`)
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ driverId: driverId })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent ride ID', async () => {
      const response = await request(app)
        .get('/api/rides/99999')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found')
      });
    });

    it('should handle invalid ride ID format', async () => {
      const response = await request(app)
        .get('/api/rides/invalid-id')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle insufficient wallet balance', async () => {
      // Set rider wallet balance to 0
      await prisma.wallet.update({
        where: { userId: riderId },
        data: { balance: 0 }
      });

      const response = await request(app)
        .post('/api/rides')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          pickupAddress: '123 Main St, New York, NY',
          destinationLatitude: 40.7589,
          destinationLongitude: -73.9851,
          destinationAddress: '456 Broadway, New York, NY',
          vehicleType: 'SEDAN',
          estimatedDistance: 5.2,
          estimatedDuration: 15
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('insufficient')
      });
    });
  });
});