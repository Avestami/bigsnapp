import { readFileSync } from 'fs';
import { join } from 'path';
import { pool } from '../config/database';
import { logger } from '../utils/logger';

async function setupDatabase() {
  try {
    logger.info('Starting database setup...');

    // Read the schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Execute the schema
    await pool.query(schema);

    logger.info('Database schema created successfully');

    // Create default admin user
    await createDefaultAdmin();

    // Create default vehicle types
    await createDefaultVehicleTypes();

    logger.info('Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database setup failed:', error);
    process.exit(1);
  }
}

async function createDefaultAdmin() {
  const bcrypt = require('bcrypt');
  
  try {
    // Check if admin already exists
    const existing = await pool.query(
      'SELECT user_id FROM "user" WHERE email = $1',
      [process.env.ADMIN_EMAIL || 'admin@snappclone.com']
    );

    if (existing.rows.length > 0) {
      logger.info('Admin user already exists');
      return;
    }

    // Create admin user with wallet
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create wallet
      const walletResult = await client.query(
        'INSERT INTO wallet (balance_rial) VALUES ($1) RETURNING wallet_id',
        [0]
      );
      const walletId = walletResult.rows[0].wallet_id;

      // Create admin user
      const passwordHash = await bcrypt.hash(
        process.env.ADMIN_PASSWORD || 'admin123',
        10
      );

      const userResult = await client.query(
        `INSERT INTO "user" (name, email, password_hash, phone_number, user_type, wallet_id, is_verified) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id`,
        [
          'System Admin',
          process.env.ADMIN_EMAIL || 'admin@snappclone.com',
          passwordHash,
          '09123456789',
          'admin',
          walletId,
          true,
        ]
      );
      const userId = userResult.rows[0].user_id;

      // Update wallet with user_id
      await client.query(
        'UPDATE wallet SET user_id = $1 WHERE wallet_id = $2',
        [userId, walletId]
      );

      await client.query('COMMIT');
      logger.info('Default admin user created successfully');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Failed to create default admin:', error);
  }
}

async function createDefaultVehicleTypes() {
  try {
    const vehicleTypes = [
      {
        name: 'Motorcycle',
        max_weight: 20,
        passenger_capacity: 1,
        has_cargo_box: true,
        base_fare: 15000,
        per_km_fare: 3000,
        per_minute_fare: 500,
        minimum_fare: 20000,
      },
      {
        name: 'Economy Car',
        max_weight: 50,
        passenger_capacity: 3,
        has_cargo_box: false,
        base_fare: 25000,
        per_km_fare: 4000,
        per_minute_fare: 700,
        minimum_fare: 30000,
      },
      {
        name: 'Comfort Car',
        max_weight: 50,
        passenger_capacity: 3,
        has_cargo_box: false,
        base_fare: 35000,
        per_km_fare: 5000,
        per_minute_fare: 900,
        minimum_fare: 40000,
      },
      {
        name: 'Premium Car',
        max_weight: 50,
        passenger_capacity: 3,
        has_cargo_box: false,
        base_fare: 50000,
        per_km_fare: 7000,
        per_minute_fare: 1200,
        minimum_fare: 60000,
      },
      {
        name: 'Van',
        max_weight: 200,
        passenger_capacity: 7,
        has_cargo_box: true,
        base_fare: 45000,
        per_km_fare: 6000,
        per_minute_fare: 1000,
        minimum_fare: 55000,
      },
      {
        name: 'Pickup Truck',
        max_weight: 500,
        passenger_capacity: 2,
        has_cargo_box: true,
        base_fare: 60000,
        per_km_fare: 8000,
        per_minute_fare: 1300,
        minimum_fare: 70000,
      },
    ];

    for (const vehicleType of vehicleTypes) {
      await pool.query(
        `INSERT INTO vehicle_type (name, max_weight, passenger_capacity, has_cargo_box, base_fare, per_km_fare, per_minute_fare, minimum_fare)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (name) DO NOTHING`,
        [
          vehicleType.name,
          vehicleType.max_weight,
          vehicleType.passenger_capacity,
          vehicleType.has_cargo_box,
          vehicleType.base_fare,
          vehicleType.per_km_fare,
          vehicleType.per_minute_fare,
          vehicleType.minimum_fare,
        ]
      );
    }

    logger.info('Default vehicle types created successfully');
  } catch (error) {
    logger.error('Failed to create default vehicle types:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
} 