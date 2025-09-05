import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { AxiosRequestHeaders } from 'axios';
import { AuthContext, AuthContextType } from '../contexts/AuthContext';

// Mock user for testing
export const mockUser = {
  id: '1',
  email: 'admin@test.com',
  firstName: 'Test',
  lastName: 'Admin',
  role: 'admin',
  createdAt: '2023-01-01T00:00:00.000Z'
};

// Mock auth context
export const mockAuthContext: AuthContextType = {
  user: mockUser,
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn()
};

// Create a custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  authContext?: Partial<AuthContextType>;
  queryClient?: QueryClient;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {},
    },
  });
}

function AllTheProviders({ 
  children, 
  authContext = mockAuthContext,
  queryClient = createTestQueryClient()
}: { 
  children: React.ReactNode;
  authContext?: AuthContextType;
  queryClient?: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ConfigProvider>
          <AuthContext.Provider value={authContext}>
            {children}
          </AuthContext.Provider>
        </ConfigProvider>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { authContext, queryClient, ...renderOptions } = options;
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders 
      authContext={{ ...mockAuthContext, ...authContext }}
      queryClient={queryClient}
    >
      {children}
    </AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Helper function to create mock API responses
export const createMockApiResponse = <T,>(data: T, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {
    headers: {} as AxiosRequestHeaders,
    method: 'get' as const,
    url: '',
  },
});

// Helper function to create mock error response
export const createMockErrorResponse = (message = 'API Error', status = 500) => ({
  response: {
    data: { message },
    status,
    statusText: 'Internal Server Error',
    headers: {},
    config: {
      headers: {} as AxiosRequestHeaders,
      method: 'get' as const,
      url: '',
    },
  },
  message,
  isAxiosError: true,
});

// Helper to wait for async operations
export const waitForLoadingToFinish = () => 
  new Promise(resolve => setTimeout(resolve, 0));

// Mock data generators
export const generateMockUser = (overrides = {}) => ({
  id: '1',
  email: 'user@test.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  status: 'active',
  role: 'user',
  avatar: null,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const generateMockDriver = (overrides = {}) => ({
  id: '1',
  email: 'driver@test.com',
  firstName: 'Jane',
  lastName: 'Smith',
  phone: '+1234567890',
  status: 'active',
  isOnline: true,
  rating: 4.8,
  totalRides: 150,
  licenseNumber: 'DL123456',
  vehicleId: 'v1',
  avatar: null,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const generateMockVehicle = (overrides = {}) => ({
  id: '1',
  make: 'Toyota',
  model: 'Camry',
  year: 2020,
  color: 'White',
  licensePlate: 'ABC123',
  type: 'sedan',
  status: 'active',
  driverId: '1',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const generateMockRide = (overrides = {}) => ({
  id: '1',
  userId: '1',
  driverId: '1',
  vehicleId: '1',
  status: 'completed',
  pickupLocation: {
    address: '123 Main St',
    latitude: 40.7128,
    longitude: -74.0060
  },
  dropoffLocation: {
    address: '456 Oak Ave',
    latitude: 40.7589,
    longitude: -73.9851
  },
  fare: 25.50,
  distance: 5.2,
  duration: 15,
  rating: 5,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const generateMockDelivery = (overrides = {}) => ({
  id: '1',
  userId: '1',
  driverId: '1',
  status: 'completed',
  pickupLocation: {
    address: '123 Main St',
    latitude: 40.7128,
    longitude: -74.0060
  },
  dropoffLocation: {
    address: '456 Oak Ave',
    latitude: 40.7589,
    longitude: -73.9851
  },
  packageDetails: {
    type: 'document',
    description: 'Important papers',
    weight: 0.5
  },
  recipientDetails: {
    name: 'John Doe',
    phone: '+1234567890'
  },
  fee: 15.00,
  distance: 3.1,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const generateMockReview = (overrides: any = {}) => ({
  id: '1',
  userId: '1',
  driverId: '1',
  rideId: '1',
  rating: 5,
  comment: 'Great service!',
  status: 'approved',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const generateMockWalletTransaction = (overrides: any = {}) => ({
  id: '1',
  userId: '1',
  type: 'credit',
  amount: 25.50,
  description: 'Ride payment',
  status: 'completed',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

export const createMockUser = (overrides: any = {}) => ({
  id: '1',
  email: 'user@test.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  status: 'active',
  role: 'user',
  avatar: null,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  ...overrides
});

// Re-export everything from React Testing Library
export * from '@testing-library/react';
// Export custom render separately to avoid conflicts
export { customRender as renderWithProviders };