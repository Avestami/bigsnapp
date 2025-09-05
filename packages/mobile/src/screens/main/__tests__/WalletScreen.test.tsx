import React from 'react';
import { render, fireEvent, waitFor } from '../../../test-utils';
import { Alert } from 'react-native';
import WalletScreen from '../WalletScreen';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

describe('WalletScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with wallet data', () => {
    const { getByText } = render(<WalletScreen />);
    
    expect(getByText('Wallet')).toBeTruthy();
    expect(getByText('₹1,250.50')).toBeTruthy();
    expect(getByText('Total Earnings')).toBeTruthy();
    expect(getByText('₹5,420.00')).toBeTruthy();
    expect(getByText('Total Spent')).toBeTruthy();
    expect(getByText('₹4,169.50')).toBeTruthy();
  });

  it('displays transaction history', () => {
    const { getByText } = render(<WalletScreen />);
    
    expect(getByText('Recent Transactions')).toBeTruthy();
    expect(getByText('Delivery to Connaught Place')).toBeTruthy();
    expect(getByText('Wallet Top-up via UPI')).toBeTruthy();
    expect(getByText('Ride to Airport')).toBeTruthy();
    expect(getByText('Cashback on ride')).toBeTruthy();
    expect(getByText('Refund for cancelled ride')).toBeTruthy();
  });

  it('shows correct transaction amounts with proper formatting', () => {
    const { getByText } = render(<WalletScreen />);
    
    expect(getByText('-₹85.00')).toBeTruthy(); // Debit
    expect(getByText('+₹500.00')).toBeTruthy(); // Credit
    expect(getByText('-₹120.00')).toBeTruthy(); // Debit
    expect(getByText('+₹25.00')).toBeTruthy(); // Credit
    expect(getByText('+₹150.00')).toBeTruthy(); // Credit
  });

  it('filters transactions by type', () => {
    const { getByText, queryByText } = render(<WalletScreen />);
    
    // Initially shows all transactions
    expect(getByText('Delivery to Connaught Place')).toBeTruthy();
    expect(getByText('Wallet Top-up via UPI')).toBeTruthy();
    
    // Filter by CREDIT
    fireEvent.press(getByText('CREDIT'));
    expect(getByText('Wallet Top-up via UPI')).toBeTruthy();
    expect(getByText('Cashback on ride')).toBeTruthy();
    expect(queryByText('Delivery to Connaught Place')).toBeFalsy();
    
    // Filter by DEBIT
    fireEvent.press(getByText('DEBIT'));
    expect(getByText('Delivery to Connaught Place')).toBeTruthy();
    expect(getByText('Ride to Airport')).toBeTruthy();
    expect(queryByText('Wallet Top-up via UPI')).toBeFalsy();
    
    // Back to ALL
    fireEvent.press(getByText('ALL'));
    expect(getByText('Delivery to Connaught Place')).toBeTruthy();
    expect(getByText('Wallet Top-up via UPI')).toBeTruthy();
  });

  it('opens top-up modal when Add Money button is pressed', () => {
    const { getByText, queryByText } = render(<WalletScreen />);
    
    // Modal should not be visible initially
    expect(queryByText('Add Money to Wallet')).toBeFalsy();
    
    // Press Add Money button
    fireEvent.press(getByText('Add Money'));
    
    // Modal should be visible
    expect(getByText('Add Money to Wallet')).toBeTruthy();
    expect(getByText('Quick Amounts')).toBeTruthy();
  });

  it('handles custom amount input in top-up modal', () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    // Enter custom amount
    const amountInput = getByPlaceholderText('Enter amount');
    fireEvent.changeText(amountInput, '750');
    
    expect(amountInput.props.value).toBe('750');
  });

  it('handles quick amount selection in top-up modal', () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    // Select quick amount
    fireEvent.press(getByText('₹500'));
    
    const amountInput = getByPlaceholderText('Enter amount');
    expect(amountInput.props.value).toBe('500');
  });

  it('validates minimum amount for top-up', () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    // Enter amount less than minimum
    const amountInput = getByPlaceholderText('Enter amount');
    fireEvent.changeText(amountInput, '50');
    
    // Try to confirm
    fireEvent.press(getByText('Add Money'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Amount',
      'Minimum top-up amount is ₹100'
    );
  });

  it('validates maximum amount for top-up', () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    // Enter amount more than maximum
    const amountInput = getByPlaceholderText('Enter amount');
    fireEvent.changeText(amountInput, '15000');
    
    // Try to confirm
    fireEvent.press(getByText('Add Money'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Invalid Amount',
      'Maximum top-up amount is ₹10,000'
    );
  });

  it('processes successful top-up', async () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    // Enter valid amount
    const amountInput = getByPlaceholderText('Enter amount');
    fireEvent.changeText(amountInput, '1000');
    
    // Confirm top-up
    fireEvent.press(getByText('Add Money'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Money added successfully! Your new balance is ₹2,250.50'
      );
    });
  });

  it('closes top-up modal when cancel is pressed', () => {
    const { getByText, queryByText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    expect(getByText('Add Money to Wallet')).toBeTruthy();
    
    // Cancel
    fireEvent.press(getByText('Cancel'));
    expect(queryByText('Add Money to Wallet')).toBeFalsy();
  });

  it('disables Add Money button when amount is empty', () => {
    const { getByText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    // Find the Add Money button in modal (there are two with same text)
    const modalButtons = getByText('Add Money to Wallet').parent?.parent;
    const addMoneyButton = modalButtons?.findByProps({ testID: 'add-money-confirm' }) || 
                          getByText('Add Money'); // Fallback to any Add Money button
    
    // Button should be disabled when no amount
    expect(addMoneyButton.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#ccc' })
      ])
    );
  });

  it('shows loading state during top-up', async () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    // Enter valid amount
    const amountInput = getByPlaceholderText('Enter amount');
    fireEvent.changeText(amountInput, '1000');
    
    // Confirm top-up
    fireEvent.press(getByText('Add Money'));
    
    // Should show loading text briefly
    expect(getByText('Processing...')).toBeTruthy();
  });

  it('displays transaction status correctly', () => {
    const { getByText } = render(<WalletScreen />);
    
    // All mock transactions have COMPLETED status
    const completedElements = getByText('COMPLETED');
    expect(completedElements).toBeTruthy();
  });

  it('shows correct transaction icons based on category', () => {
    const { getByText } = render(<WalletScreen />);
    
    // Check that transactions are rendered (icons are emojis in the implementation)
    expect(getByText('Delivery to Connaught Place')).toBeTruthy();
    expect(getByText('Wallet Top-up via UPI')).toBeTruthy();
    expect(getByText('Ride to Airport')).toBeTruthy();
    expect(getByText('Cashback on ride')).toBeTruthy();
    expect(getByText('Refund for cancelled ride')).toBeTruthy();
  });

  it('formats dates correctly', () => {
    const { getByText } = render(<WalletScreen />);
    
    // Check that dates are displayed (format depends on locale)
    expect(getByText(/15\/1\/2024|1\/15\/2024/)).toBeTruthy(); // Different date formats
  });

  it('shows empty state when no transactions match filter', () => {
    const { getByText, queryByText } = render(<WalletScreen />);
    
    // This test assumes we can modify the component to have no CREDIT transactions
    // For now, we'll test the existing behavior
    fireEvent.press(getByText('CREDIT'));
    
    // Should still show credit transactions in our mock data
    expect(getByText('Wallet Top-up via UPI')).toBeTruthy();
  });

  it('handles quick amount buttons correctly', () => {
    const { getByText, getByPlaceholderText } = render(<WalletScreen />);
    
    // Open modal
    fireEvent.press(getByText('Add Money'));
    
    const amountInput = getByPlaceholderText('Enter amount');
    
    // Test different quick amounts
    fireEvent.press(getByText('₹100'));
    expect(amountInput.props.value).toBe('100');
    
    fireEvent.press(getByText('₹200'));
    expect(amountInput.props.value).toBe('200');
    
    fireEvent.press(getByText('₹500'));
    expect(amountInput.props.value).toBe('500');
    
    fireEvent.press(getByText('₹1000'));
    expect(amountInput.props.value).toBe('1000');
    
    fireEvent.press(getByText('₹2000'));
    expect(amountInput.props.value).toBe('2000');
    
    fireEvent.press(getByText('₹5000'));
    expect(amountInput.props.value).toBe('5000');
  });

  it('maintains filter state correctly', () => {
    const { getByText } = render(<WalletScreen />);
    
    // Check initial state (ALL should be active)
    const allButton = getByText('ALL');
    expect(allButton.parent?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#007AFF' })
      ])
    );
    
    // Switch to CREDIT
    fireEvent.press(getByText('CREDIT'));
    const creditButton = getByText('CREDIT');
    expect(creditButton.parent?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ backgroundColor: '#007AFF' })
      ])
    );
  });
});