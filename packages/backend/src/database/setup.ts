import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: 'postgres', // Connect to default postgres database first
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

const setupDatabase = async () => {
  try {
    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'snapp_clone';
    
    logger.info('Checking if database exists...');
    const dbExists = await pool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );

    if (dbExists.rows.length === 0) {
      logger.info(`Creating database: ${dbName}`);
      await pool.query(`CREATE DATABASE ${dbName}`);
      logger.info(`Database ${dbName} created successfully`);
    } else {
      logger.info(`Database ${dbName} already exists`);
    }

    // Close connection to postgres database
    await pool.end();

    // Connect to our application database
    const appPool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: dbName,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    });

    // Read and execute schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    logger.info('Executing schema...');
    await appPool.query(schemaSQL);
    logger.info('Schema executed successfully');

    // Insert seed data
    logger.info('Inserting seed data...');
    await insertSeedData(appPool);
    logger.info('Seed data inserted successfully');

    await appPool.end();
    logger.info('Database setup completed successfully');
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  }
};

const insertSeedData = async (pool: Pool) => {
  // Check if seed data already exists
  const existingPaymentMethods = await pool.query('SELECT COUNT(*) FROM payment_method');
  
  if (parseInt(existingPaymentMethods.rows[0].count) === 0) {
    // Insert payment methods
    await pool.query(`
      INSERT INTO payment_method (type) VALUES 
      ('WALLET'),
      ('CREDIT_CARD'),
      ('CASH'),
      ('BANK_TRANSFER')
    `);
  }

  const existingVehicleTypes = await pool.query('SELECT COUNT(*) FROM vehicle_type');
  
  if (parseInt(existingVehicleTypes.rows[0].count) === 0) {
    // Insert vehicle types
    await pool.query(`
      INSERT INTO vehicle_type (name, passenger_capacity, max_weight, has_cargo_box) VALUES
      ('Sedan', 4, 0, false),
      ('SUV', 7, 0, false),
      ('Motorcycle', 2, 5, false),
      ('Pickup Truck', 2, 500, true),
      ('Van', 8, 1000, true),
      ('Bicycle', 1, 10, true)
    `);
  }

  const existingVehicleModels = await pool.query('SELECT COUNT(*) FROM vehiclemodel');
  
  if (parseInt(existingVehicleModels.rows[0].count) === 0) {
    // Insert vehicle models
    await pool.query(`
      INSERT INTO vehiclemodel (brand, model_name) VALUES
      ('Toyota', 'Camry'),
      ('Toyota', 'Corolla'),
      ('Honda', 'Civic'),
      ('Honda', 'Accord'),
      ('Nissan', 'Sentra'),
      ('Hyundai', 'Elantra'),
      ('Kia', 'Optima'),
      ('Yamaha', 'MT-09'),
      ('Honda', 'CBR'),
      ('Suzuki', 'GSX-R'),
      ('Ford', 'Transit'),
      ('Mercedes', 'Sprinter')
    `);
  }

  // Check if admin user already exists
  const existingAdmin = await pool.query(`
    SELECT COUNT(*) FROM "user" WHERE email = $1
  `, [process.env.ADMIN_EMAIL || 'admin@snappclone.com']);
  
  if (parseInt(existingAdmin.rows[0].count) === 0) {
    // Create admin user
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    
    // Insert admin wallet first
    const adminWalletResult = await pool.query(`
      INSERT INTO wallet (balance_rial) VALUES (1000000000) RETURNING wallet_id
    `);
    
    const adminWalletId = adminWalletResult.rows[0].wallet_id;

    // Insert admin user
    const adminResult = await pool.query(`
      INSERT INTO "user" (name, email, password_hash, user_type, phone_number, wallet_id) 
      VALUES ($1, $2, $3, 'ADMIN', '+989123456789', $4) 
      RETURNING user_id
    `, [
      'Admin User',
      process.env.ADMIN_EMAIL || 'admin@snappclone.com',
      adminPassword,
      adminWalletId
    ]);

    // Update wallet with user_id
    await pool.query(`
      UPDATE wallet SET user_id = $1 WHERE wallet_id = $2
    `, [adminResult.rows[0].user_id, adminWalletId]);
  }

  // Check if locations already exist
  const existingLocations = await pool.query('SELECT COUNT(*) FROM location');
  
  if (parseInt(existingLocations.rows[0].count) === 0) {
    // Insert sample locations
    await pool.query(`
      INSERT INTO location (address, latitude, longitude) VALUES
      ('Tehran City Center', 35.6892, 51.3890),
      ('Imam Khomeini International Airport', 35.4161, 51.1519),
      ('Milad Tower', 35.7447, 51.3753),
      ('Azadi Tower', 35.6959, 51.3386),
      ('Tehran Grand Bazaar', 35.6736, 51.4106),
      ('Golestan Palace', 35.6793, 51.4211),
      ('Saadabad Complex', 35.7911, 51.4289),
      ('Darband', 35.8170, 51.4262),
      ('Tochal', 35.8288, 51.4014),
      ('Tehran University', 35.7011, 51.4014)
    `);
  }

  logger.info('Seed data inserted successfully');
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase;