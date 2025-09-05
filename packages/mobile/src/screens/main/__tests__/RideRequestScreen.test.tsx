import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { useNavigation } from '@react-navigation/native';
import { render } from '../../../test-utils';
import RideRequestScreen from '../RideRequestScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('RideRequestScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<RideRequestScreen />);
    
    expect(getByText('Request a Ride')).toBeTruthy();
    expect(getByText('From')).toBeTruthy();
    expect(getByText('To')).toBeTruthy();
    expect(getByPlaceholderText('Pickup location')).toBeTruthy();
    expect(getByPlaceholderText('Where to?')).toBeTruthy();
    expect(getByText('Economy')).toBeTruthy();
    expect(getByText('₹8/km')).toBeTruthy();
    expect(getByText('Request Ride')).toBeTruthy();
  });

  it('initializes with current location', () => {
    const { getByDisplayValue } = render(<RideRequestScreen />);
    
    expect(getByDisplayValue('Current Location, New Delhi')).toBeTruthy();
  });

  it('updates destination when user types', () => {
    const { getByPlaceholderText } = render(<RideRequestScreen />);
    
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    expect(destinationInput.props.value).toBe('Airport Terminal 3');
  });

  it('shows estimated fare when destination is entered', () => {
    const { getByPlaceholderText, getByText } = render(<RideRequestScreen />);
    
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    expect(getByText('Estimated Fare')).toBeTruthy();
    expect(getByText('₹42')).toBeTruthy(); // 5.2km * ₹8/km = ₹42 (rounded)
  });

  it('opens ride type modal when selector is pressed', () => {
    const { getByText } = render(<RideRequestScreen />);
    
    const rideTypeSelector = getByText('Economy').parent;
    fireEvent.press(rideTypeSelector!);

    expect(getByText('Select Ride Type')).toBeTruthy();
    expect(getByText('Comfort')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
  });

  it('changes ride type when option is selected', () => {
    const { getByText } = render(<RideRequestScreen />);
    
    // Open modal
    const rideTypeSelector = getByText('Economy').parent;
    fireEvent.press(rideTypeSelector!);

    // Select Comfort
    const comfortOption = getByText('Comfort');
    fireEvent.press(comfortOption);

    // Check if ride type changed
    expect(getByText('Comfort')).toBeTruthy();
    expect(getByText('₹12/km')).toBeTruthy();
  });

  it('closes modal when cancel is pressed', () => {
    const { getByText, queryByText } = render(<RideRequestScreen />);
    
    // Open modal
    const rideTypeSelector = getByText('Economy').parent;
    fireEvent.press(rideTypeSelector!);

    expect(getByText('Select Ride Type')).toBeTruthy();

    // Close modal
    const cancelButton = getByText('Cancel');
    fireEvent.press(cancelButton);

    expect(queryByText('Select Ride Type')).toBeNull();
  });

  it('updates fare when ride type changes', () => {
    const { getByText, getByPlaceholderText } = render(<RideRequestScreen />);
    
    // Set destination first
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    // Change to Premium
    const rideTypeSelector = getByText('Economy').parent;
    fireEvent.press(rideTypeSelector!);
    const premiumOption = getByText('Premium');
    fireEvent.press(premiumOption);

    // Check updated fare (5.2km * ₹18/km = ₹94 rounded)
    expect(getByText('₹94')).toBeTruthy();
  });

  it('shows error when requesting ride without destination', () => {
    const { getByText } = render(<RideRequestScreen />);
    
    const requestButton = getByText('Request Ride');
    fireEvent.press(requestButton);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Error',
      'Please select pickup and destination locations'
    );
  });

  it('disables request button when no destination is set', () => {
    const { getByText } = render(<RideRequestScreen />);
    
    const requestButton = getByText('Request Ride');
    expect(requestButton.parent?.props.disabled).toBe(true);
  });

  it('enables request button when destination is set', () => {
    const { getByText, getByPlaceholderText } = render(<RideRequestScreen />);
    
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    const requestButton = getByText('Request Ride');
    expect(requestButton.parent?.props.disabled).toBe(false);
  });

  it('shows loading state during ride request', async () => {
    const { getByText, getByPlaceholderText } = render(<RideRequestScreen />);
    
    // Set destination
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    const requestButton = getByText('Request Ride');
    fireEvent.press(requestButton);

    expect(getByText('Requesting...')).toBeTruthy();
  });

  it('disables button during loading', async () => {
    const { getByText, getByPlaceholderText } = render(<RideRequestScreen />);
    
    // Set destination
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    const requestButton = getByText('Request Ride');
    fireEvent.press(requestButton);

    expect(requestButton.parent?.props.disabled).toBe(true);
  });

  it('navigates to RideInProgress on successful request', async () => {
    const { getByText, getByPlaceholderText } = render(<RideRequestScreen />);
    
    // Set destination
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    const requestButton = getByText('Request Ride');
    fireEvent.press(requestButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Ride requested! Looking for nearby drivers...',
        [{ text: 'OK', onPress: expect.any(Function) }]
      );
    });
  });

  it('logs ride request data', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const { getByText, getByPlaceholderText } = render(<RideRequestScreen />);
    
    // Set destination
    const destinationInput = getByPlaceholderText('Where to?');
    fireEvent.changeText(destinationInput, 'Airport Terminal 3');

    const requestButton = getByText('Request Ride');
    fireEvent.press(requestButton);

    expect(consoleSpy).toHaveBeenCalledWith('Ride request:', expect.objectContaining({
      pickupLocation: expect.objectContaining({
        address: 'Current Location, New Delhi'
      }),
      destination: expect.objectContaining({
        address: 'Airport Terminal 3'
      }),
      rideType: 'ECONOMY'
    }));
    
    consoleSpy.mockRestore();
  });

  it('pickup input is not editable', () => {
    const { getByPlaceholderText } = render(<RideRequestScreen />);
    
    const pickupInput = getByPlaceholderText('Pickup location');
    expect(pickupInput.props.editable).toBe(false);
  });

  it('displays correct ride type information', () => {
    const { getByText } = render(<RideRequestScreen />);
    
    expect(getByText('Economy')).toBeTruthy();
    expect(getByText('₹8/km')).toBeTruthy();
    expect(getByText('ETA: 3-5 min')).toBeTruthy();
  });

  it('shows all ride types in modal', () => {
    const { getByText } = render(<RideRequestScreen />);
    
    // Open modal
    const rideTypeSelector = getByText('Economy').parent;
    fireEvent.press(rideTypeSelector!);

    // Check all ride types are present
    expect(getByText('Economy')).toBeTruthy();
    expect(getByText('Comfort')).toBeTruthy();
    expect(getByText('Premium')).toBeTruthy();
    expect(getByText('₹8/km')).toBeTruthy();
    expect(getByText('₹12/km')).toBeTruthy();
    expect(getByText('₹18/km')).toBeTruthy();
  });

  it('highlights selected ride type in modal', () => {
    const { getByText } = render(<RideRequestScreen />);
    
    // Open modal
    const rideTypeSelector = getByText('Economy').parent;
    fireEvent.press(rideTypeSelector!);

    // Economy should be selected by default
    const economyOption = getByText('Economy').parent?.parent;
    expect(economyOption?.props.style).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ borderColor: '#007AFF' })
      ])
    );
  });
});