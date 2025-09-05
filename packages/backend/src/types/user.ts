import { Request } from 'express';

export interface User {
  user_id: number;
  name: string;
  email: string;
  user_type: 'rider' | 'driver' | 'admin';
  phone_number: string;
  created_at: Date;
  wallet_id?: number;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  user_type: 'rider' | 'driver' | 'admin';
  phone_number: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone_number?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  refreshToken: string;
}

export interface Driver {
  driver_id: number;
  user_id: number;
  license_number: string;
  is_verified: boolean;
  user?: User;
}

export interface CreateDriverRequest {
  license_number: string;
  user_id: number;
}

export interface UpdateDriverRequest {
  license_number?: string;
}

// Note: Request interface is already extended globally in middlewares/auth.ts