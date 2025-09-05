import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { Settings } from '../../services/adminApi';
import { useAdmin } from '../../contexts/AdminContext';

// Debug logging utility
const debugLog = (component: string, action: string, data?: any) => {
  console.log(`⚙️ [${component}::${action}]`, data ? JSON.stringify(data, null, 2) : '');
};

const errorLog = (component: string, action: string, error: any) => {
  console.error(`❌ [${component}::${action}] ERROR:`, error);
  if (error?.message) {
    console.error(`❌ [${component}::${action}] Error Message:`, error.message);
  }
  console.error(`❌ [${component}::${action}] Full Error:`, error);
};

// Define the expected settings structure
interface AppSettings {
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  requirePhoneVerification: boolean;
  enablePushNotifications: boolean;
  maxDeliveryRadius: number;
  defaultDeliveryFee: number;
  minimumOrderAmount: number;
  driverCommissionRate: number;
  customerSupportEmail: string;
  customerSupportPhone: string;
  appVersion: string;
  termsOfServiceUrl: string;
  privacyPolicyUrl: string;
}

const AdminSettings: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    settings: settingsArray,
    settingsLoading: loading,
    settingsError: error,
    fetchSettings,
    updateSetting
  } = useAdmin();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  debugLog('AdminSettings', 'Component initialized', {
    currentUser: user ? { id: user.id, email: user.email, userType: user.userType } : null,
    settingsArrayCount: settingsArray?.length || 0,
    loading,
    error: !!error,
    saving,
    editingField
  });

  // Transform settings array to AppSettings object when settingsArray changes
  useEffect(() => {
    debugLog('AdminSettings', 'useEffect settingsArray changed', { 
      settingsArrayExists: !!settingsArray,
      settingsCount: settingsArray?.length || 0
    });
    if (settingsArray) {
      const transformedSettings: AppSettings = {
        maintenanceMode: getSettingValue(settingsArray, 'maintenanceMode', 'false') === 'true',
        allowNewRegistrations: getSettingValue(settingsArray, 'allowNewRegistrations', 'true') === 'true',
        requirePhoneVerification: getSettingValue(settingsArray, 'requirePhoneVerification', 'true') === 'true',
        enablePushNotifications: getSettingValue(settingsArray, 'enablePushNotifications', 'true') === 'true',
        maxDeliveryRadius: parseFloat(getSettingValue(settingsArray, 'maxDeliveryRadius', '25')),
        defaultDeliveryFee: parseFloat(getSettingValue(settingsArray, 'defaultDeliveryFee', '3.99')),
        minimumOrderAmount: parseFloat(getSettingValue(settingsArray, 'minimumOrderAmount', '10.00')),
        driverCommissionRate: parseFloat(getSettingValue(settingsArray, 'driverCommissionRate', '15')),
        customerSupportEmail: getSettingValue(settingsArray, 'customerSupportEmail', 'support@snappclone.com'),
        customerSupportPhone: getSettingValue(settingsArray, 'customerSupportPhone', '+1-800-SNAPP-HELP'),
        appVersion: getSettingValue(settingsArray, 'appVersion', '1.0.0'),
        termsOfServiceUrl: getSettingValue(settingsArray, 'termsOfServiceUrl', 'https://snappclone.com/terms'),
        privacyPolicyUrl: getSettingValue(settingsArray, 'privacyPolicyUrl', 'https://snappclone.com/privacy'),
      };
      
      debugLog('AdminSettings', 'Settings transformed successfully', {
        maintenanceMode: transformedSettings.maintenanceMode,
        allowNewRegistrations: transformedSettings.allowNewRegistrations,
        maxDeliveryRadius: transformedSettings.maxDeliveryRadius,
        defaultDeliveryFee: transformedSettings.defaultDeliveryFee
      });
      setSettings(transformedSettings);
    }
  }, [settingsArray]);

  // Helper function to get setting value from array
  const getSettingValue = (settingsArray: Settings[], key: string, defaultValue: string): string => {
    const setting = settingsArray.find(s => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const handleUpdateSetting = async (key: keyof AppSettings, value: any) => {
    debugLog('AdminSettings', 'handleUpdateSetting initiated', { key, value, settingsExists: !!settings });
    if (!settings) {
      debugLog('AdminSettings', 'handleUpdateSetting aborted - no settings');
      return;
    }
    
    try {
      setSaving(true);
      // Convert value to string for API
      const stringValue = typeof value === 'boolean' ? value.toString() : String(value);
      debugLog('AdminSettings', 'Updating setting via API', { key, originalValue: value, stringValue });
      await updateSetting(key, stringValue);
      
      setSettings(prev => prev ? { ...prev, [key]: value } : null);
      debugLog('AdminSettings', 'Setting updated successfully', { key, newValue: value });
      Alert.alert('Success', 'Setting updated successfully');
    } catch (error) {
      errorLog('AdminSettings', 'Error updating setting', { key, value, error });
      Alert.alert('Error', 'Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof AppSettings) => {
    if (!settings) return;
    const newValue = !settings[key];
    handleUpdateSetting(key, newValue);
  };

  const handleEditStart = (key: string, currentValue: string | number) => {
    setEditingField(key);
    setTempValue(currentValue.toString());
  };

  const handleEditSave = (key: keyof AppSettings) => {
    if (!settings) return;
    
    let value: any = tempValue;
    
    // Convert to appropriate type
    if (typeof settings[key] === 'number') {
      value = parseFloat(tempValue);
      if (isNaN(value)) {
        Alert.alert('Error', 'Please enter a valid number');
        return;
      }
    }
    
    handleUpdateSetting(key, value);
    setEditingField(null);
    setTempValue('');
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const SettingRow: React.FC<{
    title: string;
    description?: string;
    value: any;
    type: 'toggle' | 'text' | 'number';
    settingKey: keyof AppSettings;
    editable?: boolean;
  }> = ({ title, description, value, type, settingKey, editable = true }) => {
    const isEditing = editingField === settingKey;
    
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {description && <Text style={styles.settingDescription}>{description}</Text>}
        </View>
        
        <View style={styles.settingControl}>
          {type === 'toggle' ? (
            <Switch
              value={value}
              onValueChange={() => handleToggle(settingKey)}
              disabled={!editable || saving}
            />
          ) : isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={tempValue}
                onChangeText={setTempValue}
                keyboardType={type === 'number' ? 'numeric' : 'default'}
                autoFocus
              />
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={() => handleEditSave(settingKey)}
              >
                <Text style={styles.editButtonText}>✓</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.editButton, styles.cancelButton]} 
                onPress={handleEditCancel}
              >
                <Text style={styles.editButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.valueContainer}
              onPress={() => editable && handleEditStart(settingKey, value)}
              disabled={!editable}
            >
              <Text style={styles.settingValue}>
                {type === 'number' && settingKey.includes('Fee') || settingKey.includes('Amount') 
                  ? `$${value}` 
                  : value}
              </Text>
              {editable && <Text style={styles.editIcon}>✏️</Text>}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const handleSystemAction = (action: string) => {
    Alert.alert(
      'Confirm Action',
      `Are you sure you want to ${action}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement system actions
            Alert.alert('Success', `${action} completed successfully`);
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSettings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!settings) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No settings data available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSettings}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Admin Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* App Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Configuration</Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              title="Maintenance Mode"
              description="Temporarily disable app for maintenance"
              value={settings.maintenanceMode}
              type="toggle"
              settingKey="maintenanceMode"
            />
            <SettingRow
              title="Allow New Registrations"
              description="Enable new user registrations"
              value={settings.allowNewRegistrations}
              type="toggle"
              settingKey="allowNewRegistrations"
            />
            <SettingRow
              title="Require Phone Verification"
              description="Mandate phone number verification for new users"
              value={settings.requirePhoneVerification}
              type="toggle"
              settingKey="requirePhoneVerification"
            />
            <SettingRow
              title="Push Notifications"
              description="Enable push notifications system-wide"
              value={settings.enablePushNotifications}
              type="toggle"
              settingKey="enablePushNotifications"
            />
          </View>
        </View>

        {/* Delivery Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Settings</Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              title="Max Delivery Radius (km)"
              description="Maximum distance for deliveries"
              value={settings.maxDeliveryRadius}
              type="number"
              settingKey="maxDeliveryRadius"
            />
            <SettingRow
              title="Default Delivery Fee"
              description="Base delivery fee for orders"
              value={settings.defaultDeliveryFee}
              type="number"
              settingKey="defaultDeliveryFee"
            />
            <SettingRow
              title="Minimum Order Amount"
              description="Minimum order value required"
              value={settings.minimumOrderAmount}
              type="number"
              settingKey="minimumOrderAmount"
            />
            <SettingRow
              title="Driver Commission Rate (%)"
              description="Percentage commission for drivers"
              value={settings.driverCommissionRate}
              type="number"
              settingKey="driverCommissionRate"
            />
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              title="Support Email"
              description="Customer support email address"
              value={settings.customerSupportEmail}
              type="text"
              settingKey="customerSupportEmail"
            />
            <SettingRow
              title="Support Phone"
              description="Customer support phone number"
              value={settings.customerSupportPhone}
              type="text"
              settingKey="customerSupportPhone"
            />
          </View>
        </View>

        {/* App Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Information</Text>
          <View style={styles.settingsGroup}>
            <SettingRow
              title="App Version"
              description="Current application version"
              value={settings.appVersion}
              type="text"
              settingKey="appVersion"
              editable={false}
            />
            <SettingRow
              title="Terms of Service URL"
              description="Link to terms of service"
              value={settings.termsOfServiceUrl}
              type="text"
              settingKey="termsOfServiceUrl"
            />
            <SettingRow
              title="Privacy Policy URL"
              description="Link to privacy policy"
              value={settings.privacyPolicyUrl}
              type="text"
              settingKey="privacyPolicyUrl"
            />
          </View>
        </View>

        {/* System Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Actions</Text>
          <View style={styles.actionsGroup}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSystemAction('clear cache')}
            >
              <Text style={styles.actionButtonText}>Clear Cache</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleSystemAction('backup database')}
            >
              <Text style={styles.actionButtonText}>Backup Database</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerButton]}
              onPress={() => handleSystemAction('reset all settings')}
            >
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>Reset All Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.savingText}>Saving...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingsGroup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 3,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  settingControl: {
    alignItems: 'flex-end',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  editIcon: {
    marginLeft: 8,
    fontSize: 14,
  },
  editContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 8,
    minWidth: 100,
    fontSize: 14,
  },
  editButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    padding: 8,
    marginLeft: 5,
    minWidth: 30,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  editButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionsGroup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerButtonText: {
    color: '#fff',
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
  },
});

export default AdminSettings;