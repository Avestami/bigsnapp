import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders as render, createMockApiResponse, createMockErrorResponse } from '../../utils/test-utils';
import DashboardPage from '../DashboardPage';
import { adminApi } from '../../services/api';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    getDashboardStats: jest.fn(),
    getRecentActivity: jest.fn(),
  },
}));

const mockAdminApi = adminApi as jest.Mocked<typeof adminApi>;

const mockStats = {
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

const mockActivity = [
  {
    id: '1',
    type: 'ride' as const,
    title: 'New ride completed',
    description: 'Ride #1234 completed successfully',
    timestamp: '2023-01-01T12:00:00.000Z',
    status: 'success' as const
  },
  {
    id: '2',
    type: 'user' as const,
    title: 'New user registered',
    description: 'John Doe joined the platform',
    timestamp: '2023-01-01T11:30:00.000Z',
    status: 'success' as const
  }
];

describe('DashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with loading state initially', () => {
    mockAdminApi.getDashboardStats.mockReturnValue(new Promise(() => {}));
    mockAdminApi.getRecentActivity.mockReturnValue(new Promise(() => {}));

    render(<DashboardPage />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('displays dashboard statistics when data loads successfully', async () => {
    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Total Users
      expect(screen.getByText('85')).toBeInTheDocument(); // Total Drivers
      expect(screen.getByText('3,420')).toBeInTheDocument(); // Total Rides
      expect(screen.getByText('1,890')).toBeInTheDocument(); // Total Deliveries
      expect(screen.getByText('$125,000')).toBeInTheDocument(); // Total Revenue
    });
  });

  it('displays active statistics correctly', async () => {
    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('12')).toBeInTheDocument(); // Active Rides
      expect(screen.getByText('8')).toBeInTheDocument(); // Active Deliveries
      expect(screen.getByText('3')).toBeInTheDocument(); // Pending Approvals
    });
  });

  it('displays growth percentages with correct indicators', async () => {
    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('15.2%')).toBeInTheDocument(); // User Growth
      expect(screen.getByText('8.7%')).toBeInTheDocument(); // Revenue Growth
    });

    // Check for growth indicators (up arrows)
    const upArrows = screen.getAllByLabelText(/arrow-up/);
    expect(upArrows).toHaveLength(2);
  });

  it('displays recent activity list', async () => {
    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('New ride completed')).toBeInTheDocument();
      expect(screen.getByText('Ride #1234 completed successfully')).toBeInTheDocument();
      expect(screen.getByText('New user registered')).toBeInTheDocument();
      expect(screen.getByText('John Doe joined the platform')).toBeInTheDocument();
    });
  });

  it('displays activity status tags correctly', async () => {
    const activityWithDifferentStatuses = [
      { ...mockActivity[0], status: 'success' as const },
      { ...mockActivity[1], status: 'pending' as const, id: '3' },
      { ...mockActivity[1], status: 'error' as const, id: '4' }
    ];

    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(activityWithDifferentStatuses));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockAdminApi.getDashboardStats.mockRejectedValue(createMockErrorResponse('Failed to fetch stats'));
    mockAdminApi.getRecentActivity.mockRejectedValue(createMockErrorResponse('Failed to fetch activity'));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        'Failed to fetch dashboard data:',
        expect.any(Object)
      );
    });

    consoleError.mockRestore();
  });

  it('displays refresh button and handles refresh action', async () => {
    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/reload/)).toBeInTheDocument();
    });

    // Click refresh button
    const refreshButton = screen.getByLabelText(/reload/);
    refreshButton.click();

    // Verify API calls were made again
    await waitFor(() => {
      expect(mockAdminApi.getDashboardStats).toHaveBeenCalledTimes(2);
      expect(mockAdminApi.getRecentActivity).toHaveBeenCalledTimes(2);
    });
  });

  it('displays correct card titles and icons', async () => {
    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Total Drivers')).toBeInTheDocument();
      expect(screen.getByText('Total Rides')).toBeInTheDocument();
      expect(screen.getByText('Total Deliveries')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Rides')).toBeInTheDocument();
      expect(screen.getByText('Active Deliveries')).toBeInTheDocument();
      expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    });

    // Check for icons
    expect(screen.getByLabelText(/user/)).toBeInTheDocument();
    expect(screen.getByLabelText(/car/)).toBeInTheDocument();
    expect(screen.getByLabelText(/rocket/)).toBeInTheDocument();
    expect(screen.getByLabelText(/send/)).toBeInTheDocument();
    expect(screen.getByLabelText(/wallet/)).toBeInTheDocument();
  });

  it('formats numbers correctly', async () => {
    const statsWithLargeNumbers = {
      ...mockStats,
      totalUsers: 1234567,
      totalRevenue: 9876543.21
    };

    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(statsWithLargeNumbers));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('1,234,567')).toBeInTheDocument();
      expect(screen.getByText('$9,876,543')).toBeInTheDocument();
    });
  });

  it('displays recent activity section title', async () => {
    mockAdminApi.getDashboardStats.mockResolvedValue(createMockApiResponse(mockStats));
    mockAdminApi.getRecentActivity.mockResolvedValue(createMockApiResponse(mockActivity));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });
});