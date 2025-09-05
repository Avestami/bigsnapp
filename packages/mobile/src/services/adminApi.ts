import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/api';

// Debug logging utility for API service
const apiDebugLog = (method: string, endpoint: string, message?: string, data?: any) => {
  const logMessage = message ? `${endpoint} - ${message}` : endpoint;
  console.log(`🌐 [AdminAPI::${method}] ${logMessage}`, data ? JSON.stringify(data, null, 2) : '');
};

const apiErrorLog = (method: string, endpoint: string, error: any, response?: Response) => {
  console.error(`❌ [AdminAPI::${method}] ${endpoint} ERROR:`, error);
  if (response) {
    console.error(`❌ [AdminAPI::${method}] Response Status:`, response.status);
    console.error(`❌ [AdminAPI::${method}] Response StatusText:`, response.statusText);
  }
  if (error?.message) {
    console.error(`❌ [AdminAPI::${method}] Error Message:`, error.message);
  }
  console.error(`❌ [AdminAPI::${method}] Full Error:`, error);
};

// Types for API responses
export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  userType: 'RIDER' | 'DRIVER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: number;
  userId: number;
  driverId?: number;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  pickupAddress: string;
  destinationAddress: string;
  estimatedFare: number;
  actualFare?: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  driver?: User;
}

