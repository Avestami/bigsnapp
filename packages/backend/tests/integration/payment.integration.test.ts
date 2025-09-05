import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, cleanupTestDatabase } from '../utils/test-database';
import { createTestUser, getAuthToken } from '../utils/test-helpers';

const prisma = new PrismaClient();

describe('Payment Integration Tests', () => {
  let userToken: string;
  let adminToken: string;
  let userId: number;
  let adminId: number;
  let walletId: number;

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

    const admin = await createTestUser({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phoneNumber: '+1234567892',
      userType: 'ADMIN'
    });
    adminId = admin.id;
    adminToken = await getAuthToken(admin.id);

    // Create wallet for user
    const wallet = await prisma.wallet.create({
      data: {
        userId: userId,
        balance: 100.00
      }
    });
    walletId = wallet.id;
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up payments and transactions before each test
    await prisma.walletTransaction.deleteMany();
    await prisma.payment.deleteMany();
    
    // Reset wallet balance
    await prisma.wallet.update({
      where: { id: walletId },
      data: { balance: 100.00 }
    });
  });

  describe('POST /api/payments', () => {
    const validPaymentData = {
      amount: 25.50,
      paymentMethod: 'WALLET',
      type: 'RIDE',
      description: 'Payment for ride #123'
    };

    it('should create a payment successfully', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send(validPaymentData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Payment created successfully',
        data: {
          payment: {
            userId: userId,
            amount: validPaymentData.amount,
            paymentMethod: validPaymentData.paymentMethod,
            type: validPaymentData.type,
            status: 'PENDING',
            paymentReference: expect.any(String)
          }
        }
      });

      // Verify payment was created in database
      const payment = await prisma.payment.findFirst({
        where: { userId: userId }
      });
      expect(payment).toBeTruthy();
      expect(payment?.status).toBe('PENDING');
      expect(payment?.paymentReference).toHaveLength(16);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: validPaymentData.amount
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate amount is positive', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validPaymentData,
          amount: -10.00
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate payment method', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validPaymentData,
          paymentMethod: 'INVALID_METHOD'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate payment type', async () => {
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...validPaymentData,
          type: 'INVALID_TYPE'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/payments')
        .send(validPaymentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/payments', () => {
    let paymentId: number;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: userId,
          amount: 25.50,
          paymentMethod: 'WALLET',
          type: 'RIDE',
          status: 'COMPLETED',
          paymentReference: 'PAY123456789ABCD',
          description: 'Test payment'
        }
      });
      paymentId = payment.id;
    });

    it('should get payments for user', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          payments: expect.arrayContaining([
            expect.objectContaining({
              id: paymentId,
              userId: userId,
              amount: 25.50,
              status: 'COMPLETED'
            })
          ]),
          pagination: expect.any(Object)
        }
      });
    });

    it('should get payments for admin with all payments', async () => {
      const response = await request(app)
        .get('/api/payments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments).toHaveLength(1);
    });

    it('should filter payments by status', async () => {
      const response = await request(app)
        .get('/api/payments?status=COMPLETED')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments.every((payment: any) => payment.status === 'COMPLETED')).toBe(true);
    });

    it('should filter payments by method', async () => {
      const response = await request(app)
        .get('/api/payments?method=WALLET')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments.every((payment: any) => payment.paymentMethod === 'WALLET')).toBe(true);
    });

    it('should filter payments by type', async () => {
      const response = await request(app)
        .get('/api/payments?type=RIDE')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments.every((payment: any) => payment.type === 'RIDE')).toBe(true);
    });

    it('should filter payments by amount range', async () => {
      const response = await request(app)
        .get('/api/payments?minAmount=20&maxAmount=30')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.payments.every((payment: any) => 
        payment.amount >= 20 && payment.amount <= 30
      )).toBe(true);
    });

    it('should filter payments by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 1);

      const response = await request(app)
        .get(`/api/payments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/payments?page=1&limit=5')
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
        .get('/api/payments?sortBy=createdAt&sortOrder=desc')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/payments/:paymentId', () => {
    let paymentId: number;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: userId,
          amount: 25.50,
          paymentMethod: 'WALLET',
          type: 'RIDE',
          status: 'COMPLETED',
          paymentReference: 'PAY123456789ABCD',
          description: 'Test payment'
        }
      });
      paymentId = payment.id;
    });

    it('should get payment by ID for owner', async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          payment: {
            id: paymentId,
            userId: userId,
            amount: 25.50,
            status: 'COMPLETED'
          }
        }
      });
    });

    it('should get payment by ID for admin', async () => {
      const response = await request(app)
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not allow unauthorized user to access payment', async () => {
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
        .get(`/api/payments/${paymentId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/:paymentId/process', () => {
    let paymentId: number;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: userId,
          amount: 25.50,
          paymentMethod: 'WALLET',
          type: 'RIDE',
          status: 'PENDING',
          paymentReference: 'PAY123456789ABCD',
          description: 'Test payment'
        }
      });
      paymentId = payment.id;
    });

    it('should process wallet payment successfully', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Payment processed successfully'
      });

      // Verify payment status updated
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      expect(payment?.status).toBe('COMPLETED');

      // Verify wallet balance deducted
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      expect(wallet?.balance).toBe(74.50); // 100 - 25.50

      // Verify wallet transaction created
      const transaction = await prisma.walletTransaction.findFirst({
        where: { walletId: walletId, type: 'DEBIT' }
      });
      expect(transaction).toBeTruthy();
      expect(transaction?.amount).toBe(25.50);
    });

    it('should handle insufficient wallet balance', async () => {
      // Set wallet balance to less than payment amount
      await prisma.wallet.update({
        where: { id: walletId },
        data: { balance: 10.00 }
      });

      const response = await request(app)
        .post(`/api/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Insufficient wallet balance')
      });

      // Verify payment status not changed
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      expect(payment?.status).toBe('PENDING');
    });

    it('should not process already completed payment', async () => {
      // Update payment to completed
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED' }
      });

      const response = await request(app)
        .post(`/api/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('already processed')
      });
    });

    it('should not allow unauthorized user to process payment', async () => {
      const otherUser = await createTestUser({
        firstName: 'Other',
        lastName: 'User',
        email: 'other@example.com',
        phoneNumber: '+1234567899',
        userType: 'USER'
      });
      const otherUserToken = await getAuthToken(otherUser.id);

      const response = await request(app)
        .post(`/api/payments/${paymentId}/process`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/payments/:paymentId/cancel', () => {
    let paymentId: number;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: userId,
          amount: 25.50,
          paymentMethod: 'WALLET',
          type: 'RIDE',
          status: 'PENDING',
          paymentReference: 'PAY123456789ABCD',
          description: 'Test payment'
        }
      });
      paymentId = payment.id;
    });

    it('should cancel pending payment successfully', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'User cancelled' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Payment cancelled successfully'
      });

      // Verify payment status updated
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      expect(payment?.status).toBe('CANCELLED');
    });

    it('should cancel processing payment successfully', async () => {
      // Update payment to processing
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PROCESSING' }
      });

      const response = await request(app)
        .post(`/api/payments/${paymentId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'User cancelled' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not cancel completed payment', async () => {
      // Update payment to completed
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED' }
      });

      const response = await request(app)
        .post(`/api/payments/${paymentId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ reason: 'User cancelled' })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('cannot be cancelled')
      });
    });

    it('should require cancellation reason', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Wallet Operations', () => {
    describe('POST /api/payments/wallet/topup', () => {
      const validTopupData = {
        amount: 50.00,
        paymentMethod: 'STRIPE'
      };

      it('should create wallet topup payment successfully', async () => {
        const response = await request(app)
          .post('/api/payments/wallet/topup')
          .set('Authorization', `Bearer ${userToken}`)
          .send(validTopupData)
          .expect(201);

        expect(response.body).toMatchObject({
          success: true,
          message: 'Wallet topup initiated successfully',
          data: {
            payment: {
              userId: userId,
              amount: validTopupData.amount,
              paymentMethod: validTopupData.paymentMethod,
              type: 'TOPUP',
              status: 'PENDING'
            }
          }
        });

        // Verify payment was created in database
        const payment = await prisma.payment.findFirst({
          where: { 
            userId: userId,
            type: 'TOPUP'
          }
        });
        expect(payment).toBeTruthy();
        expect(payment?.status).toBe('PENDING');
      });

      it('should create wallet if it does not exist', async () => {
        // Create new user without wallet
        const newUser = await createTestUser({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser@example.com',
          phoneNumber: '+1234567897',
          userType: 'USER'
        });
        const newUserToken = await getAuthToken(newUser.id);

        const response = await request(app)
          .post('/api/payments/wallet/topup')
          .set('Authorization', `Bearer ${newUserToken}`)
          .send(validTopupData)
          .expect(201);

        expect(response.body.success).toBe(true);

        // Verify wallet was created
        const wallet = await prisma.wallet.findUnique({
          where: { userId: newUser.id }
        });
        expect(wallet).toBeTruthy();
        expect(wallet?.balance).toBe(0);
      });

      it('should validate topup amount', async () => {
        const response = await request(app)
          .post('/api/payments/wallet/topup')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            ...validTopupData,
            amount: -10.00
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate minimum topup amount', async () => {
        const response = await request(app)
          .post('/api/payments/wallet/topup')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            ...validTopupData,
            amount: 0.50 // Less than minimum
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('should validate maximum topup amount', async () => {
        const response = await request(app)
          .post('/api/payments/wallet/topup')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            ...validTopupData,
            amount: 10000.00 // More than maximum
          })
          .expect(400);

        expect(response.body.success).toBe(false);
      });
    });

    describe('GET /api/payments/wallet/balance', () => {
      it('should get wallet balance for user', async () => {
        const response = await request(app)
          .get('/api/payments/wallet/balance')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            wallet: {
              userId: userId,
              balance: 100.00
            }
          }
        });
      });

      it('should create wallet if it does not exist', async () => {
        // Create new user without wallet
        const newUser = await createTestUser({
          firstName: 'New',
          lastName: 'User',
          email: 'newuser2@example.com',
          phoneNumber: '+1234567896',
          userType: 'USER'
        });
        const newUserToken = await getAuthToken(newUser.id);

        const response = await request(app)
          .get('/api/payments/wallet/balance')
          .set('Authorization', `Bearer ${newUserToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            wallet: {
              userId: newUser.id,
              balance: 0.00
            }
          }
        });

        // Verify wallet was created in database
        const wallet = await prisma.wallet.findUnique({
          where: { userId: newUser.id }
        });
        expect(wallet).toBeTruthy();
      });
    });

    describe('GET /api/payments/wallet/transactions', () => {
      beforeEach(async () => {
        // Create some test transactions
        await prisma.walletTransaction.createMany({
          data: [
            {
              walletId: walletId,
              type: 'CREDIT',
              amount: 50.00,
              description: 'Wallet topup',
              balanceAfter: 150.00
            },
            {
              walletId: walletId,
              type: 'DEBIT',
              amount: 25.00,
              description: 'Ride payment',
              balanceAfter: 125.00
            }
          ]
        });
      });

      it('should get wallet transactions for user', async () => {
        const response = await request(app)
          .get('/api/payments/wallet/transactions')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toMatchObject({
          success: true,
          data: {
            transactions: expect.arrayContaining([
              expect.objectContaining({
                walletId: walletId,
                type: 'CREDIT',
                amount: 50.00
              }),
              expect.objectContaining({
                walletId: walletId,
                type: 'DEBIT',
                amount: 25.00
              })
            ]),
            pagination: expect.any(Object)
          }
        });
      });

      it('should filter transactions by type', async () => {
        const response = await request(app)
          .get('/api/payments/wallet/transactions?type=CREDIT')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.transactions.every((tx: any) => tx.type === 'CREDIT')).toBe(true);
      });

      it('should filter transactions by amount range', async () => {
        const response = await request(app)
          .get('/api/payments/wallet/transactions?minAmount=40&maxAmount=60')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.transactions.every((tx: any) => 
          tx.amount >= 40 && tx.amount <= 60
        )).toBe(true);
      });

      it('should support pagination', async () => {
        const response = await request(app)
          .get('/api/payments/wallet/transactions?page=1&limit=1')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination).toMatchObject({
          page: 1,
          limit: 1,
          total: expect.any(Number)
        });
      });
    });
  });

  describe('Payment Gateway Callbacks', () => {
    let paymentId: number;
    let paymentReference: string;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: userId,
          amount: 50.00,
          paymentMethod: 'STRIPE',
          type: 'TOPUP',
          status: 'PENDING',
          paymentReference: 'PAY123456789ABCD',
          description: 'Wallet topup'
        }
      });
      paymentId = payment.id;
      paymentReference = payment.paymentReference;
    });

    it('should handle successful payment callback', async () => {
      const callbackData = {
        paymentReference: paymentReference,
        status: 'succeeded',
        gatewayTransactionId: 'stripe_tx_123',
        signature: 'mock_signature'
      };

      const response = await request(app)
        .post('/api/payments/callback')
        .send(callbackData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Payment callback processed successfully'
      });

      // Verify payment status updated
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      expect(payment?.status).toBe('COMPLETED');
      expect(payment?.gatewayTransactionId).toBe('stripe_tx_123');

      // Verify wallet balance updated for topup
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      expect(wallet?.balance).toBe(150.00); // 100 + 50

      // Verify wallet transaction created
      const transaction = await prisma.walletTransaction.findFirst({
        where: { walletId: walletId, type: 'CREDIT' }
      });
      expect(transaction).toBeTruthy();
      expect(transaction?.amount).toBe(50.00);
    });

    it('should handle failed payment callback', async () => {
      const callbackData = {
        paymentReference: paymentReference,
        status: 'failed',
        gatewayTransactionId: 'stripe_tx_456',
        signature: 'mock_signature'
      };

      const response = await request(app)
        .post('/api/payments/callback')
        .send(callbackData)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify payment status updated
      const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
      expect(payment?.status).toBe('FAILED');

      // Verify wallet balance not updated
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      expect(wallet?.balance).toBe(100.00); // Unchanged
    });

    it('should handle invalid payment reference', async () => {
      const callbackData = {
        paymentReference: 'INVALID_REF',
        status: 'succeeded',
        gatewayTransactionId: 'stripe_tx_789',
        signature: 'mock_signature'
      };

      const response = await request(app)
        .post('/api/payments/callback')
        .send(callbackData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Payment not found')
      });
    });

    it('should validate required callback fields', async () => {
      const response = await request(app)
        .post('/api/payments/callback')
        .send({
          paymentReference: paymentReference
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Payment Refunds', () => {
    let paymentId: number;

    beforeEach(async () => {
      const payment = await prisma.payment.create({
        data: {
          userId: userId,
          amount: 25.50,
          paymentMethod: 'WALLET',
          type: 'RIDE',
          status: 'COMPLETED',
          paymentReference: 'PAY123456789ABCD',
          description: 'Test payment'
        }
      });
      paymentId = payment.id;
    });

    it('should process refund successfully', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 25.50,
          reason: 'Service not provided'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Refund processed successfully'
      });

      // Verify refund record created
      const refund = await prisma.refund.findFirst({
        where: { paymentId: paymentId }
      });
      expect(refund).toBeTruthy();
      expect(refund?.amount).toBe(25.50);
      expect(refund?.status).toBe('COMPLETED');

      // Verify wallet balance updated
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      expect(wallet?.balance).toBe(125.50); // 100 + 25.50

      // Verify wallet transaction created
      const transaction = await prisma.walletTransaction.findFirst({
        where: { walletId: walletId, type: 'CREDIT' }
      });
      expect(transaction).toBeTruthy();
      expect(transaction?.amount).toBe(25.50);
    });

    it('should process partial refund successfully', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 10.00,
          reason: 'Partial service issue'
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify refund record created
      const refund = await prisma.refund.findFirst({
        where: { paymentId: paymentId }
      });
      expect(refund?.amount).toBe(10.00);

      // Verify wallet balance updated
      const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
      expect(wallet?.balance).toBe(110.00); // 100 + 10.00
    });

    it('should not allow refund amount greater than payment amount', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 50.00, // Greater than payment amount
          reason: 'Test refund'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('exceeds payment amount')
      });
    });

    it('should not allow refund for non-completed payment', async () => {
      // Update payment to pending
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'PENDING' }
      });

      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 25.50,
          reason: 'Test refund'
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Only completed payments can be refunded')
      });
    });

    it('should not allow non-admin to process refund', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 25.50,
          reason: 'Test refund'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should require refund reason', async () => {
      const response = await request(app)
        .post(`/api/payments/${paymentId}/refund`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          amount: 25.50
          // Missing reason
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Payment Statistics', () => {
    beforeEach(async () => {
      // Create test payments for statistics
      await prisma.payment.createMany({
        data: [
          {
            userId: userId,
            amount: 25.50,
            paymentMethod: 'WALLET',
            type: 'RIDE',
            status: 'COMPLETED',
            paymentReference: 'PAY123456789ABC1'
          },
          {
            userId: userId,
            amount: 50.00,
            paymentMethod: 'STRIPE',
            type: 'TOPUP',
            status: 'COMPLETED',
            paymentReference: 'PAY123456789ABC2'
          },
          {
            userId: userId,
            amount: 15.00,
            paymentMethod: 'WALLET',
            type: 'DELIVERY',
            status: 'FAILED',
            paymentReference: 'PAY123456789ABC3'
          }
        ]
      });
    });

    it('should get payment statistics for admin', async () => {
      const response = await request(app)
        .get('/api/payments/admin/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalPayments: expect.any(Number),
          completedPayments: expect.any(Number),
          failedPayments: expect.any(Number),
          pendingPayments: expect.any(Number),
          totalAmount: expect.any(Number),
          completedAmount: expect.any(Number),
          successRate: expect.any(Number),
          averagePaymentAmount: expect.any(Number)
        }
      });

      expect(response.body.data.totalPayments).toBeGreaterThanOrEqual(3);
      expect(response.body.data.completedPayments).toBeGreaterThanOrEqual(2);
      expect(response.body.data.failedPayments).toBeGreaterThanOrEqual(1);
    });

    it('should filter statistics by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      const response = await request(app)
        .get(`/api/payments/admin/statistics?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter statistics by payment method', async () => {
      const response = await request(app)
        .get('/api/payments/admin/statistics?method=WALLET')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter statistics by payment type', async () => {
      const response = await request(app)
        .get('/api/payments/admin/statistics?type=RIDE')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should group statistics by period', async () => {
      const response = await request(app)
        .get('/api/payments/admin/statistics?groupBy=day')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.groupedData).toBeDefined();
    });

    it('should not allow non-admin to access statistics', async () => {
      const response = await request(app)
        .get('/api/payments/admin/statistics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent payment ID', async () => {
      const response = await request(app)
        .get('/api/payments/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('not found')
      });
    });

    it('should handle invalid payment ID format', async () => {
      const response = await request(app)
        .get('/api/payments/invalid-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database failures
      // For now, we'll test that the API handles malformed requests
      const response = await request(app)
        .post('/api/payments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 'invalid_amount',
          paymentMethod: 'WALLET',
          type: 'RIDE'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on payment creation', async () => {
      const paymentData = {
        amount: 10.00,
        paymentMethod: 'WALLET',
        type: 'RIDE',
        description: 'Test payment'
      };

      // Make multiple requests quickly
      const promises = Array(12).fill(null).map((_, index) => 
        request(app)
          .post('/api/payments')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            ...paymentData,
            description: `Test payment ${index}`
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limiting on wallet topup', async () => {
      const topupData = {
        amount: 25.00,
        paymentMethod: 'STRIPE'
      };

      // Make multiple requests quickly
      const promises = Array(8).fill(null).map(() => 
        request(app)
          .post('/api/payments/wallet/topup')
          .set('Authorization', `Bearer ${userToken}`)
          .send(topupData)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});