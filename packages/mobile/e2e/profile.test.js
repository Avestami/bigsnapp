const { device, expect, element, by } = require('detox');

describe('Profile Management Flow', () => {
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

  it('should display profile screen with user information', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    // Check profile elements are visible
    await expect(element(by.id('profileAvatar'))).toBeVisible();
    await expect(element(by.id('userName'))).toBeVisible();
    await expect(element(by.id('userEmail'))).toBeVisible();
    await expect(element(by.id('userPhone'))).toBeVisible();
    await expect(element(by.id('memberSince'))).toBeVisible();
    await expect(element(by.id('editProfileButton'))).toBeVisible();
  });

  it('should display profile menu options', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    // Check menu options
    await expect(element(by.id('editProfileOption'))).toBeVisible();
    await expect(element(by.id('rideHistoryOption'))).toBeVisible();
    await expect(element(by.id('paymentMethodsOption'))).toBeVisible();
    await expect(element(by.id('favoritesOption'))).toBeVisible();
    await expect(element(by.id('settingsOption'))).toBeVisible();
    await expect(element(by.id('helpSupportOption'))).toBeVisible();
    await expect(element(by.id('logoutOption'))).toBeVisible();
  });

  it('should navigate to edit profile screen', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('editProfileButton'));
    await helpers.waitForVisible(by.id('editProfileScreen'));
    
    // Check edit profile form elements
    await expect(element(by.id('firstNameInput'))).toBeVisible();
    await expect(element(by.id('lastNameInput'))).toBeVisible();
    await expect(element(by.id('emailInput'))).toBeVisible();
    await expect(element(by.id('phoneInput'))).toBeVisible();
    await expect(element(by.id('dateOfBirthInput'))).toBeVisible();
    await expect(element(by.id('genderSelector'))).toBeVisible();
    await expect(element(by.id('saveChangesButton'))).toBeVisible();
    await expect(element(by.id('cancelButton'))).toBeVisible();
  });

  it('should allow editing profile information', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('editProfileButton'));
    await helpers.waitForVisible(by.id('editProfileScreen'));
    
    // Clear and update first name
    await helpers.clearText(by.id('firstNameInput'));
    await helpers.typeText(by.id('firstNameInput'), 'UpdatedFirst');
    
    // Clear and update last name
    await helpers.clearText(by.id('lastNameInput'));
    await helpers.typeText(by.id('lastNameInput'), 'UpdatedLast');
    
    // Update phone number
    await helpers.clearText(by.id('phoneInput'));
    await helpers.typeText(by.id('phoneInput'), '+1987654321');
    
    // Save changes
    await helpers.tapElement(by.id('saveChangesButton'));
    
    // Should show loading state
    await helpers.waitForVisible(by.id('savingIndicator'));
    
    // Should navigate back to profile screen with updated info
    await helpers.waitForVisible(by.id('profileScreen'), 10000);
    await expect(element(by.id('userName'))).toHaveText('UpdatedFirst UpdatedLast');
  });

  it('should validate profile form fields', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('editProfileButton'));
    await helpers.waitForVisible(by.id('editProfileScreen'));
    
    // Clear required fields
    await helpers.clearText(by.id('firstNameInput'));
    await helpers.clearText(by.id('lastNameInput'));
    await helpers.clearText(by.id('emailInput'));
    
    // Try to save
    await helpers.tapElement(by.id('saveChangesButton'));
    
    // Should show validation errors
    await helpers.waitForVisible(by.id('firstNameError'));
    await helpers.waitForVisible(by.id('lastNameError'));
    await helpers.waitForVisible(by.id('emailError'));
    
    await expect(element(by.text('First name is required'))).toBeVisible();
    await expect(element(by.text('Last name is required'))).toBeVisible();
    await expect(element(by.text('Email is required'))).toBeVisible();
  });

  it('should validate email format', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('editProfileButton'));
    await helpers.waitForVisible(by.id('editProfileScreen'));
    
    // Enter invalid email
    await helpers.clearText(by.id('emailInput'));
    await helpers.typeText(by.id('emailInput'), 'invalid-email');
    
    await helpers.tapElement(by.id('saveChangesButton'));
    
    // Should show email format error
    await helpers.waitForVisible(by.id('emailError'));
    await expect(element(by.text('Please enter a valid email address'))).toBeVisible();
  });

  it('should allow changing profile picture', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('editProfileButton'));
    await helpers.waitForVisible(by.id('editProfileScreen'));
    
    // Tap on profile avatar to change picture
    await helpers.tapElement(by.id('profileAvatarEdit'));
    await helpers.waitForVisible(by.id('imagePickerModal'));
    
    // Check image picker options
    await expect(element(by.id('takePhotoOption'))).toBeVisible();
    await expect(element(by.id('chooseFromGalleryOption'))).toBeVisible();
    await expect(element(by.id('removePhotoOption'))).toBeVisible();
    
    // Select take photo option
    await helpers.tapElement(by.id('takePhotoOption'));
    
    // Should request camera permission or open camera
    // Note: In test environment, this might be mocked
    await helpers.waitForVisible(by.id('editProfileScreen'), 5000);
  });

  it('should navigate to ride history', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('rideHistoryOption'));
    await helpers.waitForVisible(by.id('rideHistoryScreen'));
    
    // Check ride history elements
    await expect(element(by.id('rideHistoryList'))).toBeVisible();
    await expect(element(by.id('filterButton'))).toBeVisible();
    await expect(element(by.id('searchInput'))).toBeVisible();
  });

  it('should display ride history with filters', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('rideHistoryOption'));
    await helpers.waitForVisible(by.id('rideHistoryScreen'));
    
    // Open filter options
    await helpers.tapElement(by.id('filterButton'));
    await helpers.waitForVisible(by.id('filterModal'));
    
    // Check filter options
    await expect(element(by.id('allRidesFilter'))).toBeVisible();
    await expect(element(by.id('completedRidesFilter'))).toBeVisible();
    await expect(element(by.id('cancelledRidesFilter'))).toBeVisible();
    await expect(element(by.id('dateRangeFilter'))).toBeVisible();
    
    // Select completed rides filter
    await helpers.tapElement(by.id('completedRidesFilter'));
    await helpers.tapElement(by.id('applyFilterButton'));
    
    await helpers.waitForVisible(by.id('rideHistoryScreen'));
    
    // Should show only completed rides
    await expect(element(by.id('activeFilterIndicator'))).toHaveText('Completed Rides');
  });

  it('should allow searching ride history', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('rideHistoryOption'));
    await helpers.waitForVisible(by.id('rideHistoryScreen'));
    
    // Search for specific destination
    await helpers.typeText(by.id('searchInput'), 'Airport');
    
    // Should filter rides containing 'Airport'
    await helpers.waitForVisible(by.id('searchResults'));
    
    // Clear search
    await helpers.clearText(by.id('searchInput'));
    await helpers.waitForVisible(by.id('rideHistoryList'));
  });

  it('should navigate to settings screen', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('settingsOption'));
    await helpers.waitForVisible(by.id('settingsScreen'));
    
    // Check settings options
    await expect(element(by.id('notificationSettings'))).toBeVisible();
    await expect(element(by.id('privacySettings'))).toBeVisible();
    await expect(element(by.id('languageSettings'))).toBeVisible();
    await expect(element(by.id('themeSettings'))).toBeVisible();
    await expect(element(by.id('locationSettings'))).toBeVisible();
    await expect(element(by.id('accountSettings'))).toBeVisible();
  });

  it('should allow toggling notification settings', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('settingsOption'));
    await helpers.waitForVisible(by.id('settingsScreen'));
    
    await helpers.tapElement(by.id('notificationSettings'));
    await helpers.waitForVisible(by.id('notificationSettingsScreen'));
    
    // Check notification toggles
    await expect(element(by.id('pushNotificationsToggle'))).toBeVisible();
    await expect(element(by.id('emailNotificationsToggle'))).toBeVisible();
    await expect(element(by.id('smsNotificationsToggle'))).toBeVisible();
    await expect(element(by.id('rideUpdatesToggle'))).toBeVisible();
    await expect(element(by.id('promotionalToggle'))).toBeVisible();
    
    // Toggle push notifications
    await helpers.tapElement(by.id('pushNotificationsToggle'));
    
    // Should show confirmation or update immediately
    await helpers.waitForVisible(by.id('settingsSavedIndicator'), 3000);
  });

  it('should allow changing app language', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('settingsOption'));
    await helpers.waitForVisible(by.id('settingsScreen'));
    
    await helpers.tapElement(by.id('languageSettings'));
    await helpers.waitForVisible(by.id('languageSettingsScreen'));
    
    // Check available languages
    await expect(element(by.id('englishOption'))).toBeVisible();
    await expect(element(by.id('spanishOption'))).toBeVisible();
    await expect(element(by.id('frenchOption'))).toBeVisible();
    
    // Select Spanish
    await helpers.tapElement(by.id('spanishOption'));
    
    // Should show confirmation dialog
    await helpers.waitForVisible(by.id('languageChangeConfirmation'));
    await expect(element(by.text('Restart app to apply language changes?'))).toBeVisible();
    
    await helpers.tapElement(by.id('confirmLanguageChange'));
    
    // App should restart or show restart prompt
    await helpers.waitForVisible(by.id('restartPrompt'), 5000);
  });

  it('should allow changing app theme', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('settingsOption'));
    await helpers.waitForVisible(by.id('settingsScreen'));
    
    await helpers.tapElement(by.id('themeSettings'));
    await helpers.waitForVisible(by.id('themeSettingsScreen'));
    
    // Check theme options
    await expect(element(by.id('lightThemeOption'))).toBeVisible();
    await expect(element(by.id('darkThemeOption'))).toBeVisible();
    await expect(element(by.id('systemThemeOption'))).toBeVisible();
    
    // Select dark theme
    await helpers.tapElement(by.id('darkThemeOption'));
    
    // Theme should change immediately
    await helpers.waitForVisible(by.id('themeAppliedIndicator'), 3000);
    
    // Go back and verify theme is applied
    await helpers.tapElement(by.id('backButton'));
    await helpers.waitForVisible(by.id('settingsScreen'));
    
    // Check if dark theme is applied (background color change)
    await expect(element(by.id('settingsScreen'))).toHaveId('darkThemeApplied');
  });

  it('should navigate to help and support', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('helpSupportOption'));
    await helpers.waitForVisible(by.id('helpSupportScreen'));
    
    // Check help options
    await expect(element(by.id('faqSection'))).toBeVisible();
    await expect(element(by.id('contactSupportSection'))).toBeVisible();
    await expect(element(by.id('reportIssueSection'))).toBeVisible();
    await expect(element(by.id('feedbackSection'))).toBeVisible();
  });

  it('should display FAQ section', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('helpSupportOption'));
    await helpers.waitForVisible(by.id('helpSupportScreen'));
    
    await helpers.tapElement(by.id('faqSection'));
    await helpers.waitForVisible(by.id('faqScreen'));
    
    // Check FAQ categories
    await expect(element(by.id('ridingFaqCategory'))).toBeVisible();
    await expect(element(by.id('paymentFaqCategory'))).toBeVisible();
    await expect(element(by.id('accountFaqCategory'))).toBeVisible();
    await expect(element(by.id('safetyFaqCategory'))).toBeVisible();
    
    // Expand a FAQ category
    await helpers.tapElement(by.id('ridingFaqCategory'));
    await helpers.waitForVisible(by.id('ridingFaqList'));
    
    // Check individual FAQ items
    await expect(element(by.id('faqItem-0'))).toBeVisible();
    await helpers.tapElement(by.id('faqItem-0'));
    await helpers.waitForVisible(by.id('faqAnswer-0'));
  });

  it('should allow contacting support', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('helpSupportOption'));
    await helpers.waitForVisible(by.id('helpSupportScreen'));
    
    await helpers.tapElement(by.id('contactSupportSection'));
    await helpers.waitForVisible(by.id('contactSupportScreen'));
    
    // Check contact options
    await expect(element(by.id('liveChatOption'))).toBeVisible();
    await expect(element(by.id('emailSupportOption'))).toBeVisible();
    await expect(element(by.id('phoneSupportOption'))).toBeVisible();
    
    // Try live chat
    await helpers.tapElement(by.id('liveChatOption'));
    await helpers.waitForVisible(by.id('liveChatScreen'), 10000);
    
    await expect(element(by.id('chatInput'))).toBeVisible();
    await expect(element(by.id('sendButton'))).toBeVisible();
  });

  it('should allow reporting an issue', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('helpSupportOption'));
    await helpers.waitForVisible(by.id('helpSupportScreen'));
    
    await helpers.tapElement(by.id('reportIssueSection'));
    await helpers.waitForVisible(by.id('reportIssueScreen'));
    
    // Fill issue report form
    await helpers.tapElement(by.id('issueCategoryDropdown'));
    await helpers.waitForVisible(by.id('issueCategoryModal'));
    await helpers.tapElement(by.id('category-payment'));
    
    await helpers.waitForVisible(by.id('reportIssueScreen'));
    
    await helpers.typeText(by.id('issueSubjectInput'), 'Payment not processed');
    await helpers.typeText(by.id('issueDescriptionInput'), 'My payment was charged but ride was not confirmed');
    
    // Submit issue report
    await helpers.tapElement(by.id('submitIssueButton'));
    
    // Should show success message
    await helpers.waitForVisible(by.id('issueSubmittedMessage'));
    await expect(element(by.text('Issue reported successfully'))).toBeVisible();
  });

  it('should handle logout confirmation', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    await helpers.tapElement(by.id('logoutOption'));
    
    // Should show logout confirmation
    await helpers.waitForVisible(by.id('logoutConfirmationModal'));
    await expect(element(by.text('Are you sure you want to logout?'))).toBeVisible();
    await expect(element(by.id('confirmLogoutButton'))).toBeVisible();
    await expect(element(by.id('cancelLogoutButton'))).toBeVisible();
    
    // Cancel logout
    await helpers.tapElement(by.id('cancelLogoutButton'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    // Try logout again and confirm
    await helpers.tapElement(by.id('logoutOption'));
    await helpers.waitForVisible(by.id('logoutConfirmationModal'));
    await helpers.tapElement(by.id('confirmLogoutButton'));
    
    // Should navigate to welcome screen
    await helpers.waitForVisible(by.id('welcomeScreen'), 10000);
  });

  it('should display user statistics', async () => {
    await helpers.tapElement(by.id('profileTab'));
    await helpers.waitForVisible(by.id('profileScreen'));
    
    // Check user statistics section
    await expect(element(by.id('userStatsSection'))).toBeVisible();
    await expect(element(by.id('totalRidesCount'))).toBeVisible();
    await expect(element(by.id('totalDistanceCount'))).toBeVisible();
    await expect(element(by.id('averageRatingDisplay'))).toBeVisible();
    await expect(element(by.id('totalSavingsCount'))).toBeVisible();
    
    // Tap on stats to see detailed view
    await helpers.tapElement(by.id('userStatsSection'));
    await helpers.waitForVisible(by.id('detailedStatsScreen'));
    
    await expect(element(by.id('monthlyRideChart'))).toBeVisible();
    await expect(element(by.id('rideTypeBreakdown'))).toBeVisible();
    await expect(element(by.id('spendingAnalytics'))).toBeVisible();
  });
});