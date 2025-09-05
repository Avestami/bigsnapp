import { execSync } from 'child_process';
import { randomBytes } from 'crypto';

// Global setup for Jest tests
export default async function globalSetup() {
  console.log('🚀 Setting up test environment...');
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
  process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use different Redis DB for tests
  
  // Generate unique test database name
  const testDbName = `snappclone_test_${randomBytes(8).toString('hex')}`;
  process.env.TEST_DATABASE_URL = `postgresql://postgres:password@localhost:5432/${testDbName}`;
  
  try {
    // Create test database
    console.log(`📦 Creating test database: ${testDbName}`);
    execSync(`createdb ${testDbName}`, { stdio: 'ignore' });
    
    // Run Prisma migrations on test database
    console.log('🔄 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
      },
      stdio: 'ignore',
    });
    
    console.log('✅ Test environment setup complete!');
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error);
    throw error;
  }
}