const { device, element, by, waitFor } = require('detox');

// Global test timeout
jest.setTimeout(120000);

// Helper functions for common actions
global.helpers = {
  // Wait for element to be visible and tap it
  async tapElement(matcher, timeout = 10000) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
    await element(matcher).tap();
  },

  // Type text into an input field
  async typeText(matcher, text, timeout = 10000) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
    await element(matcher).typeText(text);
  },

  // Clear text from an input field
  async clearText(matcher, timeout = 10000) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
    await element(matcher).clearText();
  },

  // Replace text in an input field
  async replaceText(matcher, text, timeout = 10000) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
    await element(matcher).replaceText(text);
  },

  // Scroll to element and tap it
  async scrollAndTap(scrollMatcher, elementMatcher, direction = 'down', timeout = 10000) {
    await waitFor(element(elementMatcher))
      .toBeVisible()
      .whileElement(scrollMatcher)
      .scroll(200, direction)
      .withTimeout(timeout);
    await element(elementMatcher).tap();
  },

  // Wait for element to exist
  async waitForElement(matcher, timeout = 10000) {
    await waitFor(element(matcher))
      .toExist()
      .withTimeout(timeout);
  },

  // Wait for element to be visible
  async waitForVisible(matcher, timeout = 10000) {
    await waitFor(element(matcher))
      .toBeVisible()
      .withTimeout(timeout);
  },

  // Wait for element to disappear
  async waitForNotVisible(matcher, timeout = 10000) {
    await waitFor(element(matcher))
      .not.toBeVisible()
      .withTimeout(timeout);
  },

  // Login helper
  async login(email = 'test@example.com', password = 'password123') {
    // Navigate to login if not already there
    try {
      await this.waitForVisible(by.id('loginScreen'), 2000);
    } catch {
      // Try to find login button on welcome/auth screen
      try {
        await this.tapElement(by.id('loginButton'));
      } catch {
        // App might already be logged in, try to logout first
        try {
          await this.tapElement(by.id('profileTab'));
          await this.tapElement(by.id('logoutButton'));
          await this.tapElement(by.id('loginButton'));
        } catch {
          // If all fails, reload the app
          await device.reloadReactNative();
          await this.tapElement(by.id('loginButton'));
        }
      }
    }

    // Perform login
    await this.replaceText(by.id('emailInput'), email);
    await this.replaceText(by.id('passwordInput'), password);
    await this.tapElement(by.id('loginSubmitButton'));
    
    // Wait for login to complete
    await this.waitForVisible(by.id('homeScreen'), 15000);
  },

  // Logout helper
  async logout() {
    try {
      await this.tapElement(by.id('profileTab'));
      await this.tapElement(by.id('logoutButton'));
      await this.waitForVisible(by.id('welcomeScreen'), 10000);
    } catch {
      // Logout failed - ignore in cleanup
    }
  },

  // Reset app state
  async resetApp() {
    await device.reloadReactNative();
    // Wait for app to load
    await this.waitForElement(by.id('appContainer'), 15000);
  },

  // Mock location for testing
  async setLocation(latitude, longitude) {
    if (device.getPlatform() === 'ios') {
      await device.setLocation(latitude, longitude);
    }
    // For Android, location mocking might need additional setup
  },

  // Take screenshot for debugging
  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await device.takeScreenshot(`${name}-${timestamp}`);
  },
};

// Global setup for each test
beforeEach(async () => {
  // Ensure app is in a clean state
  await device.reloadReactNative();
});

// Global cleanup
afterAll(async () => {
  // Any global cleanup if needed
});