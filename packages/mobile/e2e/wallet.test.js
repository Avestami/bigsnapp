const { device, expect, element, by } = require('detox');

describe('Wallet Flow', () => {
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

  it('should display wallet screen with balance and payment methods', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await expect(element(by.id('walletBalance'))).toBeVisible();
    await expect(element(by.id('addMoneyButton'))).toBeVisible();
    await expect(element(by.id('paymentMethodsSection'))).toBeVisible();
    await expect(element(by.id('transactionHistorySection'))).toBeVisible();
  });

  it('should show current wallet balance', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Check balance is displayed with currency symbol
    await expect(element(by.id('walletBalance'))).toBeVisible();
    await expect(element(by.id('balanceAmount'))).toHaveText('$25.50'); // Mock balance
  });

  it('should allow adding money to wallet', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('addMoneyButton'));
    await helpers.waitForVisible(by.id('addMoneyModal'));
    
    // Check preset amounts
    await expect(element(by.id('amount-10'))).toBeVisible();
    await expect(element(by.id('amount-25'))).toBeVisible();
    await expect(element(by.id('amount-50'))).toBeVisible();
    await expect(element(by.id('amount-100'))).toBeVisible();
    
    // Select $25 amount
    await helpers.tapElement(by.id('amount-25'));
    await expect(element(by.id('amount-25'))).toHaveId('selectedAmount');
    
    // Proceed to payment
    await helpers.tapElement(by.id('proceedToPaymentButton'));
    await helpers.waitForVisible(by.id('paymentMethodSelection'));
  });

  it('should allow custom amount entry', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('addMoneyButton'));
    await helpers.waitForVisible(by.id('addMoneyModal'));
    
    // Enter custom amount
    await helpers.tapElement(by.id('customAmountOption'));
    await helpers.typeText(by.id('customAmountInput'), '75.00');
    
    await helpers.tapElement(by.id('proceedToPaymentButton'));
    await helpers.waitForVisible(by.id('paymentMethodSelection'));
    
    // Verify custom amount is shown
    await expect(element(by.id('paymentAmount'))).toHaveText('$75.00');
  });

  it('should validate minimum and maximum amounts', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('addMoneyButton'));
    await helpers.waitForVisible(by.id('addMoneyModal'));
    
    // Test minimum amount validation
    await helpers.tapElement(by.id('customAmountOption'));
    await helpers.typeText(by.id('customAmountInput'), '0.50');
    await helpers.tapElement(by.id('proceedToPaymentButton'));
    
    await helpers.waitForVisible(by.id('amountError'));
    await expect(element(by.text('Minimum amount is $1.00'))).toBeVisible();
    
    // Test maximum amount validation
    await helpers.clearText(by.id('customAmountInput'));
    await helpers.typeText(by.id('customAmountInput'), '1500.00');
    await helpers.tapElement(by.id('proceedToPaymentButton'));
    
    await helpers.waitForVisible(by.id('amountError'));
    await expect(element(by.text('Maximum amount is $1000.00'))).toBeVisible();
  });

  it('should display payment methods', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Check payment methods section
    await expect(element(by.id('paymentMethodsSection'))).toBeVisible();
    await expect(element(by.id('addPaymentMethodButton'))).toBeVisible();
    
    // Should show existing payment methods
    await expect(element(by.id('paymentMethod-0'))).toBeVisible();
    await expect(element(by.id('cardLastFour'))).toHaveText('•••• 4242');
    await expect(element(by.id('cardType'))).toHaveText('Visa');
  });

  it('should allow adding a new payment method', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('addPaymentMethodButton'));
    await helpers.waitForVisible(by.id('addPaymentMethodScreen'));
    
    // Fill card details
    await helpers.typeText(by.id('cardNumberInput'), '4111111111111111');
    await helpers.typeText(by.id('expiryInput'), '12/25');
    await helpers.typeText(by.id('cvvInput'), '123');
    await helpers.typeText(by.id('cardHolderNameInput'), 'John Doe');
    
    // Save payment method
    await helpers.tapElement(by.id('savePaymentMethodButton'));
    
    // Should navigate back to wallet
    await helpers.waitForVisible(by.id('walletScreen'));
    await expect(element(by.id('paymentMethodAdded'))).toBeVisible();
  });

  it('should validate card details', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('addPaymentMethodButton'));
    await helpers.waitForVisible(by.id('addPaymentMethodScreen'));
    
    // Try to save with empty fields
    await helpers.tapElement(by.id('savePaymentMethodButton'));
    
    // Check validation errors
    await helpers.waitForVisible(by.id('cardNumberError'));
    await helpers.waitForVisible(by.id('expiryError'));
    await helpers.waitForVisible(by.id('cvvError'));
    await helpers.waitForVisible(by.id('nameError'));
    
    // Test invalid card number
    await helpers.typeText(by.id('cardNumberInput'), '1234');
    await helpers.tapElement(by.id('savePaymentMethodButton'));
    await expect(element(by.text('Please enter a valid card number'))).toBeVisible();
  });

  it('should allow removing a payment method', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Long press on payment method to show options
    await element(by.id('paymentMethod-0')).longPress();
    await helpers.waitForVisible(by.id('paymentMethodOptions'));
    
    await helpers.tapElement(by.id('removePaymentMethodButton'));
    await helpers.waitForVisible(by.id('removeConfirmationModal'));
    
    await expect(element(by.text('Remove this payment method?'))).toBeVisible();
    await helpers.tapElement(by.id('confirmRemoveButton'));
    
    // Payment method should be removed
    await helpers.waitForNotVisible(by.id('paymentMethod-0'));
    await expect(element(by.id('paymentMethodRemoved'))).toBeVisible();
  });

  it('should display transaction history', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Check transaction history section
    await expect(element(by.id('transactionHistorySection'))).toBeVisible();
    await expect(element(by.id('viewAllTransactionsButton'))).toBeVisible();
    
    // Should show recent transactions
    await expect(element(by.id('transaction-0'))).toBeVisible();
    await expect(element(by.id('transactionType'))).toBeVisible();
    await expect(element(by.id('transactionAmount'))).toBeVisible();
    await expect(element(by.id('transactionDate'))).toBeVisible();
  });

  it('should allow viewing full transaction history', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('viewAllTransactionsButton'));
    await helpers.waitForVisible(by.id('transactionHistoryScreen'));
    
    // Check transaction list
    await expect(element(by.id('transactionsList'))).toBeVisible();
    await expect(element(by.id('filterButton'))).toBeVisible();
    
    // Check individual transaction details
    await expect(element(by.id('transaction-0'))).toBeVisible();
    await helpers.tapElement(by.id('transaction-0'));
    
    await helpers.waitForVisible(by.id('transactionDetailsModal'));
    await expect(element(by.id('transactionId'))).toBeVisible();
    await expect(element(by.id('transactionStatus'))).toBeVisible();
    await expect(element(by.id('paymentMethodUsed'))).toBeVisible();
  });

  it('should allow filtering transactions', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('viewAllTransactionsButton'));
    await helpers.waitForVisible(by.id('transactionHistoryScreen'));
    
    await helpers.tapElement(by.id('filterButton'));
    await helpers.waitForVisible(by.id('filterModal'));
    
    // Filter by type
    await helpers.tapElement(by.id('filterByRides'));
    await helpers.tapElement(by.id('applyFilterButton'));
    
    await helpers.waitForVisible(by.id('transactionHistoryScreen'));
    // Should only show ride transactions
    await expect(element(by.id('rideTransactionOnly'))).toBeVisible();
  });

  it('should complete wallet top-up flow', async () => {
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Add money
    await helpers.tapElement(by.id('addMoneyButton'));
    await helpers.waitForVisible(by.id('addMoneyModal'));
    
    await helpers.tapElement(by.id('amount-25'));
    await helpers.tapElement(by.id('proceedToPaymentButton'));
    
    await helpers.waitForVisible(by.id('paymentMethodSelection'));
    await helpers.tapElement(by.id('paymentMethod-0'));
    await helpers.tapElement(by.id('confirmPaymentButton'));
    
    // Should show processing
    await helpers.waitForVisible(by.id('paymentProcessing'));
    await expect(element(by.text('Processing payment...'))).toBeVisible();
    
    // Should show success and return to wallet
    await helpers.waitForVisible(by.id('paymentSuccess'), 10000);
    await helpers.tapElement(by.id('backToWalletButton'));
    
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Balance should be updated
    await expect(element(by.id('balanceAmount'))).toHaveText('$50.50'); // $25.50 + $25.00
    await expect(element(by.id('moneyAddedSuccess'))).toBeVisible();
  });

  it('should handle payment failure', async () => {
    // Mock payment failure
    await device.setURLBlacklist(['.*payment.*']);
    
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    await helpers.tapElement(by.id('addMoneyButton'));
    await helpers.waitForVisible(by.id('addMoneyModal'));
    
    await helpers.tapElement(by.id('amount-25'));
    await helpers.tapElement(by.id('proceedToPaymentButton'));
    
    await helpers.waitForVisible(by.id('paymentMethodSelection'));
    await helpers.tapElement(by.id('paymentMethod-0'));
    await helpers.tapElement(by.id('confirmPaymentButton'));
    
    // Should show payment failure
    await helpers.waitForVisible(by.id('paymentFailure'), 10000);
    await expect(element(by.text('Payment failed. Please try again.'))).toBeVisible();
    await helpers.tapElement(by.id('tryAgainButton'));
    
    // Should return to payment method selection
    await helpers.waitForVisible(by.id('paymentMethodSelection'));
    
    // Reset URL blacklist
    await device.setURLBlacklist([]);
  });

  it('should show wallet usage during ride payment', async () => {
    // First add money to wallet
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Ensure sufficient balance for ride
    await helpers.tapElement(by.id('addMoneyButton'));
    await helpers.waitForVisible(by.id('addMoneyModal'));
    await helpers.tapElement(by.id('amount-50'));
    await helpers.tapElement(by.id('proceedToPaymentButton'));
    await helpers.waitForVisible(by.id('paymentMethodSelection'));
    await helpers.tapElement(by.id('paymentMethod-0'));
    await helpers.tapElement(by.id('confirmPaymentButton'));
    await helpers.waitForVisible(by.id('paymentSuccess'), 10000);
    await helpers.tapElement(by.id('backToWalletButton'));
    
    // Now book and complete a ride
    await helpers.tapElement(by.id('rideTab'));
    await helpers.waitForVisible(by.id('rideRequestScreen'));
    
    // Request ride (simplified flow)
    await helpers.tapElement(by.id('destinationInput'));
    await helpers.waitForVisible(by.id('locationSearchScreen'));
    await helpers.typeText(by.id('locationSearchInput'), '456 Oak Ave');
    await helpers.tapElement(by.id('locationSuggestion-0'));
    
    await helpers.waitForVisible(by.id('rideOptionsContainer'));
    await helpers.tapElement(by.id('economyOption'));
    await helpers.tapElement(by.id('requestRideButton'));
    
    // Complete ride flow (fast-forward)
    await helpers.waitForVisible(by.id('rideInProgressScreen'), 15000);
    await helpers.waitForVisible(by.text('Ride completed'), 20000);
    await helpers.tapElement(by.id('completeRideButton'));
    
    // Check wallet was used for payment
    await helpers.waitForVisible(by.id('rideCompleteScreen'));
    await expect(element(by.id('paidWithWallet'))).toBeVisible();
    await expect(element(by.text('Paid with Wallet'))).toBeVisible();
    
    // Return to wallet and check updated balance
    await helpers.tapElement(by.id('walletTab'));
    await helpers.waitForVisible(by.id('walletScreen'));
    
    // Balance should be reduced by ride fare
    await expect(element(by.id('balanceAmount'))).not.toHaveText('$75.50'); // Should be less
    
    // Should show ride transaction in history
    await expect(element(by.id('rideTransaction'))).toBeVisible();
  });
});