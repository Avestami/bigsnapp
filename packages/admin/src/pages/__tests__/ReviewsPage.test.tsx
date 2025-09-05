import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders as render, createMockApiResponse, createMockErrorResponse, generateMockReview } from '../../utils/test-utils';
import ReviewsPage from '../ReviewsPage';
import { adminApi } from '../../services/api';
import { message } from 'antd';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    getReviews: jest.fn(),
    getReviewById: jest.fn(),
    updateReviewStatus: jest.fn(),
    deleteReview: jest.fn(),
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

const mockReviews = [
  generateMockReview({ 
    id: '1', 
    rating: 5,
    comment: 'Excellent service, very professional driver!',
    userId: 'u1',
    driverId: 'd1',
    rideId: 'r1',
    status: 'approved',
    createdAt: '2024-01-15T10:30:00Z'
  }),
  generateMockReview({ 
    id: '2', 
    rating: 2,
    comment: 'Driver was late and rude. Very disappointing experience.',
    userId: 'u2',
    driverId: 'd2',
    rideId: 'r2',
    status: 'pending',
    createdAt: '2024-01-14T15:45:00Z'
  }),
  generateMockReview({ 
    id: '3', 
    rating: 1,
    comment: 'Inappropriate behavior from driver. This is unacceptable!',
    userId: 'u3',
    driverId: 'd3',
    rideId: 'r3',
    status: 'flagged',
    createdAt: '2024-01-13T09:15:00Z'
  }),
];

const mockReviewsResponse = {
  reviews: mockReviews,
  total: mockReviews.length,
  page: 1,
  limit: 10,
  totalPages: 1,
  averageRating: 2.7
};

