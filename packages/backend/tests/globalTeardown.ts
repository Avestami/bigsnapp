import { execSync } from 'child_process';

// Global teardown for Jest tests
export default async function globalTeardown() {
  console.log('🧹 Cleaning up test environment...');
  
  try {
    // Extract database name from TEST_DATABASE_URL
    const testDatabaseUrl = process.env.TEST_DATABASE_URL;
    if (testDatabaseUrl) {
      const dbName = testDatabaseUrl.split('/').pop();
      if (dbName) {
        console.log(`🗑️ Dropping test database: ${dbName}`);
        execSync(`dropdb ${dbName}`, { stdio: 'ignore' });
      }
    }
    
    console.log('✅ Test environment cleanup complete!');
  } catch (error) {
    console.error('❌ Failed to cleanup test environment:', error);
    // Don't throw error in teardown to avoid masking test failures
  }
}