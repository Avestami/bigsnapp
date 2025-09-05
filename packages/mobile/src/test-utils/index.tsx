import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { configureStore } from '@reduxjs/toolkit';

// Mock store for testing
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      auth: (state = { user: null, token: null, isLoading: false }, action) => {
        switch (action.type) {
          case 'auth/setUser':
            return { ...state, user: action.payload };
          case 'auth/setToken':
            return { ...state, token: action.payload };
          case 'auth/setLoading':
            return { ...state, isLoading: action.payload };
          case 'auth/logout':
            return { user: null, token: null, isLoading: false };
          default:
            return state;
        }
      },
      ride: (state = { currentRide: null, availableRides: [], isLoading: false }, action) => {
        switch (action.type) {
          case 'ride/setCurrentRide':
            return { ...state, currentRide: action.payload };
          case 'ride/setAvailableRides':
            return { ...state, availableRides: action.payload };
          case 'ride/setLoading':
            return { ...state, isLoading: action.payload };
          default:
            return state;
        }
      },
      delivery: (state = { currentDelivery: null, availableDeliveries: [], isLoading: false }, action) => {
        switch (action.type) {
          case 'delivery/setCurrentDelivery':
            return { ...state, currentDelivery: action.payload };
          case 'delivery/setAvailableDeliveries':
            return { ...state, availableDeliveries: action.payload };
          case 'delivery/setLoading':
            return { ...state, isLoading: action.payload };
          default:
            return state;
        }
      },
      wallet: (state = { balance: 0, transactions: [], isLoading: false }, action) => {
        switch (action.type) {
          case 'wallet/setBalance':
            return { ...state, balance: action.payload };
          case 'wallet/setTransactions':
            return { ...state, transactions: action.payload };
          case 'wallet/setLoading':
            return { ...state, isLoading: action.payload };
          default:
            return state;
        }
      },
    },
    preloadedState: initialState,
  });
};

interface AllTheProvidersProps {
  children: React.ReactNode;
  initialState?: any;
}

const AllTheProviders = ({ children, initialState = {} }: AllTheProvidersProps) => {
  const store = createMockStore(initialState);
  
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </SafeAreaProvider>
    </Provider>
  );
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: any;
}

const customRender = (
  ui: ReactElement,
  { initialState, ...renderOptions }: CustomRenderOptions = {}
) => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders initialState={initialState}>{children}</AllTheProviders>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock data generators
export const mockUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+1234567890',
  role: 'RIDER' as const,
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockDriver = {
  ...mockUser,
  id: '2',
  email: 'driver@example.com',
  role: 'DRIVER' as const,
};

export const mockRide = {
  id: '1',
  riderId: '1',
  driverId: null,
  pickupLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main St, New York, NY',
  },
  dropoffLocation: {
    latitude: 40.7589,
    longitude: -73.9851,
    address: '456 Broadway, New York, NY',
  },
  vehicleType: 'STANDARD' as const,
  status: 'PENDING' as const,
  fare: 15.50,
  distance: 5.2,
  estimatedDuration: 12,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockDelivery = {
  id: '1',
  userId: '1',
  driverId: null,
  pickupLocation: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main St, New York, NY',
  },
  dropoffLocation: {
    latitude: 40.7589,
    longitude: -73.9851,
    address: '456 Broadway, New York, NY',
  },
  packageDetails: {
    description: 'Test package',
    weight: 2.5,
    dimensions: '10x10x10',
  },
  recipientName: 'Jane Doe',
  recipientPhone: '+1234567891',
  status: 'PENDING' as const,
  deliveryCode: '1234',
  fare: 12.00,
  distance: 3.8,
  estimatedDuration: 15,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockWalletTransaction = {
  id: '1',
  walletId: '1',
  type: 'CREDIT' as const,
  amount: 25.00,
  description: 'Wallet top-up',
  referenceId: 'payment_123',
  createdAt: new Date().toISOString(),
};

// Re-export everything from testing library
export * from '@testing-library/react-native';

// Override render method
export { customRender as render, createMockStore };