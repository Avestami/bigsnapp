import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface AvailabilitySettings {
  isOnline: boolean;
  acceptingRides: boolean;
  acceptingDeliveries: boolean;
  workingHours: {
    start: string;
    end: string;
  };
  maxDistance: number;
  preferredAreas: string[];
}

interface OnlineStats {
  onlineTime: number; // in minutes
  ridesCompleted: number;
  earningsToday: number;
  lastRideTime?: string;
}

const DriverAvailability: React.FC = () => {
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [settings, setSettings] = useState<AvailabilitySettings>({
    isOnline: false,
    acceptingRides: true,
    acceptingDeliveries: true,
    workingHours: {
      start: '08:00',
      end: '22:00',
    },
    maxDistance: 15,
    preferredAreas: ['Downtown', 'Airport'],
  });
  const [stats, setStats] = useState<OnlineStats>({
    onlineTime: 0,
    ridesCompleted: 0,
    earningsToday: 0,
  });
  const [loading, setLoading] = useState(true);

  console.log('🟢 DriverAvailability: Component loaded');

  useEffect(() => {
    fetchAvailabilityData();
  }, []);

  const fetchAvailabilityData = async () => {
    try {
      console.log('🟢 DriverAvailability: Fetching availability data');
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiService.getDriverAvailability();
      
      // Mock data for now
      const mockStats: OnlineStats = {
        onlineTime: 245, // 4 hours 5 minutes
        ridesCompleted: 8,
        earningsToday: 680000,
        lastRideTime: '14:30',
      };
      
      setStats(mockStats);
      console.log('🟢 DriverAvailability: Data loaded successfully');
    } catch (error) {
      console.error('❌ DriverAvailability: Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    try {
      const newStatus = !settings.isOnline;
      console.log(`🟢 DriverAvailability: Toggling online status to ${newStatus}`);
      
      if (newStatus) {
        // Going online
        Alert.alert(
          'Go Online',
          'You will start receiving ride requests. Make sure you are ready to drive.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go Online',
              onPress: () => updateOnlineStatus(true),
            },
          ]
        );
      } else {
        // Going offline
        Alert.alert(
          'Go Offline',
          'You will stop receiving new ride requests. Current rides will not be affected.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go Offline',
              onPress: () => updateOnlineStatus(false),
            },
          ]
        );
      }
    } catch (error) {
      console.error('❌ DriverAvailability: Failed to toggle status:', error);
      Alert.alert('Error', 'Failed to update online status. Please try again.');
    }
  };

  const updateOnlineStatus = async (isOnline: boolean) => {
    try {
      // TODO: Replace with actual API call when backend is ready
      // await apiService.updateDriverAvailability({ isOnline });
      
      setSettings(prev => ({ ...prev, isOnline }));
      console.log(`🟢 DriverAvailability: Status updated to ${isOnline ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('❌ DriverAvailability: Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status. Please try again.');
    }
  };

  const updateSetting = (key: keyof AvailabilitySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    // TODO: Save to backend
    console.log(`🟢 DriverAvailability: Updated ${key} to`, value);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading availability settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Availability</Text>
        <Text style={styles.subtitle}>Manage your online status and preferences</Text>
      </View>

      {/* Online Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View>
            <Text style={styles.statusTitle}>
              {settings.isOnline ? 'You are Online' : 'You are Offline'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {settings.isOnline 
                ? 'Receiving ride requests' 
                : 'Not receiving ride requests'
              }
            </Text>
          </View>
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: settings.isOnline ? themeColors.success : themeColors.error }
            ]} />
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.toggleButton,
            { backgroundColor: settings.isOnline ? themeColors.error : themeColors.success }
          ]}
          onPress={toggleOnlineStatus}
        >
          <Text style={styles.toggleButtonText}>
            {settings.isOnline ? 'Go Offline' : 'Go Online'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Today's Stats */}
      {settings.isOnline && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatTime(stats.onlineTime)}</Text>
              <Text style={styles.statLabel}>Online Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.ridesCompleted}</Text>
              <Text style={styles.statLabel}>Rides Completed</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(stats.earningsToday)}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
          </View>
          {stats.lastRideTime && (
            <Text style={styles.lastRideText}>
              Last ride completed at {stats.lastRideTime}
            </Text>
          )}
        </View>
      )}

      {/* Service Settings */}
      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Service Settings</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Accept Ride Requests</Text>
            <Text style={styles.settingDescription}>Receive passenger ride requests</Text>
          </View>
          <Switch
            value={settings.acceptingRides}
            onValueChange={(value) => updateSetting('acceptingRides', value)}
            trackColor={{ false: themeColors.backgroundSecondary, true: themeColors.brand }}
            thumbColor={settings.acceptingRides ? themeColors.textInverse : themeColors.textSecondary}
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Accept Delivery Requests</Text>
            <Text style={styles.settingDescription}>Receive food and package delivery requests</Text>
          </View>
          <Switch
            value={settings.acceptingDeliveries}
            onValueChange={(value) => updateSetting('acceptingDeliveries', value)}
            trackColor={{ false: themeColors.backgroundSecondary, true: themeColors.brand }}
            thumbColor={settings.acceptingDeliveries ? themeColors.textInverse : themeColors.textSecondary}
          />
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.preferencesContainer}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Maximum Distance</Text>
          <Text style={styles.preferenceValue}>{settings.maxDistance} km</Text>
        </View>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Working Hours</Text>
          <Text style={styles.preferenceValue}>
            {settings.workingHours.start} - {settings.workingHours.end}
          </Text>
        </View>
        
        <View style={styles.preferenceItem}>
          <Text style={styles.preferenceTitle}>Preferred Areas</Text>
          <Text style={styles.preferenceValue}>
            {settings.preferredAreas.join(', ')}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background,
  },
  loadingText: {
    color: theme.textSecondary,
    fontSize: 16,
  },
  header: {
    padding: 20,
    backgroundColor: theme.brand,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textInverse,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: theme.textInverse,
    opacity: 0.9,
  },
  statusCard: {
    margin: 16,
    padding: 20,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    elevation: 2,
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.textSecondary,
    marginTop: 2,
  },
  statusIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  toggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: theme.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    elevation: 2,
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  lastRideText: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  settingsContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    elevation: 2,
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  settingDescription: {
    fontSize: 12,
    color: theme.textSecondary,
    marginTop: 2,
  },
  preferencesContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    elevation: 2,
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  preferenceTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.textPrimary,
  },
  preferenceValue: {
    fontSize: 14,
    color: theme.textSecondary,
  },
});

export default DriverAvailability;