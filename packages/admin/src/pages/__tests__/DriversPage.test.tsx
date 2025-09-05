import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders as render, createMockApiResponse, createMockErrorResponse, generateMockDriver } from '../../utils/test-utils';
import DriversPage from '../DriversPage';
import { adminApi } from '../../services/api';
import { message } from 'antd';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    getDrivers: jest.fn(),
    getDriverById: jest.fn(),
    updateDriverStatus: jest.fn(),
  },
}));

// Mock antd message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockAdminApi = adminApi as jest.Mocked<typeof adminApi>;
const mockMessage = message as jest.Mocked<typeof message>;

const mockDrivers = [
  generateMockDriver({ 
    id: '1', 
    firstName: 'John', 
    lastName: 'Driver', 
    email: 'john.driver@test.com', 
    status: 'active',
    isOnline: true,
    rating: 4.8,
    totalRides: 150
  }),
  generateMockDriver({ 
    id: '2', 
    firstName: 'Jane', 
    lastName: 'Wheeler', 
    email: 'jane.wheeler@test.com', 
    status: 'pending',
    isOnline: false,
    rating: 4.5,
    totalRides: 89
  }),
  generateMockDriver({ 
    id: '3', 
    firstName: 'Bob', 
    lastName: 'Cabbie', 
    email: 'bob.cabbie@test.com', 
    status: 'suspended',
    isOnline: false,
    rating: 3.9,
    totalRides: 45
  }),
];

const mockDriversResponse = {
  drivers: mockDrivers,
  total: mockDrivers.length,
  page: 1,
  limit: 10,
  totalPages: 1
};

describe('DriversPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminApi.getDrivers.mockResolvedValue(createMockApiResponse(mockDriversResponse));
  });

  it('renders drivers page with correct title', () => {
    render(<DriversPage />);

    expect(screen.getByText('Drivers Management')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays drivers list when data loads successfully', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('John Driver')).toBeInTheDocument();
      expect(screen.getByText('jane.wheeler@test.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Cabbie')).toBeInTheDocument();
    });
  });

  it('displays driver status tags correctly', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  it('displays online status indicators', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getAllByText('Offline')).toHaveLength(2);
    });
  });

  it('displays driver ratings and ride counts', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('4.8')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument();
      expect(screen.getByText('89')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<DriversPage />);

    const searchInput = screen.getByPlaceholderText('Search drivers...');
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(mockAdminApi.getDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'John',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles status filter', async () => {
    render(<DriversPage />);

    const statusSelect = screen.getByDisplayValue('All Status');
    await user.click(statusSelect);
    
    const activeOption = screen.getByText('Active');
    await user.click(activeOption);

    await waitFor(() => {
      expect(mockAdminApi.getDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles online status filter', async () => {
    render(<DriversPage />);

    const onlineSelect = screen.getByDisplayValue('All Drivers');
    await user.click(onlineSelect);
    
    const onlineOption = screen.getByText('Online Only');
    await user.click(onlineOption);

    await waitFor(() => {
      expect(mockAdminApi.getDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          isOnline: true,
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('opens driver details modal when view button is clicked', async () => {
    const driverDetails = generateMockDriver({ 
      id: '1', 
      firstName: 'John', 
      lastName: 'Driver',
      licenseNumber: 'DL123456',
      vehicleId: 'v1'
    });
    mockAdminApi.getDriverById.mockResolvedValue(createMockApiResponse(driverDetails));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('John Driver')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Driver Details')).toBeInTheDocument();
      expect(mockAdminApi.getDriverById).toHaveBeenCalledWith('1');
    });
  });

  it('handles driver approval successfully', async () => {
    mockAdminApi.updateDriverStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Wheeler')).toBeInTheDocument();
    });

    // Find approve button for pending driver
    const approveButtons = screen.getAllByLabelText(/check/);
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockAdminApi.updateDriverStatus).toHaveBeenCalledWith('2', 'approve');
      expect(mockMessage.success).toHaveBeenCalledWith('Driver approved successfully');
    });
  });

  it('handles driver rejection successfully', async () => {
    mockAdminApi.updateDriverStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Wheeler')).toBeInTheDocument();
    });

    // Find reject button for pending driver
    const rejectButtons = screen.getAllByLabelText(/close/);
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(mockAdminApi.updateDriverStatus).toHaveBeenCalledWith('2', 'reject');
      expect(mockMessage.success).toHaveBeenCalledWith('Driver rejected successfully');
    });
  });

  it('handles driver suspension successfully', async () => {
    mockAdminApi.updateDriverStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('John Driver')).toBeInTheDocument();
    });

    // Find suspend button for active driver (this might be in a dropdown or separate button)
    // The exact implementation depends on the UI design
    const actionButtons = screen.getAllByText('Suspend');
    if (actionButtons.length > 0) {
      await user.click(actionButtons[0]);

      await waitFor(() => {
        expect(mockAdminApi.updateDriverStatus).toHaveBeenCalledWith('1', 'suspend');
        expect(mockMessage.success).toHaveBeenCalledWith('Driver suspended successfully');
      });
    }
  });

  it('handles driver action error', async () => {
    mockAdminApi.updateDriverStatus.mockRejectedValue(createMockErrorResponse('Action failed'));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('Jane Wheeler')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByLabelText(/check/);
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Failed to approve driver');
    });
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockDriversResponse,
      total: 25,
      totalPages: 3
    };
    mockAdminApi.getDrivers.mockResolvedValue(createMockApiResponse(paginatedResponse));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    const page2Button = screen.getByTitle('2');
    await user.click(page2Button);

    await waitFor(() => {
      expect(mockAdminApi.getDrivers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10
        })
      );
    });
  });

  it('displays correct table columns', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Total Rides')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('John Driver')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/reload/);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAdminApi.getDrivers).toHaveBeenCalledTimes(2);
    });
  });

  it('displays driver avatars or default icons', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      const avatars = screen.getAllByLabelText(/user/);
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  it('handles empty drivers list', async () => {
    mockAdminApi.getDrivers.mockResolvedValue(createMockApiResponse({
      drivers: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    }));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  it('closes driver details modal when cancel is clicked', async () => {
    const driverDetails = generateMockDriver({ id: '1', firstName: 'John', lastName: 'Driver' });
    mockAdminApi.getDriverById.mockResolvedValue(createMockApiResponse(driverDetails));

    render(<DriversPage />);

    await waitFor(() => {
      expect(screen.getByText('John Driver')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Driver Details')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Close');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Driver Details')).not.toBeInTheDocument();
    });
  });

  it('displays star ratings correctly', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      // Check for star icons (rating display)
      const starIcons = screen.getAllByLabelText(/star/);
      expect(starIcons.length).toBeGreaterThan(0);
    });
  });

  it('shows different action buttons based on driver status', async () => {
    render(<DriversPage />);

    await waitFor(() => {
      // Pending drivers should have approve/reject buttons
      const checkIcons = screen.getAllByLabelText(/check/);
      const closeIcons = screen.getAllByLabelText(/close/);
      
      expect(checkIcons.length).toBeGreaterThan(0);
      expect(closeIcons.length).toBeGreaterThan(0);
    });
  });
});