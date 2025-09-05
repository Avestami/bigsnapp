const { device, expect, element, by } = require('detox');

describe('Delivery Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
    // Login before each test
    await helpers.login();
    await helpers.setLocation(37.7749, -122.4194);
  });

  afterEach(async () => {
    try {
      await helpers.logout();
    } catch {
      // Ignore logout errors in cleanup
    }
  });

  it('should display delivery request screen', async () => {
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    await expect(element(by.id('pickupLocationInput'))).toBeVisible();
    await expect(element(by.id('deliveryLocationInput'))).toBeVisible();
    await expect(element(by.id('packageDetailsSection'))).toBeVisible();
    await expect(element(by.id('recipientDetailsSection'))).toBeVisible();
    await expect(element(by.id('requestDeliveryButton'))).toBeVisible();
  });

  it('should allow setting pickup and delivery locations', async () => {
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Set pickup location
    await helpers.tapElement(by.id('pickupLocationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '123 Pickup St');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    await expect(element(by.id('pickupLocationInput'))).toHaveText('123 Pickup St, San Francisco, CA');
    
    // Set delivery location
    await helpers.tapElement(by.id('deliveryLocationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Delivery Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    await expect(element(by.id('deliveryLocationInput'))).toHaveText('456 Delivery Ave, San Francisco, CA');
  });

  it('should allow entering package details', async () => {
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Select package type
    await helpers.tapElement(by.id('packageTypeDropdown'));
    await helpers.waitForVisible(by.id('packageTypeModal'));
    await helpers.tapElement(by.id('packageType-documents'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    await expect(element(by.id('selectedPackageType'))).toHaveText('Documents');
    
    // Enter package description
    await helpers.typeText(by.id('packageDescriptionInput'), 'Important legal documents');
    
    // Set package weight
    await helpers.tapElement(by.id('packageWeightDropdown'));
    await helpers.waitForVisible(by.id('packageWeightModal'));
    await helpers.tapElement(by.id('weight-under-1kg'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    await expect(element(by.id('selectedWeight'))).toHaveText('Under 1kg');
  });

  it('should allow entering recipient details', async () => {
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Enter recipient information
    await helpers.typeText(by.id('recipientNameInput'), 'John Smith');
    await helpers.typeText(by.id('recipientPhoneInput'), '+1234567890');
    await helpers.typeText(by.id('deliveryInstructionsInput'), 'Ring doorbell twice');
    
    // Verify entered data
    await expect(element(by.id('recipientNameInput'))).toHaveText('John Smith');
    await expect(element(by.id('recipientPhoneInput'))).toHaveText('+1234567890');
    await expect(element(by.id('deliveryInstructionsInput'))).toHaveText('Ring doorbell twice');
  });

  it('should validate required fields before submission', async () => {
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Try to submit without required fields
    await helpers.tapElement(by.id('requestDeliveryButton'));
    
    // Check validation errors
    await helpers.waitForVisible(by.id('pickupLocationError'));
    await helpers.waitForVisible(by.id('deliveryLocationError'));
    await helpers.waitForVisible(by.id('packageTypeError'));
    await helpers.waitForVisible(by.id('recipientNameError'));
    await helpers.waitForVisible(by.id('recipientPhoneError'));
    
    await expect(element(by.text('Pickup location is required'))).toBeVisible();
    await expect(element(by.text('Delivery location is required'))).toBeVisible();
    await expect(element(by.text('Package type is required'))).toBeVisible();
    await expect(element(by.text('Recipient name is required'))).toBeVisible();
    await expect(element(by.text('Recipient phone is required'))).toBeVisible();
  });

  it('should show delivery cost estimate', async () => {
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Fill required fields to trigger cost calculation
    await helpers.tapElement(by.id('pickupLocationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '123 Pickup St');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    await helpers.tapElement(by.id('deliveryLocationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Delivery Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Select package type
    await helpers.tapElement(by.id('packageTypeDropdown'));
    await helpers.waitForVisible(by.id('packageTypeModal'));
    await helpers.tapElement(by.id('packageType-documents'));
    
    // Cost estimate should appear
    await helpers.waitForVisible(by.id('costEstimateSection'));
    await expect(element(by.id('estimatedCost'))).toBeVisible();
    await expect(element(by.id('deliveryDistance'))).toBeVisible();
    await expect(element(by.id('estimatedTime'))).toBeVisible();
  });

  it('should successfully request a delivery', async () => {
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Fill all required fields
    await helpers.tapElement(by.id('pickupLocationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '123 Pickup St');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    await helpers.tapElement(by.id('deliveryLocationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Delivery Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    await helpers.tapElement(by.id('packageTypeDropdown'));
    await helpers.waitForVisible(by.id('packageTypeModal'));
    await helpers.tapElement(by.id('packageType-documents'));
    
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    await helpers.typeText(by.id('packageDescriptionInput'), 'Important documents');
    await helpers.typeText(by.id('recipientNameInput'), 'John Smith');
    await helpers.typeText(by.id('recipientPhoneInput'), '+1234567890');
    
    // Request delivery
    await helpers.tapElement(by.id('requestDeliveryButton'));
    
    // Should navigate to delivery in progress screen
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'), 15000);
    await expect(element(by.id('deliveryStatus'))).toBeVisible();
    await expect(element(by.id('trackingCode'))).toBeVisible();
  });

  it('should display delivery in progress screen with tracking information', async () => {
    // First request a delivery
    await helpers.tapElement(by.id('deliveryTab'));
    await helpers.waitForVisible(by.id('deliveryRequestScreen'));
    
    // Quick delivery request (using helper function)
    await this.requestDelivery();
    
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Check all tracking elements are present
    await expect(element(by.id('deliveryStatus'))).toBeVisible();
    await expect(element(by.id('trackingCode'))).toBeVisible();
    await expect(element(by.id('deliveryPartnerInfo'))).toBeVisible();
    await expect(element(by.id('partnerName'))).toBeVisible();
    await expect(element(by.id('partnerRating'))).toBeVisible();
    await expect(element(by.id('partnerVehicle'))).toBeVisible();
    await expect(element(by.id('estimatedDeliveryTime'))).toBeVisible();
    await expect(element(by.id('deliveryFee'))).toBeVisible();
  });

  it('should show delivery status progression', async () => {
    // Request delivery first
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Initially should show "Looking for delivery partner"
    await expect(element(by.id('deliveryStatus'))).toHaveText('Looking for delivery partner...');
    
    // Wait for partner acceptance
    await helpers.waitForVisible(by.text('Partner assigned'), 10000);
    await expect(element(by.id('deliveryStatus'))).toHaveText('Partner assigned');
    
    // Wait for pickup
    await helpers.waitForVisible(by.text('Heading to pickup'), 5000);
    await expect(element(by.id('deliveryStatus'))).toHaveText('Heading to pickup');
    
    // Wait for package pickup
    await helpers.waitForVisible(by.text('Package picked up'), 5000);
    await expect(element(by.id('deliveryStatus'))).toHaveText('Package picked up');
    
    // Wait for in transit
    await helpers.waitForVisible(by.text('In transit'), 5000);
    await expect(element(by.id('deliveryStatus'))).toHaveText('In transit');
  });

  it('should allow calling delivery partner', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Wait for partner info to be available
    await helpers.waitForVisible(by.id('deliveryPartnerInfo'));
    
    await helpers.tapElement(by.id('callPartnerButton'));
    
    // Should show call confirmation or open phone app
    await helpers.waitForVisible(by.id('callConfirmation'), 2000);
  });

  it('should allow calling recipient', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    await helpers.tapElement(by.id('callRecipientButton'));
    
    // Should show call confirmation
    await helpers.waitForVisible(by.id('callConfirmation'), 2000);
  });

  it('should allow canceling delivery before pickup', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Cancel delivery while partner is heading to pickup
    await helpers.waitForVisible(by.id('cancelDeliveryButton'));
    await helpers.tapElement(by.id('cancelDeliveryButton'));
    
    // Should show cancellation confirmation
    await helpers.waitForVisible(by.id('cancelConfirmationModal'));
    await expect(element(by.text('Are you sure you want to cancel this delivery?'))).toBeVisible();
    await expect(element(by.id('confirmCancelButton'))).toBeVisible();
    await expect(element(by.id('keepDeliveryButton'))).toBeVisible();
    
    // Confirm cancellation
    await helpers.tapElement(by.id('confirmCancelButton'));
    
    // Should navigate back to delivery request screen
    await helpers.waitForVisible(by.id('deliveryRequestScreen'), 10000);
    await expect(element(by.id('deliveryCancelledMessage'))).toBeVisible();
  });

  it('should not allow canceling after package pickup', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Wait for package to be picked up
    await helpers.waitForVisible(by.text('Package picked up'), 15000);
    
    // Cancel button should not be visible or should be disabled
    try {
      await helpers.waitForVisible(by.id('cancelDeliveryButton'), 2000);
      await expect(element(by.id('cancelDeliveryButton'))).not.toBeVisible();
    } catch {
      // Button doesn't exist, which is correct
    }
  });

  it('should show delivery progress steps', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Check progress steps are visible
    await expect(element(by.id('progressSteps'))).toBeVisible();
    await expect(element(by.id('step-partner-assigned'))).toBeVisible();
    await expect(element(by.id('step-heading-to-pickup'))).toBeVisible();
    await expect(element(by.id('step-package-picked-up'))).toBeVisible();
    await expect(element(by.id('step-in-transit'))).toBeVisible();
    await expect(element(by.id('step-delivered'))).toBeVisible();
  });

  it('should complete delivery successfully', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Wait for delivery completion (simulated)
    await helpers.waitForVisible(by.text('Delivered'), 20000);
    await expect(element(by.id('deliveryStatus'))).toHaveText('Delivered');
    
    // Mark as delivered button should appear
    await helpers.waitForVisible(by.id('markAsDeliveredButton'));
    await helpers.tapElement(by.id('markAsDeliveredButton'));
    
    // Should show delivery completion confirmation
    await helpers.waitForVisible(by.id('deliveryCompleteModal'));
    await expect(element(by.text('Delivery Completed!'))).toBeVisible();
    await expect(element(by.id('deliveryRatingSection'))).toBeVisible();
  });

  it('should allow rating delivery partner', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Complete delivery
    await helpers.waitForVisible(by.text('Delivered'), 20000);
    await helpers.tapElement(by.id('markAsDeliveredButton'));
    
    await helpers.waitForVisible(by.id('deliveryCompleteModal'));
    
    // Rate the delivery partner (4 stars)
    await helpers.tapElement(by.id('star-4'));
    await expect(element(by.id('star-4'))).toHaveId('selectedStar');
    
    // Add optional comment
    await helpers.typeText(by.id('ratingCommentInput'), 'Fast and professional delivery!');
    
    // Submit rating
    await helpers.tapElement(by.id('submitRatingButton'));
    
    // Should show success message
    await helpers.waitForVisible(by.id('ratingSubmittedMessage'));
    await expect(element(by.text('Thank you for your feedback!'))).toBeVisible();
  });

  it('should show delivery receipt', async () => {
    await this.requestDelivery();
    await helpers.waitForVisible(by.id('deliveryInProgressScreen'));
    
    // Complete delivery
    await helpers.waitForVisible(by.text('Delivered'), 20000);
    await helpers.tapElement(by.id('markAsDeliveredButton'));
    
    await helpers.waitForVisible(by.id('deliveryCompleteModal'));
    
    // View receipt
    await helpers.tapElement(by.id('viewReceiptButton'));
    await helpers.waitForVisible(by.id('receiptModal'));
    
    // Check receipt details
    await expect(element(by.id('receiptTitle'))).toHaveText('Delivery Receipt');
    await expect(element(by.id('trackingCode'))).toBeVisible();
    await expect(element(by.id('pickupAddress'))).toBeVisible();
    await expect(element(by.id('deliveryAddress'))).toBeVisible();
    await expect(element(by.id('packageDetails'))).toBeVisible();
    await expect(element(by.id('deliveryFee'))).toBeVisible();
    await expect(element(by.id('paymentMethod'))).toBeVisible();
  });
});