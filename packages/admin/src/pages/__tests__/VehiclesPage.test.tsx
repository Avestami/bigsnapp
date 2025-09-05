import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders as render, createMockApiResponse, createMockErrorResponse, generateMockVehicle } from '../../utils/test-utils';
import VehiclesPage from '../VehiclesPage';
import { adminApi } from '../../services/api';
import { message } from 'antd';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    getVehicles: jest.fn(),
    getVehicleById: jest.fn(),
    updateVehicleStatus: jest.fn(),
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

const mockVehicles = [
  generateMockVehicle({ 
    id: '1', 
    make: 'Toyota', 
    model: 'Camry', 
    year: 2020,
    licensePlate: 'ABC123', 
    status: 'active',
    type: 'sedan',
    driverId: 'd1'
  }),
  generateMockVehicle({ 
    id: '2', 
    make: 'Honda', 
    model: 'Civic', 
    year: 2019,
    licensePlate: 'XYZ789', 
    status: 'pending',
    type: 'hatchback',
    driverId: 'd2'
  }),
  generateMockVehicle({ 
    id: '3', 
    make: 'Ford', 
    model: 'F-150', 
    year: 2021,
    licensePlate: 'DEF456', 
    status: 'suspended',
    type: 'truck',
    driverId: 'd3'
  }),
];

const mockVehiclesResponse = {
  vehicles: mockVehicles,
  total: mockVehicles.length,
  page: 1,
  limit: 10,
  totalPages: 1
};

