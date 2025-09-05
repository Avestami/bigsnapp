import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

// API Configuration is imported from config

// Storage Keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Log all outgoing requests
        console.log('📤 Outgoing Request:');
        console.log('- Method:', config.method?.toUpperCase());
        console.log('- URL:', config.url);
        console.log('- Base URL:', config.baseURL);
        console.log('- Full URL:', `${config.baseURL}${config.url}`);
        console.log('- Headers:', config.headers);
        console.log('- Data:', config.data);
        
        return config;
      },
      (error) => {
        console.error('📤 Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => {
        console.log('📥 Response Success:');
        console.log('- Status:', response.status);
        console.log('- URL:', response.config.url);
        console.log('- Data:', response.data);
        return response;
      },
      async (error) => {
        console.error('📥 Response Error:');
        console.error('- Status:', error.response?.status);
        console.error('- Status Text:', error.response?.statusText);
        console.error('- URL:', error.config?.url);
        console.error('- Response Data:', error.response?.data);
        console.error('- Request Data:', error.config?.data);
        
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          console.log('🔄 Attempting token refresh for 401 error...');
          originalRequest._retry = true;

          try {
            const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
            if (refreshToken) {
              console.log('🔄 Refresh token found, attempting refresh...');
              const response = await this.refreshToken(refreshToken);
              const { accessToken } = response.data;
              
              await AsyncStorage.setItem(TOKEN_KEY, accessToken);
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              
              console.log('🔄 Token refreshed, retrying original request...');
              return this.api(originalRequest);
            } else {
              console.log('🔄 No refresh token found');
            }
          } catch (refreshError) {
            console.error('🔄 Token refresh failed:', refreshError);
            // Refresh failed, redirect to login
            await this.clearTokens();
            // You might want to emit an event here to redirect to login
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth Methods
  async login(email: string, password: string) {
    try {
      console.log('🔐 API Login Request:');
      console.log('- URL:', `${API_BASE_URL}/auth/login`);
      console.log('- Email:', email);
      console.log('- Password length:', password.length);
      
      const response = await this.api.post('/auth/login', { email, password });
      
      console.log('✅ Login Response Status:', response.status);
      console.log('✅ Login Response Data:', response.data);
      
      const { accessToken, refreshToken } = response.data.data.tokens;
      
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Login Error Details:');
      console.error('- Status:', error.response?.status);
      console.error('- Status Text:', error.response?.statusText);
      console.error('- Response Data:', error.response?.data);
      console.error('- Request URL:', error.config?.url);
      console.error('- Request Method:', error.config?.method);
      console.error('- Request Data:', error.config?.data);
      console.error('- Full Error:', error);
      throw error;
    }
  }

  async register(userData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
  }) {
    try {
      const requestData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phoneNumber: userData.phone, // Backend expects phoneNumber
        password: userData.password,
        userType: 'RIDER' // Default to RIDER for mobile app users
      };
      
      const response = await this.api.post('/auth/register', requestData);
      
      // Check if response has the expected structure
      if (response.data && response.data.success && response.data.data && response.data.data.tokens) {
        const { accessToken, refreshToken } = response.data.data.tokens;
        
        await AsyncStorage.setItem(TOKEN_KEY, accessToken);
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      } else {
        console.warn('⚠️ Registration response missing expected token structure:', response.data);
      }
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Registration API Error:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status,
        config: error?.config
      });
      throw error;
    }
  }

  async refreshToken(refreshToken: string) {
    return this.api.post('/auth/refresh', { refreshToken });
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.clearTokens();
    }
  }

  private async clearTokens() {
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
  }

  // Ride Methods
  async requestRide(rideData: {
    pickupLatitude: number;
    pickupLongitude: number;
    pickupAddress: string;
    destinationLatitude: number;
    destinationLongitude: number;
    destinationAddress: string;
    rideType: string;
    estimatedFare: number;
  }) {
    return this.api.post('/rides', rideData);
  }

  async getRides(status?: string) {
    const params = status ? { status } : {};
    return this.api.get('/rides', { params });
  }

  async getRideById(rideId: string) {
    return this.api.get(`/rides/${rideId}`);
  }

  async cancelRide(rideId: string, reason?: string) {
    return this.api.patch(`/rides/${rideId}/cancel`, { reason });
  }

  async completeRide(rideId: string) {
    return this.api.patch(`/rides/${rideId}/complete`);
  }

  // Delivery Methods
  async requestDelivery(deliveryData: {
    pickupLatitude: number;
    pickupLongitude: number;
    pickupAddress: string;
    deliveryLatitude: number;
    deliveryLongitude: number;
    deliveryAddress: string;
    packageType: string;
    packageDescription: string;
    recipientName: string;
    recipientPhone: string;
    estimatedFare: number;
  }) {
    return this.api.post('/deliveries', deliveryData);
  }

  async getDeliveries(status?: string) {
    const params = status ? { status } : {};
    return this.api.get('/deliveries', { params });
  }

  async getDeliveryById(deliveryId: string) {
    return this.api.get(`/deliveries/${deliveryId}`);
  }

  async cancelDelivery(deliveryId: string, reason?: string) {
    return this.api.patch(`/deliveries/${deliveryId}/cancel`, { reason });
  }

  async markDeliveryPickedUp(deliveryId: string) {
    return this.api.patch(`/deliveries/${deliveryId}/pickup`);
  }

  async markDeliveryDelivered(deliveryId: string) {
    return this.api.patch(`/deliveries/${deliveryId}/deliver`);
  }

  // Wallet Methods
  async getWallet() {
    return this.api.get('/wallet');
  }

  async getWalletTransactions(page = 1, limit = 20, type?: string) {
    const params = { page, limit, ...(type && { type }) };
    return this.api.get('/wallet/transactions', { params });
  }

  async addMoneyToWallet(amount: number, paymentMethod: string) {
    return this.api.post('/wallet/topup', { amount, paymentMethod });
  }

  // Review Methods
  async getReviews(page = 1, limit = 20, type?: 'RIDE' | 'DELIVERY') {
    const params = { page, limit, ...(type && { type }) };
    return this.api.get('/reviews', { params });
  }

  async createReview(reviewData: {
    rideId?: string;
    deliveryId?: string;
    driverId: string;
    rating: number;
    comment?: string;
  }) {
    return this.api.post('/reviews', reviewData);
  }

  async updateReview(reviewId: string, reviewData: {
    rating: number;
    comment?: string;
  }) {
    return this.api.patch(`/reviews/${reviewId}`, reviewData);
  }

  async deleteReview(reviewId: string) {
    return this.api.delete(`/reviews/${reviewId}`);
  }

  // User Profile Methods
  async getProfile() {
    return this.api.get('/users/profile');
  }

  async updateProfile(profileData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }) {
    return this.api.patch('/users/profile', profileData);
  }

  // Location and Geocoding Methods
  async geocodeAddress(address: string) {
    try {
      // TODO: Integrate with a proper geocoding service (Google Maps, Mapbox, etc.)
      // For now, using backend geocoding endpoint if available
      const response = await this.api.post('/geocode/address', { address });
      return response;
    } catch (error) {
      // Fallback to approximate coordinates for Tehran, Iran
      console.warn('Geocoding service unavailable, using fallback coordinates');
      return Promise.resolve({
        data: {
          latitude: 35.6892 + (Math.random() - 0.5) * 0.1,
          longitude: 51.3890 + (Math.random() - 0.5) * 0.1,
          address: address,
        }
      });
    }
  }

  async reverseGeocode(latitude: number, longitude: number) {
    try {
      // TODO: Integrate with a proper reverse geocoding service
      const response = await this.api.post('/geocode/reverse', { latitude, longitude });
      return response;
    } catch (error) {
      // Fallback to coordinate-based address
      console.warn('Reverse geocoding service unavailable, using fallback');
      return Promise.resolve({
        data: {
          address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}, Tehran, Iran`,
          latitude,
          longitude,
        }
      });
    }
  }

  // Fare Estimation
  async estimateFare(data: {
    pickupLatitude: number;
    pickupLongitude: number;
    destinationLatitude: number;
    destinationLongitude: number;
    serviceType: 'RIDE' | 'DELIVERY';
    rideType?: string;
    packageType?: string;
  }) {
    return this.api.post('/fare/estimate', data);
  }

  // Driver Tracking
  async getDriverLocation(driverId: string) {
    return this.api.get(`/drivers/${driverId}/location`);
  }

  // Utility Methods
  async checkConnection() {
    try {
      await this.api.get('/health');
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get current auth token
  async getAuthToken() {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  // Check if user is authenticated
  async isAuthenticated() {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return !!token;
  }

  // Favorites Methods
  async getFavoriteLocations() {
    return this.api.get('/favorites/locations');
  }

  async getFavoriteDrivers() {
    return this.api.get('/favorites/drivers');
  }

  async addFavoriteLocation(locationData: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
  }) {
    return this.api.post('/favorites/locations', locationData);
  }

  async removeFavoriteLocation(locationId: string) {
    return this.api.delete(`/favorites/locations/${locationId}`);
  }

  async addFavoriteDriver(driverId: string) {
    return this.api.post('/favorites/drivers', { driverId });
  }

  async removeFavoriteDriver(driverId: string) {
    return this.api.delete(`/favorites/drivers/${driverId}`);
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;

// Export types for use in components
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}