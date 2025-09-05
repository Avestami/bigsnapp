import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders as render, createMockApiResponse, createMockErrorResponse } from '../../utils/test-utils';
import SettingsPage from '../SettingsPage';
import { adminApi } from '../../services/api';
import { message } from 'antd';

// Mock the API service
jest.mock('../../services/api', () => ({
  adminApi: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
    getSystemStats: jest.fn(),
    clearCache: jest.fn(),
    exportData: jest.fn(),
  },
}));

// Mock antd message
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  message: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  },
}));

const mockAdminApi = adminApi as jest.Mocked<typeof adminApi>;
const mockMessage = message as jest.Mocked<typeof message>;

const mockSettings = {
  general: {
    appName: 'SnappClone',
    supportEmail: 'support@snappclone.com',
    maintenanceMode: false,
    maxRideDistance: 50,
    defaultCurrency: 'USD'
  },
  pricing: {
    baseFare: 2.50,
    perKmRate: 1.20,
    perMinuteRate: 0.30,
    surgePricingEnabled: true,
    maxSurgeMultiplier: 3.0
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false
  },
  security: {
    twoFactorAuth: true,
    sessionTimeout: 30,
    passwordMinLength: 8,
    maxLoginAttempts: 5
  }
};

const mockSystemStats = {
  uptime: '15 days, 6 hours',
  memoryUsage: '2.4 GB / 8 GB',
  cpuUsage: '45%',
  diskUsage: '120 GB / 500 GB',
  activeConnections: 1250,
  cacheSize: '450 MB'
};

