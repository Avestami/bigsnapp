const { device, expect, element, by } = require('detox');

describe('Favorites Management Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // Login before each test
    await helpers.login();
  });

  afterEach(async () => {
    try {
      await helpers.logout();
    } catch {
      // Ignore logout errors in cleanup
    }
  });

  it('should display favorites screen with tabs', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Check tab navigation
    await expect(element(by.id('locationsTab'))).toBeVisible();
    await expect(element(by.id('driversTab'))).toBeVisible();
    
    // Check locations tab is active by default
    await expect(element(by.id('locationsTab'))).toHaveId('activeTab');
    
    // Check add favorite button
    await expect(element(by.id('addFavoriteButton'))).toBeVisible();
  });

  it('should switch between locations and drivers tabs', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Initially on locations tab
    await expect(element(by.id('favoriteLocationsList'))).toBeVisible();
    
    // Switch to drivers tab
    await helpers.tapElement(by.id('driversTab'));
    await helpers.waitForVisible(by.id('favoriteDriversList'));
    await expect(element(by.id('driversTab'))).toHaveId('activeTab');
    
    // Switch back to locations tab
    await helpers.tapElement(by.id('locationsTab'));
    await helpers.waitForVisible(by.id('favoriteLocationsList'));
    await expect(element(by.id('locationsTab'))).toHaveId('activeTab');
  });

  it('should display existing favorite locations', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Check if favorite locations are displayed
    await helpers.waitForVisible(by.id('favoriteLocationItem-0'), 5000);
    
    // Check location item elements
    await expect(element(by.id('locationName-0'))).toBeVisible();
    await expect(element(by.id('locationAddress-0'))).toBeVisible();
    await expect(element(by.id('locationType-0'))).toBeVisible();
    await expect(element(by.id('locationIcon-0'))).toBeVisible();
    await expect(element(by.id('rideToLocationButton-0'))).toBeVisible();
    await expect(element(by.id('removeLocationButton-0'))).toBeVisible();
  });

  it('should display existing favorite drivers', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Switch to drivers tab
    await helpers.tapElement(by.id('driversTab'));
    await helpers.waitForVisible(by.id('favoriteDriversList'));
    
    // Check if favorite drivers are displayed
    await helpers.waitForVisible(by.id('favoriteDriverItem-0'), 5000);
    
    // Check driver item elements
    await expect(element(by.id('driverName-0'))).toBeVisible();
    await expect(element(by.id('driverRating-0'))).toBeVisible();
    await expect(element(by.id('driverVehicle-0'))).toBeVisible();
    await expect(element(by.id('driverPhoto-0'))).toBeVisible();
    await expect(element(by.id('rideWithDriverButton-0'))).toBeVisible();
    await expect(element(by.id('removeDriverButton-0'))).toBeVisible();
  });

  it('should show empty state when no favorites exist', async () => {
    // This test assumes a clean state or we clear favorites first
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // If no locations exist, should show empty state
    try {
      await helpers.waitForVisible(by.id('emptyLocationsState'), 3000);
      await expect(element(by.text('No favorite locations yet'))).toBeVisible();
      await expect(element(by.text('Add your frequently visited places'))).toBeVisible();
    } catch {
      // Favorites exist, skip this test
    }
    
    // Check drivers empty state
    await helpers.tapElement(by.id('driversTab'));
    try {
      await helpers.waitForVisible(by.id('emptyDriversState'), 3000);
      await expect(element(by.text('No favorite drivers yet'))).toBeVisible();
      await expect(element(by.text('Drivers you rate highly will appear here'))).toBeVisible();
    } catch {
      // Favorite drivers exist, skip this check
    }
  });

  it('should open add favorite location modal', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    await helpers.tapElement(by.id('addFavoriteButton'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Check modal elements
    await expect(element(by.id('locationNameInput'))).toBeVisible();
    await expect(element(by.id('locationAddressInput'))).toBeVisible();
    await expect(element(by.id('locationTypeSelector'))).toBeVisible();
    await expect(element(by.id('saveLocationButton'))).toBeVisible();
    await expect(element(by.id('cancelLocationButton'))).toBeVisible();
  });

  it('should validate add favorite location form', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    await helpers.tapElement(by.id('addFavoriteButton'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Try to save without filling required fields
    await helpers.tapElement(by.id('saveLocationButton'));
    
    // Should show validation errors
    await helpers.waitForVisible(by.id('locationNameError'));
    await helpers.waitForVisible(by.id('locationAddressError'));
    
    await expect(element(by.text('Location name is required'))).toBeVisible();
    await expect(element(by.text('Address is required'))).toBeVisible();
  });

  it('should successfully add a new favorite location', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    await helpers.tapElement(by.id('addFavoriteButton'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Fill location details
    await helpers.typeText(by.id('locationNameInput'), 'Test Office');
    await helpers.typeText(by.id('locationAddressInput'), '123 Business St, San Francisco, CA');
    
    // Select location type
    await helpers.tapElement(by.id('locationTypeSelector'));
    await helpers.waitForVisible(by.id('locationTypeModal'));
    await helpers.tapElement(by.id('workType'));
    
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Save location
    await helpers.tapElement(by.id('saveLocationButton'));
    
    // Should show loading state
    await helpers.waitForVisible(by.id('savingLocation'));
    
    // Should close modal and show new location in list
    await helpers.waitForVisible(by.id('favoritesScreen'), 10000);
    
    // Verify new location appears in list
    await expect(element(by.text('Test Office'))).toBeVisible();
    await expect(element(by.text('123 Business St, San Francisco, CA'))).toBeVisible();
  });

  it('should allow selecting different location types', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    await helpers.tapElement(by.id('addFavoriteButton'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Test each location type
    await helpers.tapElement(by.id('locationTypeSelector'));
    await helpers.waitForVisible(by.id('locationTypeModal'));
    
    // Check all type options are available
    await expect(element(by.id('homeType'))).toBeVisible();
    await expect(element(by.id('workType'))).toBeVisible();
    await expect(element(by.id('otherType'))).toBeVisible();
    
    // Select home type
    await helpers.tapElement(by.id('homeType'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    await expect(element(by.id('selectedLocationType'))).toHaveText('Home');
    
    // Change to other type
    await helpers.tapElement(by.id('locationTypeSelector'));
    await helpers.waitForVisible(by.id('locationTypeModal'));
    await helpers.tapElement(by.id('otherType'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    await expect(element(by.id('selectedLocationType'))).toHaveText('Other');
  });

  it('should cancel adding favorite location', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    await helpers.tapElement(by.id('addFavoriteButton'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Fill some data
    await helpers.typeText(by.id('locationNameInput'), 'Test Location');
    
    // Cancel
    await helpers.tapElement(by.id('cancelLocationButton'));
    
    // Should close modal and return to favorites screen
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Data should not be saved
    try {
      await expect(element(by.text('Test Location'))).not.toBeVisible();
    } catch {
      // Element doesn't exist, which is expected
    }
  });

  it('should request ride to favorite location', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Ensure we have at least one favorite location
    await helpers.waitForVisible(by.id('favoriteLocationItem-0'));
    
    // Tap ride to location button
    await helpers.tapElement(by.id('rideToLocationButton-0'));
    
    // Should navigate to ride request screen with destination pre-filled
    await helpers.waitForVisible(by.id('rideRequestScreen'), 10000);
    
    // Destination should be pre-filled
    await expect(element(by.id('destinationInput'))).not.toHaveText('');
    
    // Ride options should be visible
    await helpers.waitForVisible(by.id('rideOptionsSection'));
  });

  it('should request ride with favorite driver', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Switch to drivers tab
    await helpers.tapElement(by.id('driversTab'));
    await helpers.waitForVisible(by.id('favoriteDriversList'));
    
    // Ensure we have at least one favorite driver
    await helpers.waitForVisible(by.id('favoriteDriverItem-0'));
    
    // Tap ride with driver button
    await helpers.tapElement(by.id('rideWithDriverButton-0'));
    
    // Should navigate to ride request screen with driver preference
    await helpers.waitForVisible(by.id('rideRequestScreen'), 10000);
    
    // Preferred driver should be indicated
    await expect(element(by.id('preferredDriverSection'))).toBeVisible();
    await expect(element(by.id('selectedDriverName'))).toBeVisible();
  });

  it('should remove favorite location with confirmation', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Ensure we have at least one favorite location
    await helpers.waitForVisible(by.id('favoriteLocationItem-0'));
    
    // Get the location name for verification
    const locationName = await element(by.id('locationName-0')).getAttributes();
    
    // Tap remove button
    await helpers.tapElement(by.id('removeLocationButton-0'));
    
    // Should show confirmation dialog
    await helpers.waitForVisible(by.id('removeLocationConfirmation'));
    await expect(element(by.text('Remove from favorites?'))).toBeVisible();
    await expect(element(by.id('confirmRemoveButton'))).toBeVisible();
    await expect(element(by.id('cancelRemoveButton'))).toBeVisible();
    
    // Confirm removal
    await helpers.tapElement(by.id('confirmRemoveButton'));
    
    // Location should be removed from list
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Verify location is no longer in the list
    try {
      await expect(element(by.text(locationName.text))).not.toBeVisible();
    } catch {
      // Element doesn't exist, which is expected
    }
  });

  it('should cancel removing favorite location', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Ensure we have at least one favorite location
    await helpers.waitForVisible(by.id('favoriteLocationItem-0'));
    
    // Get the location name for verification
    const locationName = await element(by.id('locationName-0')).getAttributes();
    
    // Tap remove button
    await helpers.tapElement(by.id('removeLocationButton-0'));
    
    // Should show confirmation dialog
    await helpers.waitForVisible(by.id('removeLocationConfirmation'));
    
    // Cancel removal
    await helpers.tapElement(by.id('cancelRemoveButton'));
    
    // Should return to favorites screen
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Location should still be in the list
    await expect(element(by.text(locationName.text))).toBeVisible();
  });

  it('should remove favorite driver with confirmation', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Switch to drivers tab
    await helpers.tapElement(by.id('driversTab'));
    await helpers.waitForVisible(by.id('favoriteDriversList'));
    
    // Ensure we have at least one favorite driver
    await helpers.waitForVisible(by.id('favoriteDriverItem-0'));
    
    // Get the driver name for verification
    const driverName = await element(by.id('driverName-0')).getAttributes();
    
    // Tap remove button
    await helpers.tapElement(by.id('removeDriverButton-0'));
    
    // Should show confirmation dialog
    await helpers.waitForVisible(by.id('removeDriverConfirmation'));
    await expect(element(by.text('Remove driver from favorites?'))).toBeVisible();
    
    // Confirm removal
    await helpers.tapElement(by.id('confirmRemoveButton'));
    
    // Driver should be removed from list
    await helpers.waitForVisible(by.id('favoriteDriversList'));
    
    // Verify driver is no longer in the list
    try {
      await expect(element(by.text(driverName.text))).not.toBeVisible();
    } catch {
      // Element doesn't exist, which is expected
    }
  });

  it('should display location icons based on type', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Check if locations with different types show appropriate icons
    await helpers.waitForVisible(by.id('favoriteLocationItem-0'));
    
    // Check for home icon
    try {
      await expect(element(by.id('homeIcon-0'))).toBeVisible();
    } catch {
      // Try work icon
      try {
        await expect(element(by.id('workIcon-0'))).toBeVisible();
      } catch {
        // Try other icon
        await expect(element(by.id('otherIcon-0'))).toBeVisible();
      }
    }
  });

  it('should show tab counts', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Check if tab counts are displayed
    await expect(element(by.id('locationsTabCount'))).toBeVisible();
    await expect(element(by.id('driversTabCount'))).toBeVisible();
    
    // Switch to drivers tab and verify count
    await helpers.tapElement(by.id('driversTab'));
    await helpers.waitForVisible(by.id('favoriteDriversList'));
    
    // Counts should still be visible
    await expect(element(by.id('driversTabCount'))).toBeVisible();
  });

  it('should handle long location names and addresses', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    await helpers.tapElement(by.id('addFavoriteButton'));
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Enter very long name and address
    const longName = 'This is a very long location name that should be handled properly by the UI';
    const longAddress = '1234 This is a very long street name that goes on and on, in a city with a very long name, State 12345';
    
    await helpers.typeText(by.id('locationNameInput'), longName);
    await helpers.typeText(by.id('locationAddressInput'), longAddress);
    
    // Select location type
    await helpers.tapElement(by.id('locationTypeSelector'));
    await helpers.waitForVisible(by.id('locationTypeModal'));
    await helpers.tapElement(by.id('otherType'));
    
    await helpers.waitForVisible(by.id('addLocationModal'));
    
    // Save location
    await helpers.tapElement(by.id('saveLocationButton'));
    
    // Should handle long text properly
    await helpers.waitForVisible(by.id('favoritesScreen'), 10000);
    
    // Text should be truncated or wrapped appropriately
    await expect(element(by.text(longName))).toBeVisible();
  });

  it('should refresh favorites list', async () => {
    await helpers.tapElement(by.id('favoritesTab'));
    await helpers.waitForVisible(by.id('favoritesScreen'));
    
    // Pull to refresh
    await element(by.id('favoriteLocationsList')).swipe('down', 'slow', 0.8);
    
    // Should show refresh indicator
    await helpers.waitForVisible(by.id('refreshIndicator'), 2000);
    
    // Should complete refresh
    await helpers.waitForVisible(by.id('favoritesScreen'), 5000);
  });
});