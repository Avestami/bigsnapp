import axios, { AxiosInstance } from 'axios';

// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';
const API_TIMEOUT = 10000;

class AdminApiService {
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
      (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('admin_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth Methods
  async login(email: string, password: string) {
    return this.api.post('/admin/auth/login', { email, password });
  }

  async getProfile() {
    return this.api.get('/admin/profile');
  }

  // Dashboard Methods
  async getDashboardStats() {
    return this.api.get('/admin/dashboard/stats');
  }

  async getRecentActivity() {
    return this.api.get('/admin/dashboard/activity');
  }

  // User Management
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    role?: string;
  }) {
    return this.api.get('/admin/users', { params });
  }

  async getUserById(userId: string) {
    return this.api.get(`/admin/users/${userId}`);
  }

  async getUserRides(userId: string) {
    return this.api.get(`/admin/users/${userId}/rides`);
  }

  async updateUserStatus(userId: string, status: string) {
    return this.api.patch(`/admin/users/${userId}/status`, { status });
  }

  async createUser(userData: any) {
    return this.api.post('/admin/users', userData);
  }

  async updateUser(userId: string, userData: any) {
    return this.api.put(`/admin/users/${userId}`, userData);
  }

  async deleteUser(userId: string) {
    return this.api.delete(`/admin/users/${userId}`);
  }

  // Driver Management
  async getDrivers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    isOnline?: boolean;
  }) {
    return this.api.get('/admin/drivers', { params });
  }

  async getDriverById(driverId: string) {
    return this.api.get(`/admin/drivers/${driverId}`);
  }

  async updateDriverStatus(driverId: string, status: string) {
    return this.api.patch(`/admin/drivers/${driverId}/status`, { status });
  }

  async approveDriver(driverId: string) {
    return this.api.patch(`/admin/drivers/${driverId}/approve`);
  }

  async rejectDriver(driverId: string, reason: string) {
    return this.api.patch(`/admin/drivers/${driverId}/reject`, { reason });
  }

  // Vehicle Management
  async getVehicles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }) {
    return this.api.get('/admin/vehicles', { params });
  }

  async getVehicleById(vehicleId: string) {
    return this.api.get(`/admin/vehicles/${vehicleId}`);
  }

  async approveVehicle(vehicleId: string) {
    return this.api.patch(`/admin/vehicles/${vehicleId}/approve`);
  }

  async rejectVehicle(vehicleId: string, reason: string) {
    return this.api.patch(`/admin/vehicles/${vehicleId}/reject`, { reason });
  }

  async updateVehicleStatus(vehicleId: string, status: string) {
    return this.api.patch(`/admin/vehicles/${vehicleId}/status`, { status });
  }

  // Ride Management
  async getRides(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.api.get('/admin/rides', { params });
  }

  async getRideStats() {
    return this.api.get('/admin/rides/stats');
  }

  async getRideById(rideId: string) {
    return this.api.get(`/admin/rides/${rideId}`);
  }

  async cancelRide(rideId: string, reason: string) {
    return this.api.patch(`/admin/rides/${rideId}/cancel`, { reason });
  }

  // Delivery Management
  async getDeliveries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.api.get('/admin/deliveries', { params });
  }

  async getDeliveryStats() {
    return this.api.get('/admin/deliveries/stats');
  }

  async getDeliveryById(deliveryId: string) {
    return this.api.get(`/admin/deliveries/${deliveryId}`);
  }

  async cancelDelivery(deliveryId: string, reason: string) {
    return this.api.patch(`/admin/deliveries/${deliveryId}/cancel`, { reason });
  }

  // Wallet Management
  async getWalletTransactions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.api.get('/admin/wallet/transactions', { params });
  }

  async getWalletStats() {
    return this.api.get('/admin/wallet/stats');
  }

  async processRefund(transactionId: string, amount: number, reason: string) {
    return this.api.post(`/admin/wallet/refund`, {
      transactionId,
      amount,
      reason,
    });
  }

  // Review Management
  async getReviews(params?: {
    page?: number;
    limit?: number;
    search?: string;
    rating?: number;
    type?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.api.get('/admin/reviews', { params });
  }

  async getReviewById(reviewId: string) {
    return this.api.get(`/admin/reviews/${reviewId}`);
  }

  async deleteReview(reviewId: string, reason: string) {
    return this.api.delete(`/admin/reviews/${reviewId}`, { data: { reason } });
  }

  async updateReviewStatus(reviewId: string, status: string) {
    return this.api.put(`/admin/reviews/${reviewId}/status`, { status });
  }

  async getReviewStats() {
    return this.api.get('/admin/reviews/stats');
  }

  async flagReview(reviewId: string, reason: string) {
    return this.api.patch(`/admin/reviews/${reviewId}/flag`, { reason });
  }

  // Analytics and Reports
  async getAnalytics(params: {
    type: 'rides' | 'deliveries' | 'revenue' | 'users';
    period: 'day' | 'week' | 'month' | 'year';
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.api.get('/admin/analytics', { params });
  }

  async exportData(params: {
    type: 'users' | 'drivers' | 'rides' | 'deliveries' | 'transactions';
    format: 'csv' | 'xlsx';
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.api.get('/admin/export', {
      params,
      responseType: 'blob',
    });
  }

  // System Management
  async getSystemStats() {
    return this.api.get('/admin/system/stats');
  }

  async clearCache() {
    return this.api.post('/admin/system/clear-cache');
  }

  // Wallet Management
  async adjustWalletBalance(params: {
    userId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
  }) {
    return this.api.post('/admin/wallet/adjust-balance', params);
  }

  async getUserWallets() {
    return this.api.get('/admin/wallets');
  }

  // Vehicle Type Management
  async getVehicleTypes() {
    return this.api.get('/admin/vehicle-types');
  }

  async createVehicleType(vehicleTypeData: any) {
    return this.api.post('/admin/vehicle-types', vehicleTypeData);
  }

  async updateVehicleType(id: string, vehicleTypeData: any) {
    return this.api.put(`/admin/vehicle-types/${id}`, vehicleTypeData);
  }

  async deleteVehicleType(id: string) {
    return this.api.delete(`/admin/vehicle-types/${id}`);
  }

  // Settings
  async getSettings() {
    return this.api.get('/admin/settings');
  }

  async getPricingSettings() {
    return this.api.get('/admin/settings/pricing');
  }

  async getNotificationSettings() {
    return this.api.get('/admin/settings/notifications');
  }

  async getAppSettings() {
    return this.api.get('/admin/settings/app');
  }

  async updateSettings(settings: Record<string, any>) {
    return this.api.put('/admin/settings', settings);
  }

  async updatePricingSettings(pricingData: any) {
    return this.api.put('/admin/settings/pricing', pricingData);
  }

  async updateNotificationSettings(notificationData: any) {
    return this.api.put('/admin/settings/notifications', notificationData);
  }

  async updateAppSettings(appData: any) {
    return this.api.put('/admin/settings/app', appData);
  }

  // System Health
  async getSystemHealth() {
    return this.api.get('/admin/system/health');
  }

  async getLogs(params?: {
    level?: string;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.api.get('/admin/system/logs', { params });
  }
}

// Create and export singleton instance
export const adminApi = new AdminApiService();

// Export types
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}