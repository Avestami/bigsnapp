const { device, expect, element, by } = require('detox');

describe('Login Flow', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  afterEach(async () => {
    try {
      await helpers.logout();
    } catch {
      // Ignore logout errors in cleanup
    }
  });

  it('should display welcome screen on app launch', async () => {
    await helpers.waitForVisible(by.id('welcomeScreen'));
    await expect(element(by.id('welcomeTitle'))).toBeVisible();
    await expect(element(by.id('loginButton'))).toBeVisible();
    await expect(element(by.id('signupButton'))).toBeVisible();
  });

  it('should navigate to login screen when login button is tapped', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    await expect(element(by.id('emailInput'))).toBeVisible();
    await expect(element(by.id('passwordInput'))).toBeVisible();
    await expect(element(by.id('loginSubmitButton'))).toBeVisible();
  });

  it('should show validation errors for empty fields', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    // Try to submit with empty fields
    await helpers.tapElement(by.id('loginSubmitButton'));
    
    // Check for validation errors
    await helpers.waitForVisible(by.id('emailError'));
    await helpers.waitForVisible(by.id('passwordError'));
    await expect(element(by.text('Email is required'))).toBeVisible();
    await expect(element(by.text('Password is required'))).toBeVisible();
  });

  it('should show error for invalid email format', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    await helpers.typeText(by.id('emailInput'), 'invalid-email');
    await helpers.typeText(by.id('passwordInput'), 'password123');
    await helpers.tapElement(by.id('loginSubmitButton'));
    
    await helpers.waitForVisible(by.id('emailError'));
    await expect(element(by.text('Please enter a valid email'))).toBeVisible();
  });

  it('should show error for incorrect credentials', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    await helpers.typeText(by.id('emailInput'), 'wrong@example.com');
    await helpers.typeText(by.id('passwordInput'), 'wrongpassword');
    await helpers.tapElement(by.id('loginSubmitButton'));
    
    // Wait for error message
    await helpers.waitForVisible(by.id('loginError'));
    await expect(element(by.text('Invalid email or password'))).toBeVisible();
  });

  it('should successfully login with valid credentials', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    await helpers.typeText(by.id('emailInput'), 'test@example.com');
    await helpers.typeText(by.id('passwordInput'), 'password123');
    await helpers.tapElement(by.id('loginSubmitButton'));
    
    // Wait for successful login and navigation to home
    await helpers.waitForVisible(by.id('homeScreen'), 15000);
    await expect(element(by.id('welcomeMessage'))).toBeVisible();
    await expect(element(by.id('rideTab'))).toBeVisible();
    await expect(element(by.id('deliveryTab'))).toBeVisible();
  });

  it('should show loading state during login', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    await helpers.typeText(by.id('emailInput'), 'test@example.com');
    await helpers.typeText(by.id('passwordInput'), 'password123');
    await helpers.tapElement(by.id('loginSubmitButton'));
    
    // Check loading state appears
    await helpers.waitForVisible(by.id('loginLoading'));
    await expect(element(by.id('loginSubmitButton'))).not.toBeVisible();
    
    // Wait for login to complete
    await helpers.waitForVisible(by.id('homeScreen'), 15000);
  });

  it('should toggle password visibility', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    await helpers.typeText(by.id('passwordInput'), 'password123');
    
    // Password should be hidden by default
    await expect(element(by.id('passwordInput'))).toHaveText('•••••••••••');
    
    // Tap show password button
    await helpers.tapElement(by.id('showPasswordButton'));
    await expect(element(by.id('passwordInput'))).toHaveText('password123');
    
    // Tap hide password button
    await helpers.tapElement(by.id('hidePasswordButton'));
    await expect(element(by.id('passwordInput'))).toHaveText('•••••••••••');
  });

  it('should navigate to forgot password screen', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    await helpers.tapElement(by.id('forgotPasswordButton'));
    await helpers.waitForVisible(by.id('forgotPasswordScreen'));
    await expect(element(by.id('resetEmailInput'))).toBeVisible();
    await expect(element(by.id('sendResetButton'))).toBeVisible();
  });

  it('should navigate back from login screen', async () => {
    await helpers.tapElement(by.id('loginButton'));
    await helpers.waitForVisible(by.id('loginScreen'));
    
    await helpers.tapElement(by.id('backButton'));
    await helpers.waitForVisible(by.id('welcomeScreen'));
    await expect(element(by.id('welcomeTitle'))).toBeVisible();
  });
});