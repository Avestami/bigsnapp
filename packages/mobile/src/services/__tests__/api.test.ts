import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../api';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  multiRemove: jest.fn(),
}));

const mockAxiosInstance: any = {
  create: jest.fn(() => mockAxiosInstance),
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        data: {
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
          user: { id: '1', email: 'test@example.com' },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.login('test@example.com', 'password123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'access_token_123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh_token_123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should register successfully', async () => {
      const mockResponse = {
        data: {
          accessToken: 'access_token_123',
          refreshToken: 'refresh_token_123',
          user: { id: '1', email: 'test@example.com' },
        },
      };

      const userData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        phone: '1234567890',
        password: 'password123',
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.register(userData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('auth_token', 'access_token_123');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('refresh_token', 'refresh_token_123');
      expect(result).toEqual(mockResponse.data);
    });

    it('should refresh token', async () => {
      const mockResponse = { data: { accessToken: 'new_access_token' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.refreshToken('refresh_token_123');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: 'refresh_token_123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should logout and clear tokens', async () => {
      mockAxiosInstance.post.mockResolvedValue({});

      await apiService.logout();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/auth/logout');
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'refresh_token']);
    });

    it('should clear tokens even if logout API fails', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await apiService.logout();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(['auth_token', 'refresh_token']);
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should check if user is authenticated', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token_123');

      const result = await apiService.isAuthenticated();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(result).toBe(true);
    });

    it('should return false if no token exists', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await apiService.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should get auth token', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('token_123');

      const result = await apiService.getAuthToken();

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('auth_token');
      expect(result).toBe('token_123');
    });
  });

  describe('Ride Management', () => {
    it('should request a ride', async () => {
      const rideData = {
        pickupLatitude: 28.6139,
        pickupLongitude: 77.2090,
        pickupAddress: 'Pickup Location',
        destinationLatitude: 28.5355,
        destinationLongitude: 77.3910,
        destinationAddress: 'Destination',
        rideType: 'ECONOMY',
        estimatedFare: 150,
      };

      const mockResponse = { data: { id: 'ride_123', status: 'REQUESTED' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.requestRide(rideData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/rides', rideData);
      expect(result).toEqual(mockResponse);
    });

    it('should get rides with status filter', async () => {
      const mockResponse = { data: [{ id: 'ride_123', status: 'ACTIVE' }] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getRides('ACTIVE');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/rides', {
        params: { status: 'ACTIVE' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get rides without status filter', async () => {
      const mockResponse = { data: [{ id: 'ride_123' }] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getRides();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/rides', { params: {} });
      expect(result).toEqual(mockResponse);
    });

    it('should get ride by ID', async () => {
      const mockResponse = { data: { id: 'ride_123', status: 'ACTIVE' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getRideById('ride_123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/rides/ride_123');
      expect(result).toEqual(mockResponse);
    });

    it('should cancel ride with reason', async () => {
      const mockResponse = { data: { id: 'ride_123', status: 'CANCELLED' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiService.cancelRide('ride_123', 'Changed plans');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/rides/ride_123/cancel', {
        reason: 'Changed plans',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should cancel ride without reason', async () => {
      const mockResponse = { data: { id: 'ride_123', status: 'CANCELLED' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiService.cancelRide('ride_123');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/rides/ride_123/cancel', {
        reason: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should complete ride', async () => {
      const mockResponse = { data: { id: 'ride_123', status: 'COMPLETED' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiService.completeRide('ride_123');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/rides/ride_123/complete');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Delivery Management', () => {
    it('should request a delivery', async () => {
      const deliveryData = {
        pickupLatitude: 28.6139,
        pickupLongitude: 77.2090,
        pickupAddress: 'Pickup Location',
        deliveryLatitude: 28.5355,
        deliveryLongitude: 77.3910,
        deliveryAddress: 'Delivery Address',
        packageType: 'DOCUMENT',
        packageDescription: 'Important documents',
        recipientName: 'John Doe',
        recipientPhone: '1234567890',
        estimatedFare: 100,
      };

      const mockResponse = { data: { id: 'delivery_123', status: 'REQUESTED' } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.requestDelivery(deliveryData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/deliveries', deliveryData);
      expect(result).toEqual(mockResponse);
    });

    it('should get deliveries', async () => {
      const mockResponse = { data: [{ id: 'delivery_123', status: 'ACTIVE' }] };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getDeliveries('ACTIVE');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/deliveries', {
        params: { status: 'ACTIVE' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should mark delivery as picked up', async () => {
      const mockResponse = { data: { id: 'delivery_123', status: 'PICKED_UP' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiService.markDeliveryPickedUp('delivery_123');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/deliveries/delivery_123/pickup');
      expect(result).toEqual(mockResponse);
    });

    it('should mark delivery as delivered', async () => {
      const mockResponse = { data: { id: 'delivery_123', status: 'DELIVERED' } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiService.markDeliveryDelivered('delivery_123');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/deliveries/delivery_123/deliver');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Wallet Operations', () => {
    it('should get wallet information', async () => {
      const mockResponse = { data: { balance: 500, currency: 'IRR' } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getWallet();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/wallet');
      expect(result).toEqual(mockResponse);
    });

    it('should get wallet transactions with filters', async () => {
      const mockResponse = { data: { transactions: [], total: 0 } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getWalletTransactions(2, 10, 'CREDIT');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/wallet/transactions', {
        params: { page: 2, limit: 10, type: 'CREDIT' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get wallet transactions with default parameters', async () => {
      const mockResponse = { data: { transactions: [], total: 0 } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getWalletTransactions();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/wallet/transactions', {
        params: { page: 1, limit: 20 },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should add money to wallet', async () => {
      const mockResponse = { data: { transactionId: 'txn_123', amount: 500 } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.addMoneyToWallet(500, 'CREDIT_CARD');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/wallet/topup', {
        amount: 500,
        paymentMethod: 'CREDIT_CARD',
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Review Management', () => {
    it('should get reviews with filters', async () => {
      const mockResponse = { data: { reviews: [], total: 0 } };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getReviews(1, 10, 'RIDE');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/reviews', {
        params: { page: 1, limit: 10, type: 'RIDE' },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should create a review', async () => {
      const reviewData = {
        rideId: 'ride_123',
        driverId: 'driver_123',
        rating: 5,
        comment: 'Great service!',
      };

      const mockResponse = { data: { id: 'review_123', ...reviewData } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.createReview(reviewData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/reviews', reviewData);
      expect(result).toEqual(mockResponse);
    });

    it('should update a review', async () => {
      const reviewData = { rating: 4, comment: 'Good service' };
      const mockResponse = { data: { id: 'review_123', ...reviewData } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiService.updateReview('review_123', reviewData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/reviews/review_123', reviewData);
      expect(result).toEqual(mockResponse);
    });

    it('should delete a review', async () => {
      const mockResponse = { data: { success: true } };
      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      const result = await apiService.deleteReview('review_123');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/reviews/review_123');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Profile Management', () => {
    it('should get user profile', async () => {
      const mockResponse = {
        data: {
          id: 'user_123',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getProfile();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/users/profile');
      expect(result).toEqual(mockResponse);
    });

    it('should update user profile', async () => {
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '9876543210',
      };

      const mockResponse = { data: { id: 'user_123', ...profileData } };
      mockAxiosInstance.patch.mockResolvedValue(mockResponse);

      const result = await apiService.updateProfile(profileData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/users/profile', profileData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Location Services', () => {
    it('should geocode address', async () => {
      const result = await apiService.geocodeAddress('New Delhi, India');

      expect(result.data).toHaveProperty('latitude');
      expect(result.data).toHaveProperty('longitude');
      expect(result.data.address).toBe('New Delhi, India');
      expect(typeof result.data.latitude).toBe('number');
      expect(typeof result.data.longitude).toBe('number');
    });

    it('should reverse geocode coordinates', async () => {
      const result = await apiService.reverseGeocode(28.6139, 77.2090);

      expect(result.data).toHaveProperty('address');
      expect(result.data.latitude).toBe(28.6139);
      expect(result.data.longitude).toBe(77.2090);
    });
  });

  describe('Utility Methods', () => {
    it('should estimate fare', async () => {
      const fareData = {
        pickupLatitude: 28.6139,
        pickupLongitude: 77.2090,
        destinationLatitude: 28.5355,
        destinationLongitude: 77.3910,
        serviceType: 'RIDE' as const,
        rideType: 'ECONOMY',
      };

      const mockResponse = { data: { estimatedFare: 150, distance: 12.5 } };
      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.estimateFare(fareData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/fare/estimate', fareData);
      expect(result).toEqual(mockResponse);
    });

    it('should get driver location', async () => {
      const mockResponse = {
        data: { latitude: 28.6139, longitude: 77.2090, heading: 45 },
      };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getDriverLocation('driver_123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/drivers/driver_123/location');
      expect(result).toEqual(mockResponse);
    });

    it('should check connection successfully', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { status: 'ok' } });

      const result = await apiService.checkConnection();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/health');
      expect(result).toBe(true);
    });

    it('should return false when connection check fails', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

      const result = await apiService.checkConnection();

      expect(result).toBe(false);
    });
  });
});