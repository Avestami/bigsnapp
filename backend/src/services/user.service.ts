import { query } from '../config/database';
import { AppError } from '../middleware/errorHandler';

class UserService {
  async getProfile(userId: number) {
    const result = await query(
      `SELECT u.user_id, u.name, u.email, u.phone_number, u.user_type, 
              u.is_active, u.is_verified, u.created_at, u.profile_image_url,
              w.balance_rial, w.wallet_id,
              d.driver_id, d.license_number, d.is_verified as driver_verified,
              d.rating, d.total_trips, d.total_deliveries
       FROM "user" u
       LEFT JOIN wallet w ON u.wallet_id = w.wallet_id
       LEFT JOIN driver d ON u.user_id = d.user_id
       WHERE u.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return result.rows[0];
  }

  async updateProfile(userId: number, updates: any) {
    const allowedFields = ['name', 'email', 'profile_image_url'];
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    values.push(userId);
    const updateQuery = `
      UPDATE "user" 
      SET ${updateFields.join(', ')}
      WHERE user_id = $${paramCount}
      RETURNING user_id, name, email, phone_number, user_type, profile_image_url
    `;

    const result = await query(updateQuery, values);

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    return result.rows[0];
  }

  async updateDriverProfile(userId: number, updates: any) {
    const result = await query(
      'SELECT driver_id FROM driver WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Driver profile not found', 404);
    }

    const allowedFields = ['license_number'];
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = $${paramCount}`);
        values.push(updates[field]);
        paramCount++;
      }
    }

    if (updateFields.length === 0) {
      return result.rows[0];
    }

    values.push(result.rows[0].driver_id);
    const updateQuery = `
      UPDATE driver 
      SET ${updateFields.join(', ')}
      WHERE driver_id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await query(updateQuery, values);
    return updateResult.rows[0];
  }

  async getUserDevices(userId: number) {
    const result = await query(
      'SELECT device_id, device_type, platform, is_active, created_at FROM user_device WHERE user_id = $1',
      [userId]
    );

    return result.rows;
  }

  async registerDevice(userId: number, deviceData: any) {
    const { device_type, token, platform } = deviceData;

    // Deactivate other devices of the same platform
    await query(
      'UPDATE user_device SET is_active = false WHERE user_id = $1 AND platform = $2',
      [userId, platform]
    );

    const result = await query(
      `INSERT INTO user_device (user_id, device_type, token, platform, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (user_id, token) DO UPDATE 
       SET is_active = true, device_type = $2, platform = $4
       RETURNING device_id`,
      [userId, device_type, token, platform]
    );

    return result.rows[0];
  }

  async getFavoriteLocations(userId: number) {
    const result = await query(
      `SELECT f.fav_id, f.name, f.icon, l.address, l.latitude, l.longitude
       FROM favorite_location f
       JOIN location l ON f.location_id = l.location_id
       WHERE f.user_id = $1
       ORDER BY f.fav_id`,
      [userId]
    );

    return result.rows;
  }

  async addFavoriteLocation(userId: number, locationData: any) {
    const { name, icon, address, latitude, longitude } = locationData;

    // First create the location
    const locationResult = await query(
      `INSERT INTO location (address, latitude, longitude)
       VALUES ($1, $2, $3)
       RETURNING location_id`,
      [address, latitude, longitude]
    );

    const locationId = locationResult.rows[0].location_id;

    // Then create the favorite
    const favoriteResult = await query(
      `INSERT INTO favorite_location (user_id, location_id, name, icon)
       VALUES ($1, $2, $3, $4)
       RETURNING fav_id`,
      [userId, locationId, name, icon || 'home']
    );

    return {
      fav_id: favoriteResult.rows[0].fav_id,
      name,
      icon: icon || 'home',
      address,
      latitude,
      longitude,
    };
  }

  async removeFavoriteLocation(userId: number, favId: number) {
    const result = await query(
      'DELETE FROM favorite_location WHERE user_id = $1 AND fav_id = $2 RETURNING fav_id',
      [userId, favId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Favorite location not found', 404);
    }

    return { message: 'Favorite location removed successfully' };
  }

  async getUserStats(userId: number) {
    const userResult = await query(
      'SELECT user_type FROM "user" WHERE user_id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const userType = userResult.rows[0].user_type;

    if (userType === 'rider') {
      const stats = await query(
        `SELECT 
          COUNT(DISTINCT r.ride_id) as total_rides,
          COUNT(DISTINCT d.delivery_id) as total_deliveries,
          COALESCE(SUM(r.fare), 0) + COALESCE(SUM(dr.estimated_fare), 0) as total_spent
         FROM "user" u
         LEFT JOIN ride r ON u.user_id = r.user_id AND r.status = 'completed'
         LEFT JOIN delivery_request dr ON u.user_id = dr.sender_id AND dr.status = 'delivered'
         WHERE u.user_id = $1`,
        [userId]
      );

      return {
        type: 'rider',
        stats: stats.rows[0],
      };
    } else if (userType === 'driver') {
      const stats = await query(
        `SELECT 
          d.rating,
          d.total_trips,
          d.total_deliveries,
          d.earnings_today,
          COUNT(DISTINCT r.ride_id) as completed_rides_today,
          COUNT(DISTINCT del.delivery_id) as completed_deliveries_today
         FROM driver d
         LEFT JOIN ride r ON d.driver_id = r.driver_id 
           AND r.status = 'completed' 
           AND DATE(r.end_time) = CURRENT_DATE
         LEFT JOIN delivery_assignment del ON d.driver_id = del.driver_id 
           AND del.delivered_at IS NOT NULL 
           AND DATE(del.delivered_at) = CURRENT_DATE
         WHERE d.user_id = $1
         GROUP BY d.driver_id`,
        [userId]
      );

      return {
        type: 'driver',
        stats: stats.rows[0],
      };
    }

    return {
      type: userType,
      stats: {},
    };
  }
}

export const userService = new UserService(); 