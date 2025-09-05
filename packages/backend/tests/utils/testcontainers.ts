import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Testcontainers setup for integration tests
export class TestDatabase {
  private container: StartedTestContainer | null = null;
  private prisma: PrismaClient | null = null;
  private databaseUrl: string = '';

  async start(): Promise<{ prisma: PrismaClient; databaseUrl: string }> {
    console.log('🐳 Starting PostgreSQL test container...');
    
    // Start PostgreSQL container
    this.container = await new GenericContainer('postgres:15-alpine')
      .withEnvironment({
        POSTGRES_DB: 'snappclone_test',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'password',
      })
      .withExposedPorts(5432)
      .withWaitStrategy({
        type: 'log',
        message: 'database system is ready to accept connections',
        times: 2,
      })
      .start();

    const host = this.container.getHost();
    const port = this.container.getMappedPort(5432);
    this.databaseUrl = `postgresql://postgres:password@${host}:${port}/snappclone_test`;

    console.log(`📦 PostgreSQL container started at: ${this.databaseUrl}`);

    // Initialize Prisma client
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.databaseUrl,
        },
      },
    });

    // Connect to database
    await this.prisma.$connect();

    // Run migrations
    console.log('🔄 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: this.databaseUrl,
      },
      stdio: 'pipe',
    });

    console.log('✅ Test database ready!');
    return { prisma: this.prisma, databaseUrl: this.databaseUrl };
  }

  async stop(): Promise<void> {
    console.log('🧹 Stopping test database...');
    
    if (this.prisma) {
      await this.prisma.$disconnect();
      this.prisma = null;
    }

    if (this.container) {
      await this.container.stop();
      this.container = null;
    }

    console.log('✅ Test database stopped!');
  }

  async cleanup(): Promise<void> {
    if (!this.prisma) return;

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
        await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
      } catch (error) {
        // Table might not exist, continue
      }
    }
  }

  getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Database not started. Call start() first.');
    }
    return this.prisma;
  }

  getDatabaseUrl(): string {
    if (!this.databaseUrl) {
      throw new Error('Database not started. Call start() first.');
    }
    return this.databaseUrl;
  }
}

// Global test database instance for integration tests
export const testDatabase = new TestDatabase();

// Helper function to setup integration test environment
export const setupIntegrationTest = async () => {
  const { prisma, databaseUrl } = await testDatabase.start();
  
  // Set environment variables
  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
  
  return { prisma, databaseUrl };
};

// Helper function to teardown integration test environment
export const teardownIntegrationTest = async () => {
  await testDatabase.stop();
};

// Helper function to clean database between tests
export const cleanDatabase = async () => {
  await testDatabase.cleanup();
};