describe('SettingsPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAdminApi.getSettings.mockResolvedValue(createMockApiResponse(mockSettings));
    mockAdminApi.getSystemStats.mockResolvedValue(createMockApiResponse(mockSystemStats));
  });

  it('renders settings page with correct title', () => {
    render(<SettingsPage />);

    expect(screen.getByText('System Settings')).toBeInTheDocument();
  });

  it('displays settings tabs correctly', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('System')).toBeInTheDocument();
    });
  });

  it('displays general settings when data loads successfully', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('SnappClone')).toBeInTheDocument();
      expect(screen.getByDisplayValue('support@snappclone.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
      expect(screen.getByDisplayValue('USD')).toBeInTheDocument();
    });
  });

  it('displays pricing settings correctly', async () => {
    render(<SettingsPage />);

    // Switch to pricing tab
    const pricingTab = screen.getByText('Pricing');
    await user.click(pricingTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue('2.50')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1.20')).toBeInTheDocument();
      expect(screen.getByDisplayValue('0.30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3.0')).toBeInTheDocument();
    });
  });

  it('displays notification settings with correct toggle states', async () => {
    render(<SettingsPage />);

    // Switch to notifications tab
    const notificationsTab = screen.getByText('Notifications');
    await user.click(notificationsTab);

    await waitFor(() => {
      const toggles = screen.getAllByRole('switch');
      expect(toggles).toHaveLength(4);
      
      // Check that email, SMS, and push notifications are enabled
      expect(toggles[0]).toBeChecked(); // Email
      expect(toggles[1]).toBeChecked(); // SMS
      expect(toggles[2]).toBeChecked(); // Push
      expect(toggles[3]).not.toBeChecked(); // Marketing
    });
  });

  it('displays security settings correctly', async () => {
    render(<SettingsPage />);

    // Switch to security tab
    const securityTab = screen.getByText('Security');
    await user.click(securityTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('8')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
      
      const twoFactorToggle = screen.getByRole('switch');
      expect(twoFactorToggle).toBeChecked();
    });
  });

  it('displays system statistics correctly', async () => {
    render(<SettingsPage />);

    // Switch to system tab
    const systemTab = screen.getByText('System');
    await user.click(systemTab);

    await waitFor(() => {
      expect(screen.getByText('15 days, 6 hours')).toBeInTheDocument();
      expect(screen.getByText('2.4 GB / 8 GB')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('120 GB / 500 GB')).toBeInTheDocument();
      expect(screen.getByText('1,250')).toBeInTheDocument();
      expect(screen.getByText('450 MB')).toBeInTheDocument();
    });
  });

  it('handles general settings update successfully', async () => {
    mockAdminApi.updateSettings.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('SnappClone')).toBeInTheDocument();
    });

    const appNameInput = screen.getByDisplayValue('SnappClone');
    await user.clear(appNameInput);
    await user.type(appNameInput, 'Updated App Name');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAdminApi.updateSettings).toHaveBeenCalledWith(
        'general',
        expect.objectContaining({
          appName: 'Updated App Name'
        })
      );
      expect(mockMessage.success).toHaveBeenCalledWith('Settings updated successfully');
    });
  });

  it('handles pricing settings update successfully', async () => {
    mockAdminApi.updateSettings.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<SettingsPage />);

    // Switch to pricing tab
    const pricingTab = screen.getByText('Pricing');
    await user.click(pricingTab);

    await waitFor(() => {
      expect(screen.getByDisplayValue('2.50')).toBeInTheDocument();
    });

    const baseFareInput = screen.getByDisplayValue('2.50');
    await user.clear(baseFareInput);
    await user.type(baseFareInput, '3.00');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAdminApi.updateSettings).toHaveBeenCalledWith(
        'pricing',
        expect.objectContaining({
          baseFare: 3.00
        })
      );
      expect(mockMessage.success).toHaveBeenCalledWith('Pricing settings updated successfully');
    });
  });

  it('handles notification toggle changes', async () => {
    mockAdminApi.updateSettings.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<SettingsPage />);

    // Switch to notifications tab
    const notificationsTab = screen.getByText('Notifications');
    await user.click(notificationsTab);

    await waitFor(() => {
      const toggles = screen.getAllByRole('switch');
      expect(toggles).toHaveLength(4);
    });

    // Toggle marketing emails
    const marketingToggle = screen.getAllByRole('switch')[3];
    await user.click(marketingToggle);

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAdminApi.updateSettings).toHaveBeenCalledWith(
        'notifications',
        expect.objectContaining({
          marketingEmails: true
        })
      );
    });
  });

  it('handles maintenance mode toggle', async () => {
    mockAdminApi.updateSettings.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<SettingsPage />);

    await waitFor(() => {
      const maintenanceToggle = screen.getByLabelText(/maintenance mode/i);
      expect(maintenanceToggle).not.toBeChecked();
    });

    const maintenanceToggle = screen.getByLabelText(/maintenance mode/i);
    await user.click(maintenanceToggle);

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMessage.warning).toHaveBeenCalledWith('Maintenance mode enabled. Users will not be able to access the app.');
    });
  });

  it('handles cache clearing successfully', async () => {
    mockAdminApi.clearCache.mockResolvedValue(createMockApiResponse({ success: true }));

    render(<SettingsPage />);

    // Switch to system tab
    const systemTab = screen.getByText('System');
    await user.click(systemTab);

    await waitFor(() => {
      expect(screen.getByText('Clear Cache')).toBeInTheDocument();
    });

    const clearCacheButton = screen.getByText('Clear Cache');
    await user.click(clearCacheButton);

    await waitFor(() => {
      expect(mockAdminApi.clearCache).toHaveBeenCalled();
      expect(mockMessage.success).toHaveBeenCalledWith('Cache cleared successfully');
    });
  });

  it('handles data export successfully', async () => {
    mockAdminApi.exportData.mockResolvedValue(createMockApiResponse({ downloadUrl: 'https://example.com/export.zip' }));

    render(<SettingsPage />);

    // Switch to system tab
    const systemTab = screen.getByText('System');
    await user.click(systemTab);

    await waitFor(() => {
      expect(screen.getByText('Export Data')).toBeInTheDocument();
    });

    const exportButton = screen.getByText('Export Data');
    await user.click(exportButton);

    await waitFor(() => {
      expect(mockAdminApi.exportData).toHaveBeenCalled();
      expect(mockMessage.success).toHaveBeenCalledWith('Data export initiated. Download will start shortly.');
    });
  });

  it('handles settings update error', async () => {
    mockAdminApi.updateSettings.mockRejectedValue(createMockErrorResponse('Update failed'));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('SnappClone')).toBeInTheDocument();
    });

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMessage.error).toHaveBeenCalledWith('Failed to update settings');
    });
  });

  it('validates required fields', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('SnappClone')).toBeInTheDocument();
    });

    // Clear required field
    const appNameInput = screen.getByDisplayValue('SnappClone');
    await user.clear(appNameInput);

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('App name is required')).toBeInTheDocument();
    });
  });

  it('validates email format', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('support@snappclone.com')).toBeInTheDocument();
    });

    const emailInput = screen.getByDisplayValue('support@snappclone.com');
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('validates numeric fields', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('50')).toBeInTheDocument();
    });

    const maxDistanceInput = screen.getByDisplayValue('50');
    await user.clear(maxDistanceInput);
    await user.type(maxDistanceInput, '-10');

    const saveButton = screen.getByText('Save Changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Max ride distance must be positive')).toBeInTheDocument();
    });
  });

  it('handles API error when loading settings', async () => {
    mockAdminApi.getSettings.mockRejectedValue(createMockErrorResponse('Failed to load settings'));

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load settings')).toBeInTheDocument();
    });
  });

  it('displays loading state initially', () => {
    render(<SettingsPage />);

    expect(screen.getByLabelText(/loading/)).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('SnappClone')).toBeInTheDocument();
    });

    const refreshButton = screen.getByLabelText(/reload/);
    await user.click(refreshButton);

    await waitFor(() => {
      expect(mockAdminApi.getSettings).toHaveBeenCalledTimes(2);
    });
  });

  it('displays currency options correctly', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      const currencySelect = screen.getByDisplayValue('USD');
      expect(currencySelect).toBeInTheDocument();
    });

    const currencySelect = screen.getByDisplayValue('USD');
    await user.click(currencySelect);

    await waitFor(() => {
      expect(screen.getByText('EUR')).toBeInTheDocument();
      expect(screen.getByText('GBP')).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog for critical changes', async () => {
    render(<SettingsPage />);

    await waitFor(() => {
      const maintenanceToggle = screen.getByLabelText(/maintenance mode/i);
      expect(maintenanceToggle).toBeInTheDocument();
    });

    const maintenanceToggle = screen.getByLabelText(/maintenance mode/i);
    await user.click(maintenanceToggle);

    await waitFor(() => {
      expect(screen.getByText('Enable Maintenance Mode?')).toBeInTheDocument();
      expect(screen.getByText('This will prevent users from accessing the application.')).toBeInTheDocument();
    });
  });

  it('handles system stats refresh', async () => {
    render(<SettingsPage />);

    // Switch to system tab
    const systemTab = screen.getByText('System');
    await user.click(systemTab);

    await waitFor(() => {
      expect(screen.getByText('15 days, 6 hours')).toBeInTheDocument();
    });

    const refreshStatsButton = screen.getByText('Refresh Stats');
    await user.click(refreshStatsButton);

    await waitFor(() => {
      expect(mockAdminApi.getSystemStats).toHaveBeenCalledTimes(2);
    });
  });

  it('displays progress indicators for system resources', async () => {
    render(<SettingsPage />);

    // Switch to system tab
    const systemTab = screen.getByText('System');
    await user.click(systemTab);

    await waitFor(() => {
      // Check for progress bars or indicators
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });
});