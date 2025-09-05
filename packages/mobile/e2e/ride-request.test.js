const { device, expect, element, by } = require('detox');

describe('Ride Request Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // Login before each test
    await helpers.login();
    // Set mock location
    await helpers.setLocation(37.7749, -122.4194); // San Francisco
  });

  afterEach(async () => {
    try {
      await helpers.logout();
    } catch {
      // Ignore logout errors in cleanup
    }
  });

  it('should display ride request screen with map and location inputs', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    await expect(element(by.id('mapView'))).toBeVisible();
    await expect(element(by.id('pickupInput'))).toBeVisible();
    await expect(element(by.id('destinationInput'))).toBeVisible();
    await expect(element(by.id('requestRideButton'))).toBeVisible();
  });

  it('should auto-detect current location for pickup', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Wait for location to be detected
    await helpers.waitForVisible(by.id('currentLocationDetected'), 10000);
    await expect(element(by.id('pickupInput'))).toHaveText('Current Location');
  });

  it('should allow manual pickup location entry', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    await helpers.tapElement(by.id('pickupInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    
    await helpers.typeText(by.id('locationSearchInput'), '123 Main St');
    await helpers.waitForVisible(by.id('locationSuggestion-0'));
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    await expect(element(by.id('pickupInput'))).toHaveText('123 Main St, San Francisco, CA');
  });

  it('should allow destination selection', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.waitForVisible(by.id('locationSuggestion-0'));
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    await expect(element(by.id('destinationInput'))).toHaveText('456 Oak Ave, San Francisco, CA');
  });

  it('should show ride options after selecting pickup and destination', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    
    // Check ride options are displayed
    await expect(element(by.id('economyOption'))).toBeVisible();
    await expect(element(by.id('comfortOption'))).toBeVisible();
    await expect(element(by.id('premiumOption'))).toBeVisible();
    
    // Check price estimates
    await expect(element(by.id('economyPrice'))).toBeVisible();
    await expect(element(by.id('comfortPrice'))).toBeVisible();
    await expect(element(by.id('premiumPrice'))).toBeVisible();
  });

  it('should allow ride option selection', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    
    // Select comfort option
    await helpers.tapElement(by.id('comfortOption'));
    await expect(element(by.id('comfortOption'))).toHaveId('selectedRideOption');
    
    // Request ride button should be enabled
    await expect(element(by.id('requestRideButton'))).toBeVisible();
  });

  it('should successfully request a ride', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    
    // Select ride option and request
    await helpers.tapElement(by.id('economyOption'));
    await helpers.tapElement(by.id('requestRideButton'));
    
    // Should navigate to ride in progress screen
    await helpers.waitForVisible(by.id('rideInProgressScreen'), 15000);
    await expect(element(by.id('rideStatus'))).toBeVisible();
    await expect(element(by.id('driverInfo'))).toBeVisible();
  });

  it('should show loading state during ride request', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination and select option
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    await helpers.tapElement(by.id('economyOption'));
    await helpers.tapElement(by.id('requestRideButton'));
    
    // Check loading state
    await helpers.waitForVisible(by.id('requestingRideLoader'));
    await expect(element(by.text('Finding nearby drivers...'))).toBeVisible();
  });

  it('should allow adding ride notes', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    
    // Add notes
    await helpers.tapElement(by.id('addNotesButton'));
    await helpers.waitForVisible(by.id('notesModal'));
    await helpers.typeText(by.id('notesInput'), 'Please call when you arrive');
    await helpers.tapElement(by.id('saveNotesButton'));
    
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    await expect(element(by.id('notesPreview'))).toHaveText('Please call when you arrive');
  });

  it('should allow scheduling a ride for later', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    
    // Schedule ride
    await helpers.tapElement(by.id('scheduleRideButton'));
    await helpers.waitForVisible(by.id('dateTimePickerModal'));
    
    // Select date and time (tomorrow at 2 PM)
    await helpers.tapElement(by.id('tomorrowDateOption'));
    await helpers.tapElement(by.id('time-14-00'));
    await helpers.tapElement(by.id('confirmScheduleButton'));
    
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    await expect(element(by.id('scheduledTimeDisplay'))).toBeVisible();
  });

  it('should show error when no drivers available', async () => {
    // Mock no drivers scenario
    await device.setURLBlacklist(['.*drivers.*']);
    
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination and request
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    await helpers.tapElement(by.id('economyOption'));
    await helpers.tapElement(by.id('requestRideButton'));
    
    // Should show no drivers error
    await helpers.waitForVisible(by.id('noDriversError'));
    await expect(element(by.text('No drivers available in your area'))).toBeVisible();
    await expect(element(by.id('tryAgainButton'))).toBeVisible();
    
    // Reset URL blacklist
    await device.setURLBlacklist([]);
  });

  it('should allow using favorite locations', async () => {
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Tap favorites button
    await helpers.tapElement(by.id('favoritesButton'));
    await helpers.waitForVisible(by.id('favoritesModal'));
    
    // Select a favorite location
    await helpers.tapElement(by.id('favoriteLocation-home'));
    
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    await expect(element(by.id('destinationInput'))).toHaveText('Home - 123 Home St');
  });
});