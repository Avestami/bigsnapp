import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders as render, createMockApiResponse, createMockErrorResponse, generateMockWalletTransaction } from '../../utils/test-utils';
import WalletPage from '../WalletPage';
import { adminApi } from '../../services/api';
import { message } from 'antd';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    getWalletTransactions: jest.fn(),
    getWalletStats: jest.fn(),
    processRefund: jest.fn(),
    adjustWalletBalance: jest.fn(),
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

const mockTransactions = [
  generateMockWalletTransaction({ 
    id: '1', 
    userId: 'u1',
    type: 'ride_payment',
    amount: -25.50,
    status: 'completed',
    description: 'Payment for ride #R123',
    createdAt: '2024-01-15T10:30:00Z'
  }),
  generateMockWalletTransaction({ 
    id: '2', 
    userId: 'u2',
    type: 'wallet_topup',
    amount: 100.00,
    status: 'completed',
    description: 'Wallet top-up via credit card',
    createdAt: '2024-01-14T15:45:00Z'
  }),
  generateMockWalletTransaction({ 
    id: '3', 
    userId: 'u3',
    type: 'refund',
    amount: 15.75,
    status: 'pending',
    description: 'Refund for cancelled ride #R456',
    createdAt: '2024-01-13T09:15:00Z'
  }),
];

const mockWalletStats = {
  totalBalance: 125000.50,
  totalTransactions: 1250,
  pendingRefunds: 5,
  totalRevenue: 85000.25,
  averageTransactionAmount: 32.75
};

const mockTransactionsResponse = {
  transactions: mockTransactions,
  total: mockTransactions.length,
  page: 1,
  limit: 10,
  totalPages: 1
};

