import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, cleanupTestDatabase } from '../utils/test-database';
import { createTestUser, createTestDriver, getAuthToken } from '../utils/test-helpers';

const prisma = new PrismaClient();

describe('Delivery Integration Tests', () => {
  let userToken: string;
  let driverToken: string;
  let adminToken: string;
  let userId: number;
  let driverId: number;
  let adminId: number;

  beforeAll(async () => {
    await setupTestDatabase();

    // Create test users
    const user = await createTestUser({
      firstName: 'John',
      lastName: 'User',
      email: 'user@example.com',
      phoneNumber: '+1234567890',
      userType: 'USER'
    });
    userId = user.id;
    userToken = await getAuthToken(user.id);

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

    // Create wallets
    await prisma.wallet.create({
      data: {
        userId: userId,
        balance: 100.00
      }
    });

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
    // Clean up deliveries before each test
    await prisma.delivery.deleteMany();
    
    // Reset driver status
    await prisma.driver.update({
      where: { id: driverId },
      data: { status: 'AVAILABLE' }
    });
  });

  describe('POST /api/deliveries', () => {
    const validDeliveryData = {
      pickupAddress: '123 Main St, New York, NY 10001',
      deliveryAddress: '456 Broadway, New York, NY 10013',
      pickupLatitude: 40.7128,
      pickupLongitude: -74.0060,
      deliveryLatitude: 40.7589,
      deliveryLongitude: -73.9851,
      recipientName: 'Jane Smith',
      recipientPhone: '+1987654321',
      packageDescription: 'Electronics - Laptop',
      packageWeight: 2.5,
      packageDimensions: '30x20x5 cm',
      deliveryInstructions: 'Leave at front desk',
      scheduledPickupTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      isFragile: true,
      requiresSignature: true
    };

    it('should create a new delivery request successfully', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validDeliveryData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Delivery created successfully',
        data: {
          delivery: {
            userId: userId,
            pickupAddress: validDeliveryData.pickupAddress,
            deliveryAddress: validDeliveryData.deliveryAddress,
            recipientName: validDeliveryData.recipientName,
            status: 'PENDING',
            estimatedFare: expect.any(Number),
            deliveryCode: expect.any(String)
          }
        }
      });

      // Verify delivery was created in database
      const delivery = await prisma.delivery.findFirst({
        where: { userId: userId }
      });
      expect(delivery).toBeTruthy();
      expect(delivery?.status).toBe('PENDING');
      expect(delivery?.deliveryCode).toHaveLength(6);
    });

    it('should not allow driver to create delivery', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${driverToken}`)
        .send(validDeliveryData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          pickupAddress: validDeliveryData.pickupAddress
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate coordinate ranges', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validDeliveryData,
          pickupLatitude: 200 // Invalid latitude
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate package weight', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validDeliveryData,
          packageWeight: -1 // Invalid weight
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .send(validDeliveryData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/deliveries', () => {
    let deliveryId: number;

    beforeEach(async () => {
      const delivery = await prisma.delivery.create({
        data: {
          userId: userId,
          pickupAddress: '123 Main St, New York, NY',
          deliveryAddress: '456 Broadway, New York, NY',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          deliveryLatitude: 40.7589,
          deliveryLongitude: -73.9851,
          recipientName: 'Jane Smith',
          recipientPhone: '+1987654321',
          packageDescription: 'Electronics',
          status: 'PENDING',
          estimatedFare: 15.50,
          deliveryCode: 'ABC123'
        }
      });
      deliveryId = delivery.id;
    });

    it('should get deliveries for user', async () => {
      const response = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          deliveries: expect.arrayContaining([
            expect.objectContaining({
              id: deliveryId,
              userId: userId,
              status: 'PENDING'
            })
          ]),
          pagination: expect.any(Object)
        }
      });
    });

    it('should get deliveries for admin with all deliveries', async () => {
      const response = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveries).toHaveLength(1);
    });

    it('should filter deliveries by status', async () => {
      const response = await request(app)
        .get('/api/deliveries?status=PENDING')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deliveries.every((delivery: any) => delivery.status === 'PENDING')).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/deliveries?page=1&limit=5')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5,
        total: expect.any(Number)
      });
    });

    it('should support sorting', async () => {
      const response = await request(app)
        .get('/api/deliveries?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/deliveries/available/list', () => {
    beforeEach(async () => {
      await prisma.delivery.create({
        data: {
          userId: userId,
          pickupAddress: '123 Main St, New York, NY',
          deliveryAddress: '456 Broadway, New York, NY',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          deliveryLatitude: 40.7589,
          deliveryLongitude: -73.9851,
          recipientName: 'Jane Smith',
          recipientPhone: '+1987654321',
          packageDescription: 'Electronics',
          status: 'PENDING',
          estimatedFare: 15.50,
          deliveryCode: 'ABC123'
        }
      });
    });

    it('should get available deliveries for driver', async () => {
      const response = await request(app)
        .get('/api/deliveries/available/list')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          deliveries: expect.arrayContaining([
            expect.objectContaining({
              status: 'PENDING'
            })
          ])
        }
      });
    });

    it('should not allow user to access available deliveries', async () => {
      const response = await request(app)
        .get('/api/deliveries/available/list')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter by location radius', async () => {
      const response = await request(app)
        .get('/api/deliveries/available/list?latitude=40.7128&longitude=-74.0060&radius=10')
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Complete Delivery Flow', () => {
    let deliveryId: number;
    let deliveryCode: string;

    beforeEach(async () => {
      const delivery = await prisma.delivery.create({
        data: {
          userId: userId,
          pickupAddress: '123 Main St, New York, NY',
          deliveryAddress: '456 Broadway, New York, NY',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          deliveryLatitude: 40.7589,
          deliveryLongitude: -73.9851,
          recipientName: 'Jane Smith',
          recipientPhone: '+1987654321',
          packageDescription: 'Electronics',
          status: 'PENDING',
          estimatedFare: 15.50,
          deliveryCode: 'ABC123'
        }
      });
      deliveryId = delivery.id;
      deliveryCode = delivery.deliveryCode!;
    });

    it('should complete full delivery flow: accept -> pickup -> deliver', async () => {
      // 1. Driver accepts delivery
      const acceptResponse = await request(app)
        .patch(`/api/deliveries/${deliveryId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(acceptResponse.body).toMatchObject({
        success: true,
        message: 'Delivery accepted successfully'
      });

      // Verify delivery status updated
      let delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.status).toBe('DRIVER_ASSIGNED');
      expect(delivery?.driverId).toBe(driverId);

      // 2. Driver marks as picked up
      const pickupResponse = await request(app)
        .patch(`/api/deliveries/${deliveryId}/pickup`)
        .set('Authorization', `Bearer ${driverToken}`)
        .expect(200);

      expect(pickupResponse.body.success).toBe(true);
      
      delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.status).toBe('PICKED_UP');

      // 3. Driver delivers package
      const deliverResponse = await request(app)
        .patch(`/api/deliveries/${deliveryId}/deliver`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ deliveryCode: deliveryCode })
        .expect(200);

      expect(deliverResponse.body.success).toBe(true);
      
      delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.status).toBe('DELIVERED');

      // Verify payment processed
      const userWallet = await prisma.wallet.findUnique({ where: { userId: userId } });
      const driverWallet = await prisma.wallet.findUnique({ where: { userId: driverId } });
      
      expect(userWallet?.balance).toBeLessThan(100.00); // Money deducted
      expect(driverWallet?.balance).toBeGreaterThan(0); // Money added
    });

    it('should allow delivery cancellation by user', async () => {
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'Changed my mind' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.status).toBe('CANCELLED');
    });

    it('should allow delivery cancellation by driver after acceptance', async () => {
      // First accept the delivery
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);

      // Then cancel it
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/cancel`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ reason: 'Vehicle breakdown' })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.status).toBe('CANCELLED');
      
      // Driver should be available again
      const driver = await prisma.driver.findUnique({ where: { id: driverId } });
      expect(driver?.status).toBe('AVAILABLE');
    });

    it('should update delivery location during transit', async () => {
      // Accept and pickup delivery first
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/pickup`)
        .set('Authorization', `Bearer ${driverToken}`);

      // Update location
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/location`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({
          latitude: 40.7300,
          longitude: -74.0000
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.currentLatitude).toBe(40.7300);
      expect(delivery?.currentLongitude).toBe(-74.0000);
      expect(delivery?.status).toBe('IN_TRANSIT'); // Should auto-update to IN_TRANSIT
    });

    it('should require correct delivery code for completion', async () => {
      // Accept and pickup delivery first
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/accept`)
        .set('Authorization', `Bearer ${driverToken}`);
      
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/pickup`)
        .set('Authorization', `Bearer ${driverToken}`);

      // Try to deliver with wrong code
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/deliver`)
        .set('Authorization', `Bearer ${driverToken}`)
        .send({ deliveryCode: 'WRONG123' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid delivery code')
      });
      
      const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.status).toBe('PICKED_UP'); // Status should not change
    });
  });

  describe('GET /api/deliveries/:deliveryId', () => {
    let deliveryId: number;

    beforeEach(async () => {
      const delivery = await prisma.delivery.create({
        data: {
          userId: userId,
          pickupAddress: '123 Main St, New York, NY',
          deliveryAddress: '456 Broadway, New York, NY',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          deliveryLatitude: 40.7589,
          deliveryLongitude: -73.9851,
          recipientName: 'Jane Smith',
          recipientPhone: '+1987654321',
          packageDescription: 'Electronics',
          status: 'PENDING',
          estimatedFare: 15.50,
          deliveryCode: 'ABC123'
        }
      });
      deliveryId = delivery.id;
    });

    it('should get delivery by ID for owner', async () => {
      const response = await request(app)
        .get(`/api/deliveries/${deliveryId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          delivery: {
            id: deliveryId,
            userId: userId,
            pickupAddress: '123 Main St, New York, NY',
            status: 'PENDING'
          }
        }
      });
    });

    it('should get delivery by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/deliveries/${deliveryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not allow unauthorized user to access delivery', async () => {
      // Create another user
      const otherUser = await createTestUser({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        phoneNumber: '+1234567899',
        userType: 'USER'
      });
      const otherUserToken = await getAuthToken(otherUser.id);

      const response = await request(app)
        .get(`/api/deliveries/${deliveryId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Admin Actions', () => {
    let deliveryId: number;

    beforeEach(async () => {
      const delivery = await prisma.delivery.create({
        data: {
          userId: userId,
          pickupAddress: '123 Main St, New York, NY',
          deliveryAddress: '456 Broadway, New York, NY',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          deliveryLatitude: 40.7589,
          deliveryLongitude: -73.9851,
          recipientName: 'Jane Smith',
          recipientPhone: '+1987654321',
          packageDescription: 'Electronics',
          status: 'PENDING',
          estimatedFare: 15.50,
          deliveryCode: 'ABC123'
        }
      });
      deliveryId = delivery.id;
    });

    it('should allow admin to assign driver to delivery', async () => {
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/assign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ driverId: driverId })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      const delivery = await prisma.delivery.findUnique({ where: { id: deliveryId } });
      expect(delivery?.driverId).toBe(driverId);
      expect(delivery?.status).toBe('DRIVER_ASSIGNED');
    });

    it('should not allow non-admin to assign driver', async () => {
      const response = await request(app)
        .patch(`/api/deliveries/${deliveryId}/assign`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ driverId: driverId })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should get delivery statistics for admin', async () => {
      // Create some test deliveries for statistics
      await prisma.delivery.createMany({
        data: [
          {
            userId: userId,
            pickupAddress: '789 Oak St',
            deliveryAddress: '321 Pine St',
            pickupLatitude: 40.7128,
            pickupLongitude: -74.0060,
            deliveryLatitude: 40.7589,
            deliveryLongitude: -73.9851,
            recipientName: 'Bob Johnson',
            recipientPhone: '+1555666777',
            packageDescription: 'Books',
            status: 'DELIVERED',
            estimatedFare: 12.00,
            actualFare: 12.00,
            deliveryCode: 'DEF456'
          },
          {
            userId: userId,
            pickupAddress: '555 Elm St',
            deliveryAddress: '777 Maple Ave',
            pickupLatitude: 40.7128,
            pickupLongitude: -74.0060,
            deliveryLatitude: 40.7589,
            deliveryLongitude: -73.9851,
            recipientName: 'Alice Brown',
            recipientPhone: '+1888999000',
            packageDescription: 'Clothing',
            status: 'CANCELLED',
            estimatedFare: 18.00,
            deliveryCode: 'GHI789'
          }
        ]
      });

      const response = await request(app)
        .get('/api/deliveries/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalDeliveries: expect.any(Number),
          deliveredDeliveries: expect.any(Number),
          cancelledDeliveries: expect.any(Number),
          pendingDeliveries: expect.any(Number),
          inProgressDeliveries: expect.any(Number),
          deliveryRate: expect.any(Number),
          cancellationRate: expect.any(Number)
        }
      });
    });

    it('should not allow non-admin to access statistics', async () => {
      const response = await request(app)
        .get('/api/deliveries/admin/statistics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/deliveries/admin/statistics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent delivery ID', async () => {
      const response = await request(app)
        .get('/api/deliveries/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found')
      });
    });

    it('should handle invalid delivery ID format', async () => {
      const response = await request(app)
        .get('/api/deliveries/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle insufficient wallet balance', async () => {
      // Set user wallet balance to 0
      await prisma.wallet.update({
        where: { userId: userId },
        data: { balance: 0 }
      });

      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          pickupAddress: '123 Main St, New York, NY 10001',
          deliveryAddress: '456 Broadway, New York, NY 10013',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          deliveryLatitude: 40.7589,
          deliveryLongitude: -73.9851,
          recipientName: 'Jane Smith',
          recipientPhone: '+1987654321',
          packageDescription: 'Electronics',
          packageWeight: 2.5
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('insufficient')
      });
    });

    it('should handle driver trying to accept already assigned delivery', async () => {
      // Create delivery and assign to driver
      const delivery = await prisma.delivery.create({
        data: {
          userId: userId,
          driverId: driverId,
          pickupAddress: '123 Main St, New York, NY',
          deliveryAddress: '456 Broadway, New York, NY',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          deliveryLatitude: 40.7589,
          deliveryLongitude: -73.9851,
          recipientName: 'Jane Smith',
          recipientPhone: '+1987654321',
          packageDescription: 'Electronics',
          status: 'DRIVER_ASSIGNED',
          estimatedFare: 15.50,
          deliveryCode: 'ABC123'
        }
      });

      // Create another driver
      const otherDriver = await createTestDriver({
        firstName: 'Other',
        lastName: 'Driver',
        email: 'other.driver@example.com',
        phoneNumber: '+1234567898',
        userType: 'DRIVER'
      });
      const otherDriverToken = await getAuthToken(otherDriver.id);

      const response = await request(app)
        .patch(`/api/deliveries/${delivery.id}/accept`)
        .set('Authorization', `Bearer ${otherDriverToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('already assigned')
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on delivery creation', async () => {
      const deliveryData = {
        pickupAddress: '123 Main St, New York, NY 10001',
        deliveryAddress: '456 Broadway, New York, NY 10013',
        pickupLatitude: 40.7128,
        pickupLongitude: -74.0060,
        deliveryLatitude: 40.7589,
        deliveryLongitude: -73.9851,
        recipientName: 'Jane Smith',
        recipientPhone: '+1987654321',
        packageDescription: 'Electronics',
        packageWeight: 2.5
      };

      // Make multiple requests quickly
      const promises = Array(7).fill(null).map((_, index) => 
        request(app)
          .post('/api/deliveries')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            ...deliveryData,
            recipientName: `Recipient ${index}`
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});