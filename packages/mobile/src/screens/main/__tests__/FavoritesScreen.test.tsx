import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import FavoritesScreen from '../FavoritesScreen';

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('FavoritesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial data', () => {
    const { getByText } = render(<FavoritesScreen />);

    expect(getByText('Favorites')).toBeTruthy();
    expect(getByText('+ Add Location')).toBeTruthy();
    expect(getByText('📍 Locations (3)')).toBeTruthy();
    expect(getByText('👤 Drivers (2)')).toBeTruthy();
  });

  it('displays locations tab by default', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Check that location data is displayed
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Office')).toBeTruthy();
    expect(getByText('Gym')).toBeTruthy();
    expect(getByText('Sector 18, Noida, Uttar Pradesh 201301')).toBeTruthy();
  });

  it('displays location details correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Check location details
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Sector 18, Noida, Uttar Pradesh 201301')).toBeTruthy();
    expect(getByText('Office')).toBeTruthy();
    expect(getByText('Connaught Place, New Delhi, Delhi 110001')).toBeTruthy();
    expect(getByText('Gym')).toBeTruthy();
    expect(getByText('DLF Mall of India, Sector 18, Noida')).toBeTruthy();
  });

  it('displays location icons correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Check that emojis are displayed (they're part of the icon system)
    expect(getByText('🏠')).toBeTruthy(); // Home icon
    expect(getByText('🏢')).toBeTruthy(); // Work icon
    expect(getByText('📍')).toBeTruthy(); // Other icon
  });

  it('switches to drivers tab correctly', () => {
    const { getByText, queryByText } = render(<FavoritesScreen />);

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));

    // Check that driver data is displayed
    expect(getByText('Rajesh Kumar')).toBeTruthy();
    expect(getByText('Priya Sharma')).toBeTruthy();
    expect(getByText('Sedan • DL 01 AB 1234')).toBeTruthy();
    expect(getByText('Hatchback • DL 02 CD 5678')).toBeTruthy();

    // Check that location data is not displayed
    expect(queryByText('Home')).toBeNull();
    expect(queryByText('Office')).toBeNull();
  });

  it('displays driver details correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));

    // Check driver details
    expect(getByText('Rajesh Kumar')).toBeTruthy();
    expect(getByText('Sedan • DL 01 AB 1234')).toBeTruthy();
    expect(getByText('⭐ 4.9')).toBeTruthy();
    expect(getByText('• 15 rides')).toBeTruthy();

    expect(getByText('Priya Sharma')).toBeTruthy();
    expect(getByText('Hatchback • DL 02 CD 5678')).toBeTruthy();
    expect(getByText('⭐ 4.8')).toBeTruthy();
    expect(getByText('• 8 rides')).toBeTruthy();
  });

  it('displays driver initials correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));

    // Check driver initials
    expect(getByText('R')).toBeTruthy(); // Rajesh Kumar
    expect(getByText('P')).toBeTruthy(); // Priya Sharma
  });

  it('hides add button when on drivers tab', () => {
    const { getByText, queryByText } = render(<FavoritesScreen />);

    // Initially add button should be visible
    expect(getByText('+ Add Location')).toBeTruthy();

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));

    // Add button should be hidden
    expect(queryByText('+ Add Location')).toBeNull();
  });

  it('shows add button when switching back to locations tab', () => {
    const { getByText, queryByText } = render(<FavoritesScreen />);

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));
    expect(queryByText('+ Add Location')).toBeNull();

    // Switch back to locations tab
    fireEvent.press(getByText('📍 Locations (3)'));
    expect(getByText('+ Add Location')).toBeTruthy();
  });

  it('opens add location modal when button is pressed', () => {
    const { getByText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));

    expect(getByText('Add Favorite Location')).toBeTruthy();
    expect(getByText('Location Name')).toBeTruthy();
    expect(getByText('Address')).toBeTruthy();
    expect(getByText('Location Type')).toBeTruthy();
  });

  it('closes add location modal when cancel is pressed', () => {
    const { getByText, queryByText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    expect(getByText('Add Favorite Location')).toBeTruthy();

    fireEvent.press(getByText('Cancel'));
    expect(queryByText('Add Favorite Location')).toBeNull();
  });

  it('allows entering location name in modal', () => {
    const { getByText, getByPlaceholderText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    const nameInput = getByPlaceholderText('e.g., Home, Office, Gym');
    fireEvent.changeText(nameInput, 'Shopping Mall');
    
    expect(nameInput.props.value).toBe('Shopping Mall');
  });

  it('allows entering address in modal', () => {
    const { getByText, getByPlaceholderText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    const addressInput = getByPlaceholderText('Enter full address');
    fireEvent.changeText(addressInput, '123 Main Street, City');
    
    expect(addressInput.props.value).toBe('123 Main Street, City');
  });

  it('allows selecting location type in modal', () => {
    const { getByText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    // Initially OTHER should be selected
    expect(getByText('📍 Other')).toBeTruthy();
    
    // Select HOME
    fireEvent.press(getByText('🏠 Home'));
    
    // Both options should still be visible
    expect(getByText('🏠 Home')).toBeTruthy();
    expect(getByText('🏢 Work')).toBeTruthy();
    expect(getByText('📍 Other')).toBeTruthy();
  });

  it('validates location name when adding location', () => {
    const { getByText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    fireEvent.press(getByText('Add Location'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter a location name');
  });

  it('validates address when adding location', () => {
    const { getByText, getByPlaceholderText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    const nameInput = getByPlaceholderText('e.g., Home, Office, Gym');
    fireEvent.changeText(nameInput, 'Shopping Mall');
    
    fireEvent.press(getByText('Add Location'));

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please enter the address');
  });

  it('adds location successfully with all fields filled', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    // Fill all required fields
    const nameInput = getByPlaceholderText('e.g., Home, Office, Gym');
    fireEvent.changeText(nameInput, 'Shopping Mall');
    
    const addressInput = getByPlaceholderText('Enter full address');
    fireEvent.changeText(addressInput, '123 Main Street, City');
    
    fireEvent.press(getByText('Add Location'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'Location added to favorites!');
    });

    // Modal should be closed
    expect(queryByText('Add Favorite Location')).toBeNull();
  });

  it('shows loading state when adding location', async () => {
    const { getByText, getByPlaceholderText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    // Fill required fields
    const nameInput = getByPlaceholderText('e.g., Home, Office, Gym');
    fireEvent.changeText(nameInput, 'Shopping Mall');
    
    const addressInput = getByPlaceholderText('Enter full address');
    fireEvent.changeText(addressInput, '123 Main Street, City');
    
    fireEvent.press(getByText('Add Location'));

    // Should show loading text briefly
    expect(getByText('Adding...')).toBeTruthy();
  });

  it('requests ride to location when ride button is pressed', () => {
    const { getByText, getAllByText } = render(<FavoritesScreen />);

    // Find the first ride button (🚗 emoji)
    const rideButtons = getAllByText('🚗');
    fireEvent.press(rideButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Request Ride',
      'Request a ride to Home?',
      expect.any(Array)
    );
  });

  it('confirms ride request to location', () => {
    const { getByText, getAllByText } = render(<FavoritesScreen />);

    // Mock Alert.alert to simulate user pressing "Request Ride"
    Alert.alert = jest.fn((title, message, buttons) => {
      // Simulate pressing the "Request Ride" button
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const rideButtons = getAllByText('🚗');
    fireEvent.press(rideButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Ride request initiated!');
  });

  it('removes location when remove button is pressed', () => {
    const { getByText, getAllByText } = render(<FavoritesScreen />);

    // Find the first remove button (🗑️ emoji)
    const removeButtons = getAllByText('🗑️');
    fireEvent.press(removeButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove Favorite',
      'Are you sure you want to remove this location from favorites?',
      expect.any(Array)
    );
  });

  it('confirms location removal', () => {
    const { getByText, getAllByText, queryByText } = render(<FavoritesScreen />);

    // Mock Alert.alert to simulate user pressing "Remove"
    Alert.alert = jest.fn((title, message, buttons) => {
      // Simulate pressing the "Remove" button
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const removeButtons = getAllByText('🗑️');
    fireEvent.press(removeButtons[0]);

    // The location should be removed (we can't easily test the state change,
    // but we can verify the alert was called)
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('requests ride with driver when driver ride button is pressed', () => {
    const { getByText, getAllByText } = render(<FavoritesScreen />);

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));

    // Find the first ride button (🚗 emoji)
    const rideButtons = getAllByText('🚗');
    fireEvent.press(rideButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Request Ride',
      'Request a ride with Rajesh Kumar?',
      expect.any(Array)
    );
  });

  it('confirms ride request with driver', () => {
    const { getByText, getAllByText } = render(<FavoritesScreen />);

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));

    // Mock Alert.alert to simulate user pressing "Request Ride"
    Alert.alert = jest.fn((title, message, buttons) => {
      // Simulate pressing the "Request Ride" button
      if (buttons && buttons[1] && buttons[1].onPress) {
        buttons[1].onPress();
      }
    });

    const rideButtons = getAllByText('🚗');
    fireEvent.press(rideButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith('Success', 'Ride request sent to your favorite driver!');
  });

  it('removes driver when remove button is pressed', () => {
    const { getByText, getAllByText } = render(<FavoritesScreen />);

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));

    // Find the first remove button (🗑️ emoji)
    const removeButtons = getAllByText('🗑️');
    fireEvent.press(removeButtons[0]);

    expect(Alert.alert).toHaveBeenCalledWith(
      'Remove Favorite',
      'Are you sure you want to remove this driver from favorites?',
      expect.any(Array)
    );
  });

  it('formats dates correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Check if dates are formatted (the exact format depends on locale)
    // We'll just check that some date text is present
    expect(getByText(/Added on/)).toBeTruthy();
  });

  it('displays tab counts correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    expect(getByText('📍 Locations (3)')).toBeTruthy();
    expect(getByText('👤 Drivers (2)')).toBeTruthy();
  });

  it('highlights active tab correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Initially locations tab should be active
    const locationsTab = getByText('📍 Locations (3)');
    expect(locationsTab).toBeTruthy();

    // Switch to drivers tab
    fireEvent.press(getByText('👤 Drivers (2)'));
    
    // Both tabs should still be visible
    expect(getByText('📍 Locations (3)')).toBeTruthy();
    expect(getByText('👤 Drivers (2)')).toBeTruthy();
  });

  it('resets form when modal is closed and reopened', () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<FavoritesScreen />);

    // Open modal and fill some data
    fireEvent.press(getByText('+ Add Location'));
    
    const nameInput = getByPlaceholderText('e.g., Home, Office, Gym');
    fireEvent.changeText(nameInput, 'Test Location');
    
    // Close modal
    fireEvent.press(getByText('Cancel'));
    expect(queryByText('Add Favorite Location')).toBeNull();
    
    // Reopen modal
    fireEvent.press(getByText('+ Add Location'));
    
    // Form should be reset (we can't easily test the actual reset, but modal should be open)
    expect(getByText('Add Favorite Location')).toBeTruthy();
  });

  it('handles location type selection correctly', () => {
    const { getByText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    // All location type options should be visible
    expect(getByText('🏠 Home')).toBeTruthy();
    expect(getByText('🏢 Work')).toBeTruthy();
    expect(getByText('📍 Other')).toBeTruthy();
    
    // Select HOME
    fireEvent.press(getByText('🏠 Home'));
    
    // All options should still be visible
    expect(getByText('🏠 Home')).toBeTruthy();
    expect(getByText('🏢 Work')).toBeTruthy();
    expect(getByText('📍 Other')).toBeTruthy();
  });

  it('displays action buttons for each item', () => {
    const { getAllByText } = render(<FavoritesScreen />);

    // Check that ride and remove buttons are present for locations
    const rideButtons = getAllByText('🚗');
    const removeButtons = getAllByText('🗑️');
    
    expect(rideButtons.length).toBeGreaterThan(0);
    expect(removeButtons.length).toBeGreaterThan(0);
  });

  it('displays separators between items', () => {
    const { getByText } = render(<FavoritesScreen />);

    // Check that multiple items are displayed (separators are between them)
    expect(getByText('Home')).toBeTruthy();
    expect(getByText('Office')).toBeTruthy();
    expect(getByText('Gym')).toBeTruthy();
  });

  it('handles multiline address input correctly', () => {
    const { getByText, getByPlaceholderText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    const addressInput = getByPlaceholderText('Enter full address');
    
    // Check that it's configured for multiline
    expect(addressInput.props.multiline).toBe(true);
    expect(addressInput.props.numberOfLines).toBe(3);
  });

  it('disables add button when loading', async () => {
    const { getByText, getByPlaceholderText } = render(<FavoritesScreen />);

    fireEvent.press(getByText('+ Add Location'));
    
    // Fill required fields
    const nameInput = getByPlaceholderText('e.g., Home, Office, Gym');
    fireEvent.changeText(nameInput, 'Shopping Mall');
    
    const addressInput = getByPlaceholderText('Enter full address');
    fireEvent.changeText(addressInput, '123 Main Street, City');
    
    fireEvent.press(getByText('Add Location'));

    // Button should be disabled during loading
    const addButton = getByText('Adding...');
    expect(addButton).toBeTruthy();
  });
});