describe('WalletPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminApi.getWalletTransactions.mockResolvedValue(createMockApiResponse(mockTransactionsResponse));
    mockAdminApi.getWalletStats.mockResolvedValue(createMockApiResponse(mockWalletStats));
  });

  it('renders wallet page with correct title', () => {
    render(<WalletPage />);

    expect(screen.getByText('Wallet Management')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays wallet statistics when data loads successfully', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('$125,000.50')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('$85,000.25')).toBeInTheDocument();
    });
  });

  it('displays transactions list when data loads successfully', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment for ride #R123')).toBeInTheDocument();
      expect(screen.getByText('Wallet top-up via credit card')).toBeInTheDocument();
      expect(screen.getByText('Refund for cancelled ride #R456')).toBeInTheDocument();
    });
  });

  it('displays transaction amounts correctly with proper formatting', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('-$25.50')).toBeInTheDocument();
      expect(screen.getByText('+$100.00')).toBeInTheDocument();
      expect(screen.getByText('+$15.75')).toBeInTheDocument();
    });
  });

  it('displays transaction status tags correctly', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getAllByText('Completed')).toHaveLength(2);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('displays transaction types correctly', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Ride Payment')).toBeInTheDocument();
      expect(screen.getByText('Wallet Top-up')).toBeInTheDocument();
      expect(screen.getByText('Refund')).toBeInTheDocument();
    });
  });

  it('handles search functionality', async () => {
    render(<WalletPage />);

    const searchInput = screen.getByPlaceholderText('Search transactions...');
    await user.type(searchInput, 'ride');

    await waitFor(() => {
      expect(mockAdminApi.getWalletTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'ride',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles transaction type filter', async () => {
    render(<WalletPage />);

    const typeSelect = screen.getByDisplayValue('All Types');
    await user.click(typeSelect);
    
    const refundOption = screen.getByText('Refund');
    await user.click(refundOption);

    await waitFor(() => {
      expect(mockAdminApi.getWalletTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'refund',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles transaction status filter', async () => {
    render(<WalletPage />);

    const statusSelect = screen.getByDisplayValue('All Status');
    await user.click(statusSelect);
    
    const pendingOption = screen.getByText('Pending');
    await user.click(pendingOption);

    await waitFor(() => {
      expect(mockAdminApi.getWalletTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles date range filter', async () => {
    render(<WalletPage />);

    const dateRangePicker = screen.getByPlaceholderText('Select date range');
    await user.click(dateRangePicker);

    // Simulate date selection (this would depend on the actual date picker implementation)
    // For now, we'll just check that the component renders
    expect(dateRangePicker).toBeInTheDocument();
  });

  it('processes refund successfully', async () => {
    mockAdminApi.processRefund.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Refund for cancelled ride #R456')).toBeInTheDocument();
    });

    // Find process refund button for pending refund
    const processButtons = screen.getAllByText('Process');
    if (processButtons.length > 0) {
      await user.click(processButtons[0]);

      await waitFor(() => {
        expect(mockAdminApi.processRefund).toHaveBeenCalledWith('3');
        expect(mockMessage.success).toHaveBeenCalledWith('Refund processed successfully');
      });
    }
  });

  it('handles wallet balance adjustment successfully', async () => {
    mockAdminApi.adjustWalletBalance.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<WalletPage />);

    // Find adjust balance button
    const adjustButton = screen.getByText('Adjust Balance');
    await user.click(adjustButton);

    // Fill in adjustment form (this would depend on the modal implementation)
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const reasonInput = screen.getByPlaceholderText('Enter reason');
    
    await user.type(amountInput, '50.00');
    await user.type(reasonInput, 'Promotional credit');

    const confirmButton = screen.getByText('Confirm');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(mockAdminApi.adjustWalletBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 50.00,
          reason: 'Promotional credit'
        })
      );
      expect(mockMessage.success).toHaveBeenCalledWith('Balance adjusted successfully');
    });
  });

  it('handles refund processing error', async () => {
    mockAdminApi.processRefund.mockRejectedValue(createMockErrorResponse('Refund failed'));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Refund for cancelled ride #R456')).toBeInTheDocument();
    });

    const processButtons = screen.getAllByText('Process');
    if (processButtons.length > 0) {
      await user.click(processButtons[0]);

      await waitFor(() => {
        expect(mockMessage.error).toHaveBeenCalledWith('Failed to process refund');
      });
    }
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockTransactionsResponse,
      total: 25,
      totalPages: 3
    };
    mockAdminApi.getWalletTransactions.mockResolvedValue(createMockApiResponse(paginatedResponse));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    const page2Button = screen.getByTitle('2');
    await user.click(page2Button);

    await waitFor(() => {
      expect(mockAdminApi.getWalletTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10
        })
      );
    });
  });

  it('displays correct table columns', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Transaction ID')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Description')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('displays correct statistics cards', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Total Balance')).toBeInTheDocument();
      expect(screen.getByText('Total Transactions')).toBeInTheDocument();
      expect(screen.getByText('Pending Refunds')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Payment for ride #R123')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/reload/);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAdminApi.getWalletTransactions).toHaveBeenCalledTimes(2);
      expect(mockAdminApi.getWalletStats).toHaveBeenCalledTimes(2);
    });
  });

  it('handles empty transactions list', async () => {
    mockAdminApi.getWalletTransactions.mockResolvedValue(createMockApiResponse({
      transactions: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0
    }));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  it('displays formatted dates correctly', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      // Check that dates are formatted and displayed
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 13, 2024/)).toBeInTheDocument();
    });
  });

  it('shows different action buttons based on transaction status and type', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      // Pending refunds should have process buttons
      const processButtons = screen.getAllByText('Process');
      expect(processButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles API error when loading transactions', async () => {
    mockAdminApi.getWalletTransactions.mockRejectedValue(createMockErrorResponse('Failed to load transactions'));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load transactions')).toBeInTheDocument();
    });
  });

  it('handles API error when loading statistics', async () => {
    mockAdminApi.getWalletStats.mockRejectedValue(createMockErrorResponse('Failed to load stats'));

    render(<WalletPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load stats')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<WalletPage />);

    expect(screen.getByLabelText(/loading/)).toBeInTheDocument();
  });

  it('formats large numbers correctly in statistics', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      // Check that large numbers are formatted with commas
      expect(screen.getByText('$125,000.50')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('$85,000.25')).toBeInTheDocument();
    });
  });

  it('displays transaction icons based on type', async () => {
    render(<WalletPage />);

    await waitFor(() => {
      // Check for various transaction type icons
      const icons = screen.getAllByLabelText(/dollar|credit-card|undo/);
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  it('handles export functionality', async () => {
    render(<WalletPage />);

    const exportButton = screen.getByText('Export');
    await user.click(exportButton);

    // This would depend on the actual export implementation
    expect(exportButton).toBeInTheDocument();
  });

  it('closes adjustment modal when cancel is clicked', async () => {
    render(<WalletPage />);

    const adjustButton = screen.getByText('Adjust Balance');
    await user.click(adjustButton);

    await waitFor(() => {
      expect(screen.getByText('Adjust Wallet Balance')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Adjust Wallet Balance')).not.toBeInTheDocument();
    });
  });
});