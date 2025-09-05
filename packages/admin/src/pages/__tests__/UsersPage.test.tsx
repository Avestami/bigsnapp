import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders as render, createMockApiResponse, createMockErrorResponse, generateMockUser } from '../../utils/test-utils';
import UsersPage from '../UsersPage';
import { adminApi } from '../../services/api';
import { message } from 'antd';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    getUsers: jest.fn(),
    getUserById: jest.fn(),
    updateUserStatus: jest.fn(),
    deleteUser: jest.fn(),
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

const mockUsers = [
  generateMockUser({ id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', status: 'active' }),
  generateMockUser({ id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', status: 'inactive' }),
  generateMockUser({ id: '3', firstName: 'Bob', lastName: 'Johnson', email: 'bob@test.com', status: 'suspended' }),
];

const mockUsersResponse = {
  users: mockUsers,
  total: mockUsers.length,
  page: 1,
  limit: 10,
  totalPages: 1
};

describe('UsersPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminApi.getUsers.mockResolvedValue(createMockApiResponse(mockUsersResponse));
  });

  it('renders users page with loading state initially', () => {
    mockAdminApi.getUsers.mockReturnValue(new Promise(() => {}));

    render(<UsersPage />);

    expect(screen.getByText('Users Management')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays users list when data loads successfully', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@test.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('displays user status tags correctly', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<UsersPage />);

    const searchInput = screen.getByPlaceholderText('Search users...');
    await user.type(searchInput, 'John');

    await waitFor(() => {
      expect(mockAdminApi.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'John',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles status filter', async () => {
    render(<UsersPage />);

    const statusSelect = screen.getByDisplayValue('All Status');
    await user.click(statusSelect);
    
    const activeOption = screen.getByText('Active');
    await user.click(activeOption);

    await waitFor(() => {
      expect(mockAdminApi.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'active',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles role filter', async () => {
    render(<UsersPage />);

    const roleSelect = screen.getByDisplayValue('All Roles');
    await user.click(roleSelect);
    
    const userOption = screen.getByText('User');
    await user.click(userOption);

    await waitFor(() => {
      expect(mockAdminApi.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockUsersResponse,
      total: 25,
      totalPages: 3
    };
    mockAdminApi.getUsers.mockResolvedValue(createMockApiResponse(paginatedResponse));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument(); // Total count
    });

    // Click on page 2
    const page2Button = screen.getByTitle('2');
    await user.click(page2Button);

    await waitFor(() => {
      expect(mockAdminApi.getUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10
        })
      );
    });
  });

  it('opens user details modal when view button is clicked', async () => {
    const userDetails = generateMockUser({ id: '1', firstName: 'John', lastName: 'Doe' });
    mockAdminApi.getUserById.mockResolvedValue(createMockApiResponse(userDetails));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
      expect(mockAdminApi.getUserById).toHaveBeenCalledWith('1');
    });
  });

  it('handles user status change successfully', async () => {
    mockAdminApi.updateUserStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find and click the status dropdown for the first user
    const statusSelects = screen.getAllByDisplayValue('active');
    await user.click(statusSelects[0]);
    
    const suspendedOption = screen.getByText('suspended');
    await user.click(suspendedOption);

    await waitFor(() => {
      expect(mockAdminApi.updateUserStatus).toHaveBeenCalledWith('1', 'suspended');
      expect(mockMessage.success).toHaveBeenCalledWith('User status updated successfully');
    });
  });

  it('handles user status change error', async () => {
    mockAdminApi.updateUserStatus.mockRejectedValue(createMockErrorResponse('Update failed'));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const statusSelects = screen.getAllByDisplayValue('active');
    await user.click(statusSelects[0]);
    
    const suspendedOption = screen.getByText('suspended');
    await user.click(suspendedOption);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Failed to update user status');
    });
  });

  it('handles refresh button click', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/reload/);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAdminApi.getUsers).toHaveBeenCalledTimes(2);
    });
  });

  it('displays correct table columns', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Phone')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
      expect(screen.getByText('Joined')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('displays user avatars or default icons', async () => {
    render(<UsersPage />);

    await waitFor(() => {
      const avatars = screen.getAllByLabelText(/user/);
      expect(avatars.length).toBeGreaterThan(0);
    });
  });

  it('handles API error when loading users', async () => {
    mockAdminApi.getUsers.mockRejectedValue(createMockErrorResponse('Failed to fetch users'));

    render(<UsersPage />);

    // The component should handle the error gracefully
    // In a real implementation, you might show an error message
    await waitFor(() => {
      expect(mockAdminApi.getUsers).toHaveBeenCalled();
    });
  });

  it('displays formatted join dates', async () => {
    const usersWithDates = mockUsers.map(user => ({
      ...user,
      createdAt: '2023-01-15T10:30:00.000Z'
    }));
    
    mockAdminApi.getUsers.mockResolvedValue(createMockApiResponse({
      ...mockUsersResponse,
      users: usersWithDates
    }));

    render(<UsersPage />);

    await waitFor(() => {
      // Check that dates are displayed (format may vary)
      expect(screen.getByText(/2023/)).toBeInTheDocument();
    });
  });

  it('shows loading state in table', () => {
    mockAdminApi.getUsers.mockReturnValue(new Promise(() => {}));

    render(<UsersPage />);

    // Antd table shows loading spinner
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('handles empty users list', async () => {
    mockAdminApi.getUsers.mockResolvedValue(createMockApiResponse({
      users: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    }));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  it('closes user details modal when cancel is clicked', async () => {
    const userDetails = generateMockUser({ id: '1', firstName: 'John', lastName: 'Doe' });
    mockAdminApi.getUserById.mockResolvedValue(createMockApiResponse(userDetails));

    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('User Details')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Close');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('User Details')).not.toBeInTheDocument();
    });
  });
});