export interface Analytics {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeDrivers: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

export interface Settings {
  id: number;
  key: string;
  value: string;
  description: string;
  category: string;
  updatedAt: string;
}

class AdminApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL || 'http://localhost:3000/api/v1';
    apiDebugLog('Constructor', 'AdminApiService initialized', undefined, { baseUrl: this.baseUrl });
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    apiDebugLog('Auth', 'Getting auth headers');
    const token = await AsyncStorage.getItem('auth_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    apiDebugLog('Auth', 'Auth headers prepared', undefined, { 
      hasToken: !!token, 
      tokenLength: token?.length || 0,
      headers: { ...headers, Authorization: token ? '[REDACTED]' : undefined }
    });
    return headers;
  }

  private async handleResponse<T>(response: Response, endpoint: string): Promise<T> {
    apiDebugLog('Response', `Handling response for ${endpoint}`, undefined, {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });
    
    if (!response.ok) {
      apiErrorLog('Response', endpoint, `HTTP ${response.status}`, response);
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      apiErrorLog('Response', endpoint, 'Error data received', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const result = await response.json();
    apiDebugLog('Response', `Success response for ${endpoint}`, undefined, {
      hasSuccess: 'success' in result,
      success: result.success,
      hasData: 'data' in result,
      dataType: typeof result.data
    });
    
    // Backend returns {success: boolean, data: T} structure
    if (result.success && result.data !== undefined) {
      return result.data;
    }
    return result;
  }

  // User Management APIs
  async getUsers(page = 1, limit = 20, search?: string, userType?: string): Promise<{ users: User[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(userType && { userType }),
    });

    const endpoint = `/admin/users?${params}`;
    apiDebugLog('GET', endpoint, 'Fetching users', { page, limit, search, userType });
    
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.baseUrl}${endpoint}`;
      
      apiDebugLog('GET', endpoint, 'Making request', { url, headers: { ...headers, Authorization: '[REDACTED]' } });
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      const result = await this.handleResponse<{ users: User[]; total: number; page: number; totalPages: number }>(response, endpoint);
      apiDebugLog('GET', endpoint, 'Success result', {
        usersCount: result.users?.length || 0,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
      
      return result;
    } catch (error) {
      apiErrorLog('GET', endpoint, error);
      throw error;
    }
  }

  async updateUserStatus(userId: number, isActive: boolean, reason?: string): Promise<User> {
    const action = isActive ? 'activate' : 'deactivate';
    const endpoint = `/auth/users/${userId}/${action}`;
    apiDebugLog('PUT', endpoint, 'Updating user', { userId, isActive, reason });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reason }),
      });

      const result = await this.handleResponse<User>(response, endpoint);
      apiDebugLog('PUT', endpoint, 'User status updated', { userId, newStatus: isActive });
      return result;
    } catch (error) {
      apiErrorLog('PUT', endpoint, error);
      throw error;
    }
  }

  async deleteUser(userId: number): Promise<{ success: boolean; message: string }> {
    const endpoint = `/admin/users/${userId}`;
    apiDebugLog('DELETE', endpoint, 'Deleting user', { userId });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      const result = await this.handleResponse<{ success: boolean; message: string }>(response, endpoint);
      apiDebugLog('DELETE', endpoint, 'User deleted', { userId, success: result.success });
      return result;
    } catch (error) {
      apiErrorLog('DELETE', endpoint, error);
      throw error;
    }
  }

  async promoteToDriver(userId: number, licenseNumber: string): Promise<User> {
    const endpoint = `/admin/users/${userId}/status`;
    apiDebugLog('PUT', endpoint, 'Promoting user to driver', { userId, licenseNumber });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ userType: 'DRIVER', licenseNumber }),
      });

      const result = await this.handleResponse<{ success: boolean; data: User }>(response, endpoint);
      apiDebugLog('PUT', endpoint, 'User promoted to driver', { userId, newUserType: result.data.userType });
      return result.data;
    } catch (error) {
      apiErrorLog('PUT', endpoint, error);
      throw error;
    }
  }

  // Order Management APIs
  async getOrders(page = 1, limit = 20, status?: string, search?: string): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
      ...(search && { search }),
    });

    const endpoint = `/admin/orders?${params}`;
    apiDebugLog('GET', endpoint, 'Fetching orders', { page, limit, status, search });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const result = await this.handleResponse<{ orders: Order[]; total: number; page: number; totalPages: number }>(response, endpoint);
      apiDebugLog('GET', endpoint, 'Success result', {
        ordersCount: result.orders?.length || 0,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages
      });
      
      return result;
    } catch (error) {
      apiErrorLog('GET', endpoint, error);
      throw error;
    }
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const endpoint = `/admin/orders/${orderId}/status`;
    apiDebugLog('PUT', endpoint, 'Updating order status', { orderId, status });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status }),
      });

      const result = await this.handleResponse<Order>(response, endpoint);
      apiDebugLog('PUT', endpoint, 'Order status updated', { orderId, newStatus: status });
      return result;
    } catch (error) {
      apiErrorLog('PUT', endpoint, error);
      throw error;
    }
  }

  async assignDriver(orderId: number, driverId: number): Promise<Order> {
    const endpoint = `/admin/orders/${orderId}/assign`;
    apiDebugLog('PUT', endpoint, 'Assigning driver', { orderId, driverId });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ driverId }),
      });

      const result = await this.handleResponse<Order>(response, endpoint);
      apiDebugLog('PUT', endpoint, 'Driver assigned', { orderId, driverId });
      return result;
    } catch (error) {
      apiErrorLog('PUT', endpoint, error);
      throw error;
    }
  }

  // Analytics APIs
  async getAnalytics(startDate?: string, endDate?: string): Promise<Analytics> {
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const endpoint = `/admin/analytics?${params}`;
    apiDebugLog('GET', endpoint, 'Fetching analytics', { startDate, endDate });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const result = await this.handleResponse<Analytics>(response, endpoint);
      apiDebugLog('GET', endpoint, 'Analytics retrieved', {
        totalUsers: result.totalUsers,
        totalOrders: result.totalOrders,
        totalRevenue: result.totalRevenue,
        activeDrivers: result.activeDrivers
      });
      return result;
    } catch (error) {
      apiErrorLog('GET', endpoint, error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<{
    totalUsers: number;
    totalOrders: number;
    totalRevenue: number;
    activeDrivers: number;
  }> {
    const endpoint = '/admin/dashboard';
    apiDebugLog('GET', endpoint);
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const result = await this.handleResponse<{
        totalUsers: number;
        totalOrders: number;
        totalRevenue: number;
        activeDrivers: number;
      }>(response, endpoint);
      
      apiDebugLog('GET', endpoint, 'Dashboard stats retrieved', result);
      return result;
    } catch (error) {
      apiErrorLog('GET', endpoint, error);
      throw error;
    }
  }

  // Settings APIs
  async getSettings(): Promise<Settings[]> {
    const endpoint = '/admin/settings';
    apiDebugLog('GET', endpoint);
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers,
      });

      const result = await this.handleResponse<Settings[]>(response, endpoint);
      apiDebugLog('GET', endpoint, 'Settings retrieved', { count: result.length });
      return result;
    } catch (error) {
      apiErrorLog('GET', endpoint, error);
      throw error;
    }
  }

  async updateSetting(key: string, value: string): Promise<Settings> {
    const endpoint = `/admin/settings/${key}`;
    apiDebugLog('PUT', endpoint, 'Updating setting', { key, value });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ value }),
      });

      const result = await this.handleResponse<Settings>(response, endpoint);
      apiDebugLog('PUT', endpoint, 'Setting updated', { key, newValue: value });
      return result;
    } catch (error) {
      apiErrorLog('PUT', endpoint, error);
      throw error;
    }
  }

  async createSetting(key: string, value: string, description: string, category: string): Promise<Settings> {
    const endpoint = '/admin/settings';
    apiDebugLog('POST', endpoint, 'Creating setting', { key, value, description, category });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ key, value, description, category }),
      });

      const result = await this.handleResponse<Settings>(response, endpoint);
      apiDebugLog('POST', endpoint, 'Setting created', { key, category });
      return result;
    } catch (error) {
      apiErrorLog('POST', endpoint, error);
      throw error;
    }
  }

  async deleteSetting(key: string): Promise<{ success: boolean; message: string }> {
    const endpoint = `/admin/settings/${key}`;
    apiDebugLog('DELETE', endpoint, 'Deleting setting', { key });
    
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers,
      });

      const result = await this.handleResponse<{ success: boolean; message: string }>(response, endpoint);
      apiDebugLog('DELETE', endpoint, 'Setting deleted', { key, success: result.success });
      return result;
    } catch (error) {
      apiErrorLog('DELETE', endpoint, error);
      throw error;
    }
  }
}

export const adminApiService = new AdminApiService();
export default adminApiService;