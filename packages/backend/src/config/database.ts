import { Pool, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'snapp_clone',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  statement_timeout: 60000, // Kill query after 60 seconds
  query_timeout: 60000, // Kill query after 60 seconds
};

export const pool = new Pool(dbConfig);

// Test database connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

// Database query helper function
export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

// Begin transaction
export const beginTransaction = async () => {
  const client = await pool.connect();
  await client.query('BEGIN');
  return client;
};

// Commit transaction
export const commitTransaction = async (client: any) => {
  await client.query('COMMIT');
  client.release();
};

// Rollback transaction
export const rollbackTransaction = async (client: any) => {
  await client.query('ROLLBACK');
  client.release();
};

export default pool;