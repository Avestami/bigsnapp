import request from 'supertest';
import { app } from '../../src/app';
import { PrismaClient } from '@prisma/client';
import { setupTestDatabase, cleanupTestDatabase } from '../utils/test-database';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

describe('Auth Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up users before each test
    await prisma.user.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    const validUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+1234567890',
      password: 'Password123!',
      userType: 'RIDER',
      dateOfBirth: '1990-01-01'
    };

    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          user: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+1234567890',
            userType: 'RIDER'
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          }
        }
      });

      // Verify user was created in database
      const user = await prisma.user.findUnique({
        where: { email: 'john.doe@example.com' }
      });
      expect(user).toBeTruthy();
      expect(user?.firstName).toBe('John');
      expect(user?.userType).toBe('RIDER');
    });

    it('should not register user with duplicate email', async () => {
      // Create user first
      await prisma.user.create({
        data: {
          ...validUserData,
          password: await bcrypt.hash(validUserData.password, 10)
        }
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('already exists')
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'John'
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validUserData,
          password: '123' // Weak password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    const userData = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phoneNumber: '+1234567891',
      password: 'Password123!',
      userType: 'DRIVER'
    };

    beforeEach(async () => {
      // Create user for login tests
      await prisma.user.create({
        data: {
          ...userData,
          password: await bcrypt.hash(userData.password, 10)
        }
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            email: userData.email,
            userType: userData.userType
          },
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          }
        }
      });
    });

    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: userData.password
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials')
      });
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid credentials')
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let userId: number;

    beforeEach(async () => {
      // Register and login to get refresh token
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test.refresh@example.com',
          phoneNumber: '+1234567892',
          password: 'Password123!',
          userType: 'RIDER'
        });

      refreshToken = registerResponse.body.data.tokens.refreshToken;
      userId = registerResponse.body.data.user.id;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          tokens: {
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          }
        }
      });
    });

    it('should not refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('Invalid refresh token')
      });
    });

    it('should validate required refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: {
          firstName: 'Forgot',
          lastName: 'Password',
          email: 'forgot.password@example.com',
          phoneNumber: '+1234567893',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'RIDER'
        }
      });
    });

    it('should send password reset email for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot.password@example.com' })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Password reset email sent')
      });
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should still return success for security reasons
      expect(response.body).toMatchObject({
        success: true,
        message: expect.stringContaining('Password reset email sent')
      });
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limiting on register endpoint', async () => {
      const userData = {
        firstName: 'Rate',
        lastName: 'Limit',
        email: 'rate.limit@example.com',
        phoneNumber: '+1234567894',
        password: 'Password123!',
        userType: 'RIDER'
      };

      // Make multiple requests quickly
      const promises = Array(12).fill(null).map((_, index) => 
        request(app)
          .post('/api/auth/register')
          .send({
            ...userData,
            email: `rate.limit${index}@example.com`,
            phoneNumber: `+123456789${index}`
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429 status)
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limiting on login endpoint', async () => {
      // Create user first
      await prisma.user.create({
        data: {
          firstName: 'Rate',
          lastName: 'Limit',
          email: 'rate.limit.login@example.com',
          phoneNumber: '+1234567895',
          password: await bcrypt.hash('Password123!', 10),
          userType: 'RIDER'
        }
      });

      // Make multiple login attempts
      const promises = Array(12).fill(null).map(() => 
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'rate.limit.login@example.com',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});