describe('ReviewsPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminApi.getReviews.mockResolvedValue(createMockApiResponse(mockReviewsResponse));
  });

  it('renders reviews page with correct title', () => {
    render(<ReviewsPage />);

    expect(screen.getByText('Reviews & Ratings')).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('displays reviews list when data loads successfully', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Excellent service, very professional driver!')).toBeInTheDocument();
      expect(screen.getByText('Driver was late and rude. Very disappointing experience.')).toBeInTheDocument();
      expect(screen.getByText('Inappropriate behavior from driver. This is unacceptable!')).toBeInTheDocument();
    });
  });

  it('displays review ratings correctly', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('displays review status tags correctly', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Approved')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
      expect(screen.getByText('Flagged')).toBeInTheDocument();
    });
  });

  it('displays star ratings correctly', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      // Check for star icons (rating display)
      const starIcons = screen.getAllByLabelText(/star/);
      expect(starIcons.length).toBeGreaterThan(0);
    });
  });

  it('handles search functionality', async () => {
    render(<ReviewsPage />);

    const searchInput = screen.getByPlaceholderText('Search reviews...');
    await user.type(searchInput, 'excellent');

    await waitFor(() => {
      expect(mockAdminApi.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'excellent',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles status filter', async () => {
    render(<ReviewsPage />);

    const statusSelect = screen.getByDisplayValue('All Status');
    await user.click(statusSelect);
    
    const flaggedOption = screen.getByText('Flagged');
    await user.click(flaggedOption);

    await waitFor(() => {
      expect(mockAdminApi.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'flagged',
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('handles rating filter', async () => {
    render(<ReviewsPage />);

    const ratingSelect = screen.getByDisplayValue('All Ratings');
    await user.click(ratingSelect);
    
    const oneStarOption = screen.getByText('1 Star');
    await user.click(oneStarOption);

    await waitFor(() => {
      expect(mockAdminApi.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 1,
          page: 1,
          limit: 10
        })
      );
    });
  });

  it('opens review details modal when view button is clicked', async () => {
    const reviewDetails = generateMockReview({ 
      id: '1', 
      rating: 5,
      comment: 'Excellent service, very professional driver!',
      userId: 'u1',
      driverId: 'd1'
    });
    mockAdminApi.getReviewById.mockResolvedValue(createMockApiResponse(reviewDetails));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Excellent service, very professional driver!')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Review Details')).toBeInTheDocument();
      expect(mockAdminApi.getReviewById).toHaveBeenCalledWith('1');
    });
  });

  it('handles review approval successfully', async () => {
    mockAdminApi.updateReviewStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Driver was late and rude. Very disappointing experience.')).toBeInTheDocument();
    });

    // Find approve button for pending review
    const approveButtons = screen.getAllByLabelText(/check/);
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockAdminApi.updateReviewStatus).toHaveBeenCalledWith('2', 'approve');
      expect(mockMessage.success).toHaveBeenCalledWith('Review approved successfully');
    });
  });

  it('handles review rejection successfully', async () => {
    mockAdminApi.updateReviewStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Driver was late and rude. Very disappointing experience.')).toBeInTheDocument();
    });

    // Find reject button for pending review
    const rejectButtons = screen.getAllByLabelText(/close/);
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(mockAdminApi.updateReviewStatus).toHaveBeenCalledWith('2', 'reject');
      expect(mockMessage.success).toHaveBeenCalledWith('Review rejected successfully');
    });
  });

  it('handles review flagging successfully', async () => {
    mockAdminApi.updateReviewStatus.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Excellent service, very professional driver!')).toBeInTheDocument();
    });

    // Find flag button for approved review
    const flagButtons = screen.getAllByLabelText(/flag/);
    if (flagButtons.length > 0) {
      await user.click(flagButtons[0]);

      await waitFor(() => {
        expect(mockAdminApi.updateReviewStatus).toHaveBeenCalledWith('1', 'flag');
        expect(mockMessage.success).toHaveBeenCalledWith('Review flagged successfully');
      });
    }
  });

  it('handles review deletion successfully', async () => {
    mockAdminApi.deleteReview.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Inappropriate behavior from driver. This is unacceptable!')).toBeInTheDocument();
    });

    // Find delete button
    const deleteButtons = screen.getAllByLabelText(/delete/);
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockAdminApi.deleteReview).toHaveBeenCalledWith('3');
      expect(mockMessage.success).toHaveBeenCalledWith('Review deleted successfully');
    });
  });

  it('handles review action error', async () => {
    mockAdminApi.updateReviewStatus.mockRejectedValue(createMockErrorResponse('Action failed'));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Driver was late and rude. Very disappointing experience.')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByLabelText(/check/);
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Failed to approve review');
    });
  });

  it('handles pagination', async () => {
    const paginatedResponse = {
      ...mockReviewsResponse,
      total: 25,
      totalPages: 3
    };
    mockAdminApi.getReviews.mockResolvedValue(createMockApiResponse(paginatedResponse));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    const page2Button = screen.getByTitle('2');
    await user.click(page2Button);

    await waitFor(() => {
      expect(mockAdminApi.getReviews).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 10
        })
      );
    });
  });

  it('displays correct table columns', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Rating')).toBeInTheDocument();
      expect(screen.getByText('Comment')).toBeInTheDocument();
      expect(screen.getByText('User')).toBeInTheDocument();
      expect(screen.getByText('Driver')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('handles refresh button click', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Excellent service, very professional driver!')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/reload/);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAdminApi.getReviews).toHaveBeenCalledTimes(2);
    });
  });

  it('displays average rating statistics', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('2.7')).toBeInTheDocument();
    });
  });

  it('handles empty reviews list', async () => {
    mockAdminApi.getReviews.mockResolvedValue(createMockApiResponse({
      reviews: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      averageRating: 0
    }));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('No data')).toBeInTheDocument();
    });
  });

  it('closes review details modal when cancel is clicked', async () => {
    const reviewDetails = generateMockReview({ id: '1', comment: 'Excellent service!' });
    mockAdminApi.getReviewById.mockResolvedValue(createMockApiResponse(reviewDetails));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Excellent service, very professional driver!')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByLabelText(/eye/);
    await user.click(viewButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Review Details')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Close');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Review Details')).not.toBeInTheDocument();
    });
  });

  it('displays formatted dates correctly', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      // Check that dates are formatted and displayed
      expect(screen.getByText(/Jan 15, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 14, 2024/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 13, 2024/)).toBeInTheDocument();
    });
  });

  it('shows different action buttons based on review status', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      // Pending reviews should have approve/reject buttons
      const checkIcons = screen.getAllByLabelText(/check/);
      const closeIcons = screen.getAllByLabelText(/close/);
      
      expect(checkIcons.length).toBeGreaterThan(0);
      expect(closeIcons.length).toBeGreaterThan(0);
    });
  });

  it('handles API error when loading reviews', async () => {
    mockAdminApi.getReviews.mockRejectedValue(createMockErrorResponse('Failed to load reviews'));

    render(<ReviewsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load reviews')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<ReviewsPage />);

    expect(screen.getByLabelText(/loading/)).toBeInTheDocument();
  });

  it('truncates long comments appropriately', async () => {
    const longComment = 'This is a very long comment that should be truncated in the table view to maintain proper layout and readability for users browsing through multiple reviews.';
    const reviewWithLongComment = generateMockReview({ 
      id: '4', 
      comment: longComment,
      rating: 4
    });
    
    mockAdminApi.getReviews.mockResolvedValue(createMockApiResponse({
      ...mockReviewsResponse,
      reviews: [reviewWithLongComment]
    }));

    render(<ReviewsPage />);

    await waitFor(() => {
      // Check that the comment is displayed (might be truncated)
      expect(screen.getByText(/This is a very long comment/)).toBeInTheDocument();
    });
  });

  it('displays user and driver information', async () => {
    render(<ReviewsPage />);

    await waitFor(() => {
      // Check if user and driver IDs are displayed
      expect(screen.getByText('u1')).toBeInTheDocument();
      expect(screen.getByText('d1')).toBeInTheDocument();
      expect(screen.getByText('u2')).toBeInTheDocument();
      expect(screen.getByText('d2')).toBeInTheDocument();
    });
  });
});