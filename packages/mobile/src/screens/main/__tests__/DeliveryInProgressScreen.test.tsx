import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import DeliveryInProgressScreen from '../DeliveryInProgressScreen';

// Mock navigation
const mockGoBack = jest.fn();
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: mockGoBack,
    navigate: mockNavigate,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock Linking
jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

// Mock fetch for API calls
global.fetch = jest.fn();

describe('DeliveryInProgressScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly with initial delivery data', () => {
    const { getByText, getByTestId } = render(<DeliveryInProgressScreen />);

    expect(getByText('Delivery Tracking')).toBeTruthy();
    expect(getByText('DEL123456')).toBeTruthy();
    expect(getByText('Package assigned to delivery partner')).toBeTruthy();
    expect(getByText('Estimated: 25 mins')).toBeTruthy();
  });

  it('displays delivery partner information correctly', () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    expect(getByText('Delivery Partner')).toBeTruthy();
    expect(getByText('Rajesh Kumar')).toBeTruthy();
    expect(getByText('Bike - MH12AB1234')).toBeTruthy();
    expect(getByText('⭐ 4.8')).toBeTruthy();
  });

  it('displays delivery details correctly', () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    expect(getByText('Delivery Details')).toBeTruthy();
    expect(getByText('From')).toBeTruthy();
    expect(getByText('123 Main Street, Mumbai')).toBeTruthy();
    expect(getByText('To')).toBeTruthy();
    expect(getByText('456 Park Avenue, Mumbai')).toBeTruthy();
    expect(getByText('Package Type')).toBeTruthy();
    expect(getByText('Documents')).toBeTruthy();
    expect(getByText('Description')).toBeTruthy();
    expect(getByText('Important legal documents')).toBeTruthy();
  });

  it('displays recipient information correctly', () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    expect(getByText('Recipient Details')).toBeTruthy();
    expect(getByText('Priya Sharma')).toBeTruthy();
    expect(getByText('+91 9876543210')).toBeTruthy();
  });

  it('displays delivery fee correctly', () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    expect(getByText('Delivery Fee')).toBeTruthy();
    expect(getByText('₹45')).toBeTruthy();
  });

  it('calls delivery partner when call button is pressed', () => {
    const { getAllByText } = render(<DeliveryInProgressScreen />);

    const callButtons = getAllByText('📞 Call');
    fireEvent.press(callButtons[0]); // Partner call button

    expect(Linking.openURL).toHaveBeenCalledWith('tel:+919876543211');
  });

  it('calls recipient when call button is pressed', () => {
    const { getAllByText } = render(<DeliveryInProgressScreen />);

    const callButtons = getAllByText('📞 Call');
    fireEvent.press(callButtons[1]); // Recipient call button

    expect(Linking.openURL).toHaveBeenCalledWith('tel:+919876543210');
  });

  it('updates delivery status over time', async () => {
    const { getByText, rerender } = render(<DeliveryInProgressScreen />);

    // Initial status
    expect(getByText('Package assigned to delivery partner')).toBeTruthy();

    // Advance timer to trigger status update
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(getByText('Package picked up from sender')).toBeTruthy();
    });

    // Advance timer again
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(getByText('Package is on the way to destination')).toBeTruthy();
    });
  });

  it('shows correct status colors for different statuses', async () => {
    const { getByTestId } = render(<DeliveryInProgressScreen />);

    // Check initial status color (should be blue for ASSIGNED)
    const statusContainer = getByTestId('status-container');
    expect(statusContainer.props.style).toEqual(
      expect.objectContaining({ backgroundColor: '#e3f2fd' })
    );
  });

  it('renders progress steps correctly', () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    expect(getByText('Assigned')).toBeTruthy();
    expect(getByText('Picked Up')).toBeTruthy();
    expect(getByText('In Transit')).toBeTruthy();
    expect(getByText('Delivered')).toBeTruthy();
  });

  it('shows cancel delivery button for active deliveries', () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    expect(getByText('Cancel Delivery')).toBeTruthy();
  });

  it('handles delivery cancellation with confirmation', () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    fireEvent.press(getByText('Cancel Delivery'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Cancel Delivery',
      'Are you sure you want to cancel this delivery? This action cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', style: 'destructive', onPress: expect.any(Function) },
      ]
    );
  });

  it('processes delivery cancellation when confirmed', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    fireEvent.press(getByText('Cancel Delivery'));

    // Simulate user confirming cancellation
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmCallback = alertCall[2][1].onPress;
    
    await act(async () => {
      confirmCallback();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/delivery/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryId: 'DEL123456' }),
    });
  });

  it('shows loading state during cancellation', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    fireEvent.press(getByText('Cancel Delivery'));

    // Confirm cancellation
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmCallback = alertCall[2][1].onPress;
    
    act(() => {
      confirmCallback();
    });

    await waitFor(() => {
      expect(getByText('Cancelling...')).toBeTruthy();
    });
  });

  it('shows mark as delivered button when status is IN_TRANSIT', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Advance timer to get to IN_TRANSIT status
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      expect(getByText('Mark as Delivered')).toBeTruthy();
    });
  });

  it('handles mark as delivered with confirmation', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Advance to IN_TRANSIT status
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      fireEvent.press(getByText('Mark as Delivered'));
    });

    expect(Alert.alert).toHaveBeenCalledWith(
      'Mark as Delivered',
      'Confirm that the package has been delivered to the recipient?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: expect.any(Function) },
      ]
    );
  });

  it('navigates to delivery complete screen when marked as delivered', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Advance to IN_TRANSIT status
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    await waitFor(() => {
      fireEvent.press(getByText('Mark as Delivered'));
    });

    // Confirm delivery
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmCallback = alertCall[2][1].onPress;
    
    act(() => {
      confirmCallback();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('DeliveryComplete', {
        deliveryId: 'DEL123456',
        fare: 45,
      });
    });
  });

  it('shows completed button when delivery is delivered', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Advance timer to get to DELIVERED status
    act(() => {
      jest.advanceTimersByTime(9000);
    });

    await waitFor(() => {
      expect(getByText('✓ Delivery Completed')).toBeTruthy();
    });
  });

  it('navigates back when completed button is pressed', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Advance to DELIVERED status
    act(() => {
      jest.advanceTimersByTime(9000);
    });

    await waitFor(() => {
      fireEvent.press(getByText('✓ Delivery Completed'));
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('shows cancelled button when delivery is cancelled', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Simulate cancellation by advancing timer and setting cancelled status
    act(() => {
      jest.advanceTimersByTime(12000);
    });

    await waitFor(() => {
      expect(getByText('Delivery Cancelled')).toBeTruthy();
    });
  });

  it('navigates back when cancelled button is pressed', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Advance to CANCELLED status
    act(() => {
      jest.advanceTimersByTime(12000);
    });

    await waitFor(() => {
      fireEvent.press(getByText('Delivery Cancelled'));
    });

    expect(mockGoBack).toHaveBeenCalled();
  });

  it('disables cancel button when loading', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    fireEvent.press(getByText('Cancel Delivery'));

    // Confirm cancellation to trigger loading state
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmCallback = alertCall[2][1].onPress;
    
    act(() => {
      confirmCallback();
    });

    await waitFor(() => {
      const cancelButton = getByText('Cancelling...');
      expect(cancelButton.parent?.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('handles API error during cancellation', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    const { getByText } = render(<DeliveryInProgressScreen />);

    fireEvent.press(getByText('Cancel Delivery'));

    // Confirm cancellation
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const confirmCallback = alertCall[2][1].onPress;
    
    await act(async () => {
      confirmCallback();
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to cancel delivery. Please try again.'
      );
    });
  });

  it('updates estimated time correctly', async () => {
    const { getByText } = render(<DeliveryInProgressScreen />);

    // Initial estimated time
    expect(getByText('Estimated: 25 mins')).toBeTruthy();

    // Advance timer to trigger status update
    act(() => {
      jest.advanceTimersByTime(3000);
    });

    await waitFor(() => {
      expect(getByText('Estimated: 20 mins')).toBeTruthy();
    });
  });

  it('cleans up timer on unmount', () => {
    const { unmount } = render(<DeliveryInProgressScreen />);
    
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    unmount();
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});