describe('VehiclesPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminApi.getVehicles.mockResolvedValue(createMockApiResponse(mockVehiclesResponse));
  });

  it('renders vehicles page with correct title', () => {
    render(<VehiclesPage />);

    expect(screen.getByText('Vehicles Management')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays vehicles list when data loads successfully', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      expect(screen.getByText('Ford F-150')).toBeInTheDocument();
    });
  });

  it('displays vehicle details correctly', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('ABC123')).toBeInTheDocument();
      expect(screen.getByText('XYZ789')).toBeInTheDocument();
      expect(screen.getByText('DEF456')).toBeInTheDocument();
      expect(screen.getByText('2020')).toBeInTheDocument();
      expect(screen.getByText('2019')).toBeInTheDocument();
      expect(screen.getByText('2021')).toBeInTheDocument();
    });
  });

  it('displays vehicle status tags correctly', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  it('displays vehicle types correctly', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Sedan')).toBeInTheDocument();
      expect(screen.getByText('Hatchback')).toBeInTheDocument();
      expect(screen.getByText('Truck')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<VehiclesPage />);

    const searchInput = screen.getByPlaceholderText('Search vehicles...');
    await user.type(searchInput, 'Toyota');

    await waitFor(() => {
      expect(mockAdminApi.getVehicles).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Toyota',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles status filter', async () => {
    render(<VehiclesPage />);

    const statusSelect = screen.getByDisplayValue('All Status');
    await user.click(statusSelect);
    
    const activeOption = screen.getByText('Active');
    await user.click(activeOption);

    await waitFor(() => {
      expect(mockAdminApi.getVehicles).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles vehicle type filter', async () => {
    render(<VehiclesPage />);

    const typeSelect = screen.getByDisplayValue('All Types');
    await user.click(typeSelect);
    
    const sedanOption = screen.getByText('Sedan');
    await user.click(sedanOption);

    await waitFor(() => {
      expect(mockAdminApi.getVehicles).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'sedan',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('opens vehicle details modal when view button is clicked', async () => {
    const vehicleDetails = generateMockVehicle({ 
      id: '1', 
      make: 'Toyota', 
      model: 'Camry',
      licensePlate: 'ABC123',
      vin: 'VIN123456789'
    });
    mockAdminApi.getVehicleById.mockResolvedValue(createMockApiResponse(vehicleDetails));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
      expect(mockAdminApi.getVehicleById).toHaveBeenCalledWith('1');
    });
  });

  it('handles vehicle approval successfully', async () => {
    mockAdminApi.updateVehicleStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    });

    // Find approve button for pending vehicle
    const approveButtons = screen.getAllByLabelText(/check/);
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockAdminApi.updateVehicleStatus).toHaveBeenCalledWith('2', 'approve');
      expect(mockMessage.success).toHaveBeenCalledWith('Vehicle approved successfully');
    });
  });

  it('handles vehicle rejection successfully', async () => {
    mockAdminApi.updateVehicleStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    });

    // Find reject button for pending vehicle
    const rejectButtons = screen.getAllByLabelText(/close/);
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(mockAdminApi.updateVehicleStatus).toHaveBeenCalledWith('2', 'reject');
      expect(mockMessage.success).toHaveBeenCalledWith('Vehicle rejected successfully');
    });
  });

  it('handles vehicle suspension successfully', async () => {
    mockAdminApi.updateVehicleStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    });

    // Find suspend button for active vehicle
    const actionButtons = screen.getAllByText('Suspend');
    if (actionButtons.length > 0) {
      await user.click(actionButtons[0]);

      await waitFor(() => {
        expect(mockAdminApi.updateVehicleStatus).toHaveBeenCalledWith('1', 'suspend');
        expect(mockMessage.success).toHaveBeenCalledWith('Vehicle suspended successfully');
      });
    }
  });

  it('handles vehicle action error', async () => {
    mockAdminApi.updateVehicleStatus.mockRejectedValue(createMockErrorResponse('Action failed'));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByLabelText(/check/);
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Failed to approve vehicle');
    });
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockVehiclesResponse,
      total: 25,
      totalPages: 3
    };
    mockAdminApi.getVehicles.mockResolvedValue(createMockApiResponse(paginatedResponse));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    const page2Button = screen.getByTitle('2');
    await user.click(page2Button);

    await waitFor(() => {
      expect(mockAdminApi.getVehicles).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10
        })
      );
    });
  });

  it('displays correct table columns', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Vehicle')).toBeInTheDocument();
      expect(screen.getByText('License Plate')).toBeInTheDocument();
      expect(screen.getByText('Year')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Driver')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/reload/);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAdminApi.getVehicles).toHaveBeenCalledTimes(2);
    });
  });

  it('displays vehicle icons based on type', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      const carIcons = screen.getAllByLabelText(/car/);
      expect(carIcons.length).toBeGreaterThan(0);
    });
  });

  it('handles empty vehicles list', async () => {
    mockAdminApi.getVehicles.mockResolvedValue(createMockApiResponse({
      vehicles: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    }));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  it('closes vehicle details modal when cancel is clicked', async () => {
    const vehicleDetails = generateMockVehicle({ id: '1', make: 'Toyota', model: 'Camry' });
    mockAdminApi.getVehicleById.mockResolvedValue(createMockApiResponse(vehicleDetails));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Vehicle Details')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Close');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Vehicle Details')).not.toBeInTheDocument();
    });
  });

  it('displays driver information for assigned vehicles', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      // Check if driver IDs or names are displayed
      expect(screen.getByText('d1')).toBeInTheDocument();
      expect(screen.getByText('d2')).toBeInTheDocument();
      expect(screen.getByText('d3')).toBeInTheDocument();
    });
  });

  it('shows different action buttons based on vehicle status', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      // Pending vehicles should have approve/reject buttons
      const checkIcons = screen.getAllByLabelText(/check/);
      const closeIcons = screen.getAllByLabelText(/close/);
      
      expect(checkIcons.length).toBeGreaterThan(0);
      expect(closeIcons.length).toBeGreaterThan(0);
    });
  });

  it('handles API error when loading vehicles', async () => {
    mockAdminApi.getVehicles.mockRejectedValue(createMockErrorResponse('Failed to load vehicles'));

    render(<VehiclesPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load vehicles')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<VehiclesPage />);

    expect(screen.getByLabelText(/loading/)).toBeInTheDocument();
  });

  it('formats vehicle information correctly', async () => {
    render(<VehiclesPage />);

    await waitFor(() => {
      // Check that make and model are combined properly
      expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
      expect(screen.getByText('Honda Civic')).toBeInTheDocument();
      expect(screen.getByText('Ford F-150')).toBeInTheDocument();
    });
  });
});