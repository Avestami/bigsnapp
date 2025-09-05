import { rest } from 'msw';
import {
  generateMockUser,
  generateMockDriver,
  generateMockVehicle,
  generateMockRide,
  generateMockDelivery,
  mockUser
} from '../utils/test-utils';

const API_BASE_URL = 'http://localhost:3000/api';

// Mock data
const mockUsers = Array.from({ length: 10 }, (_, i) => 
  generateMockUser({ id: String(i + 1), email: `user${i + 1}@test.com` })
);

const mockDrivers = Array.from({ length: 5 }, (_, i) => 
  generateMockDriver({ id: String(i + 1), email: `driver${i + 1}@test.com` })
);

const mockVehicles = Array.from({ length: 5 }, (_, i) => 
  generateMockVehicle({ id: String(i + 1), driverId: String(i + 1) })
);

const mockRides = Array.from({ length: 20 }, (_, i) => 
  generateMockRide({ id: String(i + 1) })
);

const mockDeliveries = Array.from({ length: 15 }, (_, i) => 
  generateMockDelivery({ id: String(i + 1) })
);

const mockDashboardStats = {
  totalUsers: 1250,
  totalDrivers: 85,
  totalRides: 3420,
  totalDeliveries: 1890,
  totalRevenue: 125000,
  activeRides: 12,
  activeDeliveries: 8,
  pendingDriverApprovals: 3,
  userGrowth: 15.2,
  revenueGrowth: 8.7
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'ride' as const,
    title: 'New ride completed',
    description: 'Ride #1234 completed successfully',
    timestamp: new Date().toISOString(),
    status: 'success' as const
  },
  {
    id: '2',
    type: 'user' as const,
    title: 'New user registered',
    description: 'John Doe joined the platform',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    status: 'success' as const
  },
  {
    id: '3',
    type: 'driver' as const,
    title: 'Driver application pending',
    description: 'Jane Smith submitted driver application',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    status: 'pending' as const
  }
];

export const handlers = [
  // Auth endpoints
  rest.post(`${API_BASE_URL}/admin/auth/login`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          user: mockUser,
          token: 'mock-jwt-token'
        }
      })
    );
  }),

  rest.get(`${API_BASE_URL}/admin/profile`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: { user: mockUser }
      })
    );
  }),

  // Dashboard endpoints
  rest.get(`${API_BASE_URL}/admin/dashboard/stats`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockDashboardStats
      })
    );
  }),

  rest.get(`${API_BASE_URL}/admin/dashboard/activity`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: mockRecentActivity
      })
    );
  }),

  // Users endpoints
  rest.get(`${API_BASE_URL}/admin/users`, (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;
    const search = req.url.searchParams.get('search');
    const status = req.url.searchParams.get('status');

    let filteredUsers = [...mockUsers];

    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== 'all') {
      filteredUsers = filteredUsers.filter(user => user.status === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          users: paginatedUsers,
          total: filteredUsers.length,
          page,
          limit,
          totalPages: Math.ceil(filteredUsers.length / limit)
        }
      })
    );
  }),

  rest.get(`${API_BASE_URL}/admin/users/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'User not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({ success: true, data: user })
    );
  }),

  rest.patch(`${API_BASE_URL}/admin/users/:id/status`, (req, res, ctx) => {
    const { id } = req.params;
    const user = mockUsers.find(u => u.id === id);
    
    if (!user) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'User not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({ success: true, message: 'User status updated' })
    );
  }),

  // Drivers endpoints
  rest.get(`${API_BASE_URL}/admin/drivers`, (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;
    const search = req.url.searchParams.get('search');
    const status = req.url.searchParams.get('status');

    let filteredDrivers = [...mockDrivers];

    if (search) {
      filteredDrivers = filteredDrivers.filter(driver => 
        driver.firstName.toLowerCase().includes(search.toLowerCase()) ||
        driver.lastName.toLowerCase().includes(search.toLowerCase()) ||
        driver.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status && status !== 'all') {
      filteredDrivers = filteredDrivers.filter(driver => driver.status === status);
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDrivers = filteredDrivers.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          drivers: paginatedDrivers,
          total: filteredDrivers.length,
          page,
          limit,
          totalPages: Math.ceil(filteredDrivers.length / limit)
        }
      })
    );
  }),

  rest.get(`${API_BASE_URL}/admin/drivers/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const driver = mockDrivers.find(d => d.id === id);
    
    if (!driver) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'Driver not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({ success: true, data: driver })
    );
  }),

  rest.patch(`${API_BASE_URL}/admin/drivers/:id/status`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, message: 'Driver status updated' })
    );
  }),

  // Vehicles endpoints
  rest.get(`${API_BASE_URL}/admin/vehicles`, (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedVehicles = mockVehicles.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          vehicles: paginatedVehicles,
          total: mockVehicles.length,
          page,
          limit,
          totalPages: Math.ceil(mockVehicles.length / limit)
        }
      })
    );
  }),

  rest.get(`${API_BASE_URL}/admin/vehicles/:id`, (req, res, ctx) => {
    const { id } = req.params;
    const vehicle = mockVehicles.find(v => v.id === id);
    
    if (!vehicle) {
      return res(
        ctx.status(404),
        ctx.json({ success: false, message: 'Vehicle not found' })
      );
    }

    return res(
      ctx.status(200),
      ctx.json({ success: true, data: vehicle })
    );
  }),

  // Rides endpoints
  rest.get(`${API_BASE_URL}/admin/rides`, (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedRides = mockRides.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          rides: paginatedRides,
          total: mockRides.length,
          page,
          limit,
          totalPages: Math.ceil(mockRides.length / limit)
        }
      })
    );
  }),

  // Deliveries endpoints
  rest.get(`${API_BASE_URL}/admin/deliveries`, (req, res, ctx) => {
    const page = Number(req.url.searchParams.get('page')) || 1;
    const limit = Number(req.url.searchParams.get('limit')) || 10;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDeliveries = mockDeliveries.slice(startIndex, endIndex);

    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          deliveries: paginatedDeliveries,
          total: mockDeliveries.length,
          page,
          limit,
          totalPages: Math.ceil(mockDeliveries.length / limit)
        }
      })
    );
  }),

  // Settings endpoints
  rest.get(`${API_BASE_URL}/admin/settings/app`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        success: true,
        data: {
          appName: 'SnappClone',
          appVersion: '1.0.0',
          appLogo: '/logo.png',
          supportEmail: 'support@snappclone.com',
          supportPhone: '+1234567890',
          maintenanceMode: false,
          registrationEnabled: true,
          emailVerificationRequired: true,
          phoneVerificationRequired: true
        }
      })
    );
  }),

  rest.patch(`${API_BASE_URL}/admin/settings/app`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true, message: 'App settings updated' })
    );
  }),

  // Error handlers for testing error states
  rest.get(`${API_BASE_URL}/admin/error-test`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({ success: false, message: 'Internal server error' })
    );
  }),

  // Fallback handler
  rest.get('*', (req, res, ctx) => {
    console.warn(`Unhandled ${req.method} request to ${req.url}`);
    return res(
      ctx.status(404),
      ctx.json({ success: false, message: 'Not found' })
    );
  })
];