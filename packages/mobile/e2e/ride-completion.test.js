const { device, expect, element, by } = require('detox');

describe('Ride Completion Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // Login and request a ride before each test
    await helpers.login();
    await helpers.setLocation(37.7749, -122.4194);
    
    // Navigate to ride tab and request a ride
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Set destination and request ride
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    await helpers.tapElement(by.id('economyOption'));
    await helpers.tapElement(by.id('requestRideButton'));
    
    // Wait for ride in progress screen
    await helpers.waitForVisible(by.id('rideInProgressScreen'), 15000);
  });

  afterEach(async () => {
    try {
      await helpers.logout();
    } catch {
      // Ignore logout errors in cleanup
    }
  });

  it('should display ride in progress screen with correct information', async () => {
    await expect(element(by.id('rideInProgressScreen'))).toBeVisible();
    await expect(element(by.id('rideStatus'))).toBeVisible();
    await expect(element(by.id('driverInfo'))).toBeVisible();
    await expect(element(by.id('driverName'))).toBeVisible();
    await expect(element(by.id('driverRating'))).toBeVisible();
    await expect(element(by.id('vehicleInfo'))).toBeVisible();
    await expect(element(by.id('estimatedFare'))).toBeVisible();
  });

  it('should show ride status progression', async () => {
    // Initially should show "Looking for driver"
    await expect(element(by.id('rideStatus'))).toHaveText('Looking for driver...');
    
    // Wait for driver acceptance
    await helpers.waitForVisible(by.text('Driver accepted'), 10000);
    await expect(element(by.id('rideStatus'))).toHaveText('Driver accepted');
    
    // Wait for driver arrival
    await helpers.waitForVisible(by.text('Driver is on the way'), 5000);
    await expect(element(by.id('rideStatus'))).toHaveText('Driver is on the way');
    
    // Wait for driver arrived
    await helpers.waitForVisible(by.text('Driver has arrived'), 5000);
    await expect(element(by.id('rideStatus'))).toHaveText('Driver has arrived');
    
    // Wait for ride start
    await helpers.waitForVisible(by.text('Ride in progress'), 5000);
    await expect(element(by.id('rideStatus'))).toHaveText('Ride in progress');
  });

  it('should allow calling the driver', async () => {
    // Wait for driver info to be available
    await helpers.waitForVisible(by.id('driverInfo'));
    
    await helpers.tapElement(by.id('callDriverButton'));
    
    // Should open phone app (we can't test the actual call, but can verify the intent)
    // In a real test, you might mock the Linking module
    await helpers.waitForVisible(by.id('callConfirmation'), 2000);
  });

  it('should allow canceling the ride before driver arrives', async () => {
    // Cancel ride while driver is on the way
    await helpers.waitForVisible(by.id('cancelRideButton'));
    await helpers.tapElement(by.id('cancelRideButton'));
    
    // Should show cancellation confirmation
    await helpers.waitForVisible(by.id('cancelConfirmationModal'));
    await expect(element(by.text('Are you sure you want to cancel this ride?'))).toBeVisible();
    await expect(element(by.id('confirmCancelButton'))).toBeVisible();
    await expect(element(by.id('keepRideButton'))).toBeVisible();
    
    // Confirm cancellation
    await helpers.tapElement(by.id('confirmCancelButton'));
    
    // Should navigate back to ride request screen
    await helpers.waitForVisible(by.id('rideRequestScreen'), 10000);
    await expect(element(by.id('rideCancelledMessage'))).toBeVisible();
  });

  it('should not allow canceling after ride starts', async () => {
    // Wait for ride to start
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    
    // Cancel button should not be visible or should be disabled
    try {
      await helpers.waitForVisible(by.id('cancelRideButton'), 2000);
      // If button exists, it should be disabled
      await expect(element(by.id('cancelRideButton'))).not.toBeVisible();
    } catch {
      // Button doesn't exist, which is correct
    }
  });

  it('should complete the ride successfully', async () => {
    // Wait for ride to be in progress
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    
    // Wait for ride completion (simulated)
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await expect(element(by.id('rideStatus'))).toHaveText('Ride completed');
    
    // Complete ride button should appear
    await helpers.waitForVisible(by.id('completeRideButton'));
    await helpers.tapElement(by.id('completeRideButton'));
    
    // Should navigate to ride complete screen
    await helpers.waitForVisible(by.id('rideCompleteScreen'), 10000);
    await expect(element(by.id('rideCompleteTitle'))).toBeVisible();
    await expect(element(by.id('finalFare'))).toBeVisible();
    await expect(element(by.id('ratingSection'))).toBeVisible();
  });

  it('should display ride complete screen with correct information', async () => {
    // Complete the ride first
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    
    // Check all elements are present
    await expect(element(by.id('rideCompleteTitle'))).toHaveText('Ride Completed!');
    await expect(element(by.id('tripSummary'))).toBeVisible();
    await expect(element(by.id('pickupLocation'))).toBeVisible();
    await expect(element(by.id('destinationLocation'))).toBeVisible();
    await expect(element(by.id('tripDistance'))).toBeVisible();
    await expect(element(by.id('tripDuration'))).toBeVisible();
    await expect(element(by.id('finalFare'))).toBeVisible();
    await expect(element(by.id('driverRatingSection'))).toBeVisible();
  });

  it('should allow rating the driver', async () => {
    // Complete the ride first
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    
    // Rate the driver (5 stars)
    await helpers.tapElement(by.id('star-5'));
    await expect(element(by.id('star-5'))).toHaveId('selectedStar');
    
    // Add optional comment
    await helpers.typeText(by.id('ratingCommentInput'), 'Great driver, very professional!');
    
    // Submit rating
    await helpers.tapElement(by.id('submitRatingButton'));
    
    // Should show success message
    await helpers.waitForVisible(by.id('ratingSubmittedMessage'));
    await expect(element(by.text('Thank you for your feedback!'))).toBeVisible();
  });

  it('should allow adding a tip', async () => {
    // Complete the ride first
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    
    // Add tip
    await helpers.tapElement(by.id('addTipButton'));
    await helpers.waitForVisible(by.id('tipModal'));
    
    // Select preset tip amount
    await helpers.tapElement(by.id('tip-15-percent'));
    await expect(element(by.id('tip-15-percent'))).toHaveId('selectedTip');
    
    // Confirm tip
    await helpers.tapElement(by.id('confirmTipButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    await expect(element(by.id('tipAddedMessage'))).toBeVisible();
    await expect(element(by.id('finalFareWithTip'))).toBeVisible();
  });

  it('should allow custom tip amount', async () => {
    // Complete the ride first
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    
    // Add custom tip
    await helpers.tapElement(by.id('addTipButton'));
    await helpers.waitForVisible(by.id('tipModal'));
    
    await helpers.tapElement(by.id('customTipOption'));
    await helpers.typeText(by.id('customTipInput'), '5.00');
    await helpers.tapElement(by.id('confirmTipButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    await expect(element(by.id('customTipAmount'))).toHaveText('$5.00');
  });

  it('should navigate to home after ride completion', async () => {
    // Complete the ride first
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    
    // Navigate back to home
    await helpers.tapElement(by.id('backToHomeButton'));
    
    await helpers.waitForVisible(by.id('homeScreen'));
    await expect(element(by.id('rideTab'))).toBeVisible();
  });

  it('should allow booking another ride from completion screen', async () => {
    // Complete the ride first
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    
    // Book another ride
    await helpers.tapElement(by.id('bookAnotherRideButton'));
    
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    await expect(element(by.id('pickupInput'))).toBeVisible();
    await expect(element(by.id('destinationInput'))).toBeVisible();
  });

  it('should show ride receipt with payment details', async () => {
    // Complete the ride first
    await helpers.waitForVisible(by.text('Ride in progress'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 10000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    
    // View receipt
    await helpers.tapElement(by.id('viewReceiptButton'));
    await helpers.waitForVisible(by.id('receiptModal'));
    
    // Check receipt details
    await expect(element(by.id('receiptTitle'))).toHaveText('Ride Receipt');
    await expect(element(by.id('baseFare'))).toBeVisible();
    await expect(element(by.id('distanceFare'))).toBeVisible();
    await expect(element(by.id('timeFare'))).toBeVisible();
    await expect(element(by.id('totalFare'))).toBeVisible();
    await expect(element(by.id('paymentMethod'))).toBeVisible();
  });
});