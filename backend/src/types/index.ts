// User types
export type UserType = 'driver' | 'rider' | 'admin';

export interface User {
  user_id: number;
  name: string;
  email: string;
  password_hash?: string;
  phone_number: string;
  user_type: UserType;
  wallet_id?: number;
  is_active: boolean;
  is_verified: boolean;
  verification_code?: string;
  verification_expiry?: Date;
  last_login?: Date;
  profile_image_url?: string;
  created_at: Date;
}

export interface Driver {
  driver_id: number;
  user_id: number;
  license_number: string;
  is_verified: boolean;
  is_available: boolean;
  current_location_lat?: number;
  current_location_lng?: number;
  rating: number;
  total_trips: number;
  total_deliveries: number;
  earnings_today: number;
  last_location_update?: Date;
}

// Wallet types
export interface Wallet {
  wallet_id: number;
  user_id: number;
  balance_rial: number;
  created_at: Date;
  updated_at: Date;
}

export type TransactionType = 'topup' | 'payment' | 'payout' | 'refund' | 'penalty' | 'earning';
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';

export interface WalletTransaction {
  transaction_id: number;
  wallet_id: number;
  amount_rial: number;
  description: string;
  type: TransactionType;
  reference_type: 'ride' | 'delivery' | 'topup' | 'manual';
  reference_id?: number;
  status: TransactionStatus;
  balance_after: number;
  created_at: Date;
}

// Location types
export interface Location {
  location_id: number;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  postal_code?: string;
}

// Ride types
export type RideStatus = 'pending' | 'accepted' | 'arriving' | 'in_progress' | 'completed' | 'cancelled';

export interface Ride {
  ride_id: number;
  user_id: number;
  driver_id?: number;
  vehicle_id?: number;
  fare?: number;
  start_time?: Date;
  end_time?: Date;
  pickup_location_id: number;
  drop_off_location_id: number;
  status: RideStatus;
  distance_km?: number;
  duration_minutes?: number;
  payment_method: string;
  cancellation_reason?: string;
  cancelled_by?: 'rider' | 'driver' | 'system';
  estimated_fare?: number;
  surge_multiplier: number;
}

// Delivery types
export type DeliveryStatus = 'pending' | 'accepted' | 'picking_up' | 'in_transit' | 'delivered' | 'cancelled' | 'returned';

export interface DeliveryRequest {
  delivery_id: number;
  sender_id: number;
  receiver_id?: number;
  weight_kg: number;
  pickup_location_id: number;
  drop_off_location_id: number;
  vehicle_type_id: number;
  value_rial: number;
  status: DeliveryStatus;
  scheduled_time?: Date;
  package_description?: string;
  receiver_phone?: string;
  receiver_name?: string;
  delivery_instructions?: string;
  photo_url?: string;
  delivery_code?: string;
  estimated_fare?: number;
  created_at: Date;
}

// Vehicle types
export interface Vehicle {
  vehicle_id: number;
  license_plate: string;
  driver_id: number;
  color: string;
  model_id: number;
  vehicle_type_id: number;
  is_approved: boolean;
  inspection_date?: Date;
  insurance_expiry?: Date;
}

export interface VehicleType {
  type_id: number;
  name: string;
  max_weight?: number;
  passenger_capacity?: number;
  has_cargo_box: boolean;
  base_fare: number;
  per_km_fare: number;
  per_minute_fare: number;
  minimum_fare: number;
}

// Auth types
export interface JwtPayload {
  user_id: number;
  user_type: UserType;
  email: string;
  phone_number: string;
}

export interface AuthRequest {
  user?: JwtPayload;
  body: any;
  params: any;
  query: any;
  headers: any;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: any[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Socket event types
export interface LocationUpdate {
  driver_id: number;
  latitude: number;
  longitude: number;
  timestamp: Date;
}

export interface RideTrackingUpdate {
  ride_id: number;
  driver_location: {
    latitude: number;
    longitude: number;
  };
  status: RideStatus;
  eta_minutes?: number;
}

// Request body types
export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  phone_number: string;
  user_type: UserType;
}

export interface LoginBody {
  phone_number: string;
  password: string;
}

export interface CreateRideBody {
  pickup_location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  drop_off_location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  vehicle_type_id: number;
  payment_method: string;
}

export interface CreateDeliveryBody {
  pickup_location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  drop_off_location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  weight_kg: number;
  value_rial: number;
  vehicle_type_id: number;
  package_description?: string;
  receiver_phone: string;
  receiver_name: string;
  delivery_instructions?: string;
  scheduled_time?: string;
}

export interface TopupBody {
  amount_rial: number;
  payment_gateway: string;
}

// Admin action types
export interface AdminActionLog {
  action_id: number;
  admin_id: number;
  action_type: string;
  target_user_id?: number;
  target_vehicle_id?: number;
  target_ride_id?: number;
  target_delivery_id?: number;
  details: string;
  timestamp: Date;
} 