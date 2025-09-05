import React from 'react';
import { render, fireEvent, waitFor } from '../../../test-utils';
import { Alert } from 'react-native';
import DeliveryScreen from '../DeliveryScreen';

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock console.log
const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

describe('DeliveryScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    consoleSpy.mockRestore();
  });

  it('renders correctly with initial state', () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    expect(getByText('Request Delivery')).toBeTruthy();
    expect(getByText('Pickup From')).toBeTruthy();
    expect(getByText('Deliver To')).toBeTruthy();
    expect(getByPlaceholderText('Pickup location')).toBeTruthy();
    expect(getByPlaceholderText('Delivery address')).toBeTruthy();
    expect(getByText('Small Package')).toBeTruthy();
    expect(getByText('₹40')).toBeTruthy();
  });

  it('displays current location in pickup field', () => {
    const { getByDisplayValue } = render(<DeliveryScreen />);
    
    expect(getByDisplayValue('Current Location, New Delhi')).toBeTruthy();
  });

  it('pickup location input is not editable', () => {
    const { getByPlaceholderText } = render(<DeliveryScreen />);
    
    const pickupInput = getByPlaceholderText('Pickup location');
    expect(pickupInput.props.editable).toBe(false);
  });

  it('updates delivery address and calculates fare', () => {
    const { getByPlaceholderText, getByText } = render(<DeliveryScreen />);
    
    const deliveryInput = getByPlaceholderText('Delivery address');
    fireEvent.changeText(deliveryInput, 'Connaught Place, New Delhi');
    
    expect(deliveryInput.props.value).toBe('Connaught Place, New Delhi');
    
    // Should show estimated fare after entering delivery address
    expect(getByText('Estimated Delivery Fee')).toBeTruthy();
    expect(getByText('₹70')).toBeTruthy(); // Base price (40) + distance price (30)
  });

  it('opens package type selection modal', () => {
    const { getByText, queryByText } = render(<DeliveryScreen />);
    
    // Modal should not be visible initially
    expect(queryByText('Select Package Type')).toBeFalsy();
    
    // Press package type selector
    fireEvent.press(getByText('Small Package'));
    
    // Modal should be visible
    expect(getByText('Select Package Type')).toBeTruthy();
    expect(getByText('Document')).toBeTruthy();
    expect(getByText('Medium Package')).toBeTruthy();
    expect(getByText('Large Package')).toBeTruthy();
  });

  it('selects different package types and updates fare', () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // First set delivery address to enable fare calculation
    const deliveryInput = getByPlaceholderText('Delivery address');
    fireEvent.changeText(deliveryInput, 'Test Address');
    
    // Open package type modal
    fireEvent.press(getByText('Small Package'));
    
    // Select Document package
    fireEvent.press(getByText('Document'));
    
    // Should update to Document package
    expect(getByText('Document')).toBeTruthy();
    expect(getByText('₹25')).toBeTruthy();
    expect(getByText('₹55')).toBeTruthy(); // Base price (25) + distance price (30)
    
    // Open modal again and select Large Package
    fireEvent.press(getByText('Document'));
    fireEvent.press(getByText('Large Package'));
    
    expect(getByText('Large Package')).toBeTruthy();
    expect(getByText('₹100')).toBeTruthy();
    expect(getByText('₹130')).toBeTruthy(); // Base price (100) + distance price (30)
  });

  it('closes package type modal when cancel is pressed', () => {
    const { getByText, queryByText } = render(<DeliveryScreen />);
    
    // Open modal
    fireEvent.press(getByText('Small Package'));
    expect(getByText('Select Package Type')).toBeTruthy();
    
    // Cancel
    fireEvent.press(getByText('Cancel'));
    expect(queryByText('Select Package Type')).toBeFalsy();
  });

  it('updates package description', () => {
    const { getByPlaceholderText } = render(<DeliveryScreen />);
    
    const descriptionInput = getByPlaceholderText('Describe what you\'re sending');
    fireEvent.changeText(descriptionInput, 'Important documents');
    
    expect(descriptionInput.props.value).toBe('Important documents');
  });

  it('updates recipient name and phone', () => {
    const { getByPlaceholderText } = render(<DeliveryScreen />);
    
    const nameInput = getByPlaceholderText('Full name');
    const phoneInput = getByPlaceholderText('Phone number');
    
    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(phoneInput, '9876543210');
    
    expect(nameInput.props.value).toBe('John Doe');
    expect(phoneInput.props.value).toBe('9876543210');
  });

  it('updates special instructions', () => {
    const { getByPlaceholderText } = render(<DeliveryScreen />);
    
    const instructionsInput = getByPlaceholderText('Any special delivery instructions');
    fireEvent.changeText(instructionsInput, 'Ring the doorbell twice');
    
    expect(instructionsInput.props.value).toBe('Ring the doorbell twice');
  });

  it('validates delivery location before request', () => {
    const { getByText } = render(<DeliveryScreen />);
    
    // Try to request delivery without delivery location
    fireEvent.press(getByText('Request Delivery'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please select pickup and delivery locations'
    );
  });

  it('validates package description before request', () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Set delivery address
    const deliveryInput = getByPlaceholderText('Delivery address');
    fireEvent.changeText(deliveryInput, 'Test Address');
    
    // Try to request delivery without package description
    fireEvent.press(getByText('Request Delivery'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please describe the package'
    );
  });

  it('validates recipient details before request', () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Set delivery address and package description
    const deliveryInput = getByPlaceholderText('Delivery address');
    const descriptionInput = getByPlaceholderText('Describe what you\'re sending');
    
    fireEvent.changeText(deliveryInput, 'Test Address');
    fireEvent.changeText(descriptionInput, 'Test package');
    
    // Try to request delivery without recipient details
    fireEvent.press(getByText('Request Delivery'));
    
    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please provide recipient details'
    );
  });

  it('processes successful delivery request', async () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Fill all required fields
    const deliveryInput = getByPlaceholderText('Delivery address');
    const descriptionInput = getByPlaceholderText('Describe what you\'re sending');
    const nameInput = getByPlaceholderText('Full name');
    const phoneInput = getByPlaceholderText('Phone number');
    
    fireEvent.changeText(deliveryInput, 'Test Address');
    fireEvent.changeText(descriptionInput, 'Test package');
    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(phoneInput, '9876543210');
    
    // Request delivery
    fireEvent.press(getByText('Request Delivery'));
    
    // Should show loading state
    expect(getByText('Requesting...')).toBeTruthy();
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Delivery requested! Looking for nearby delivery partners...',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });
    
    // Should log delivery request
    expect(consoleSpy).toHaveBeenCalledWith(
      'Delivery request:',
      expect.objectContaining({
        packageDescription: 'Test package',
        recipientName: 'John Doe',
        recipientPhone: '9876543210',
        packageType: 'SMALL_PACKAGE'
      })
    );
  });

  it('navigates to DeliveryInProgress on successful request', async () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Fill all required fields
    const deliveryInput = getByPlaceholderText('Delivery address');
    const descriptionInput = getByPlaceholderText('Describe what you\'re sending');
    const nameInput = getByPlaceholderText('Full name');
    const phoneInput = getByPlaceholderText('Phone number');
    
    fireEvent.changeText(deliveryInput, 'Test Address');
    fireEvent.changeText(descriptionInput, 'Test package');
    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(phoneInput, '9876543210');
    
    // Request delivery
    fireEvent.press(getByText('Request Delivery'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
    
    // Simulate pressing OK on success alert
    const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
      call => call[0] === 'Success'
    );
    if (alertCall && alertCall[2] && alertCall[2][0].onPress) {
      alertCall[2][0].onPress();
    }
    
    expect(mockNavigate).toHaveBeenCalledWith('DeliveryInProgress');
  });

  it('disables request button when no delivery location', () => {
    const { getByText } = render(<DeliveryScreen />);
    
    const requestButton = getByText('Request Delivery');
    expect(requestButton.parent?.props.disabled).toBe(true);
  });

  it('enables request button when delivery location is set', () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Set delivery address
    const deliveryInput = getByPlaceholderText('Delivery address');
    fireEvent.changeText(deliveryInput, 'Test Address');
    
    const requestButton = getByText('Request Delivery');
    expect(requestButton.parent?.props.disabled).toBe(false);
  });

  it('disables request button during loading', async () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Fill required fields
    const deliveryInput = getByPlaceholderText('Delivery address');
    const descriptionInput = getByPlaceholderText('Describe what you\'re sending');
    const nameInput = getByPlaceholderText('Full name');
    const phoneInput = getByPlaceholderText('Phone number');
    
    fireEvent.changeText(deliveryInput, 'Test Address');
    fireEvent.changeText(descriptionInput, 'Test package');
    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(phoneInput, '9876543210');
    
    // Request delivery
    fireEvent.press(getByText('Request Delivery'));
    
    const requestButton = getByText('Requesting...');
    expect(requestButton.parent?.props.disabled).toBe(true);
  });

  it('shows package type details correctly', () => {
    const { getByText } = render(<DeliveryScreen />);
    
    // Open package type modal
    fireEvent.press(getByText('Small Package'));
    
    // Check Document package details
    expect(getByText('Papers, certificates')).toBeTruthy();
    expect(getByText('Max weight: 1kg')).toBeTruthy();
    
    // Check Small Package details
    expect(getByText('Books, electronics')).toBeTruthy();
    expect(getByText('Max weight: 5kg')).toBeTruthy();
    
    // Check Medium Package details
    expect(getByText('Clothes, gifts')).toBeTruthy();
    expect(getByText('Max weight: 15kg')).toBeTruthy();
    
    // Check Large Package details
    expect(getByText('Appliances, furniture')).toBeTruthy();
    expect(getByText('Max weight: 25kg')).toBeTruthy();
  });

  it('highlights selected package type in modal', () => {
    const { getByText } = render(<DeliveryScreen />);
    
    // Open package type modal
    fireEvent.press(getByText('Small Package'));
    
    // Small Package should be selected (highlighted)
    const smallPackageOption = getByText('Small Package').parent?.parent;
    expect(smallPackageOption?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: '#007AFF' })
      ])
    );
  });

  it('handles input field properties correctly', () => {
    const { getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Check recipient name input properties
    const nameInput = getByPlaceholderText('Full name');
    expect(nameInput.props.autoCapitalize).toBe('words');
    
    // Check phone input properties
    const phoneInput = getByPlaceholderText('Phone number');
    expect(phoneInput.props.keyboardType).toBe('phone-pad');
    
    // Check multiline inputs
    const descriptionInput = getByPlaceholderText('Describe what you\'re sending');
    expect(descriptionInput.props.multiline).toBe(true);
    expect(descriptionInput.props.numberOfLines).toBe(3);
    
    const instructionsInput = getByPlaceholderText('Any special delivery instructions');
    expect(instructionsInput.props.multiline).toBe(true);
    expect(instructionsInput.props.numberOfLines).toBe(2);
  });

  it('calculates fare correctly for different package types', () => {
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Set delivery address
    const deliveryInput = getByPlaceholderText('Delivery address');
    fireEvent.changeText(deliveryInput, 'Test Address');
    
    // Test Document package fare
    fireEvent.press(getByText('Small Package'));
    fireEvent.press(getByText('Document'));
    expect(getByText('₹55')).toBeTruthy(); // 25 + 30
    
    // Test Medium package fare
    fireEvent.press(getByText('Document'));
    fireEvent.press(getByText('Medium Package'));
    expect(getByText('₹90')).toBeTruthy(); // 60 + 30
    
    // Test Large package fare
    fireEvent.press(getByText('Medium Package'));
    fireEvent.press(getByText('Large Package'));
    expect(getByText('₹130')).toBeTruthy(); // 100 + 30
  });

  it('does not show fare when no delivery location', () => {
    const { queryByText } = render(<DeliveryScreen />);
    
    expect(queryByText('Estimated Delivery Fee')).toBeFalsy();
  });

  it('handles error during delivery request', async () => {
    // Mock console.log to throw an error
    consoleSpy.mockImplementationOnce(() => {
      throw new Error('Network error');
    });
    
    const { getByText, getByPlaceholderText } = render(<DeliveryScreen />);
    
    // Fill all required fields
    const deliveryInput = getByPlaceholderText('Delivery address');
    const descriptionInput = getByPlaceholderText('Describe what you\'re sending');
    const nameInput = getByPlaceholderText('Full name');
    const phoneInput = getByPlaceholderText('Phone number');
    
    fireEvent.changeText(deliveryInput, 'Test Address');
    fireEvent.changeText(descriptionInput, 'Test package');
    fireEvent.changeText(nameInput, 'John Doe');
    fireEvent.changeText(phoneInput, '9876543210');
    
    // Request delivery
    fireEvent.press(getByText('Request Delivery'));
    
    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'Failed to request delivery. Please try again.'
      );
    });
  });
});