import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface DriverStats {
  totalRides: number;
  totalEarnings: number;
  todayEarnings: number;
  rating: number;
  isAvailable: boolean;
}

const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [stats, setStats] = useState<DriverStats>({
    totalRides: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    rating: 0,
    isAvailable: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  console.log('🚗 DriverDashboard: Component loaded for user:', user?.name);

  useEffect(() => {
    fetchDriverStats();
  }, []);

  const fetchDriverStats = async () => {
    try {
      console.log('🚗 DriverDashboard: Fetching driver stats');
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiService.getDriverStats();
      
      // Mock data for now
      const mockStats: DriverStats = {
        totalRides: 127,
        totalEarnings: 2450000,
        todayEarnings: 180000,
        rating: 4.8,
        isAvailable: true,
      };
      
      setStats(mockStats);
      console.log('🚗 DriverDashboard: Stats loaded:', mockStats);
    } catch (error) {
      console.error('❌ DriverDashboard: Failed to fetch stats:', error);
      Alert.alert('Error', 'Failed to load driver statistics');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDriverStats();
    setRefreshing(false);
  };

  const toggleAvailability = async (value: boolean) => {
    try {
      console.log('🚗 DriverDashboard: Toggling availability to:', value);
      // TODO: Replace with actual API call when backend is ready
      // await apiService.updateDriverAvailability(value);
      
      setStats(prev => ({ ...prev, isAvailable: value }));
      console.log('🚗 DriverDashboard: Availability updated to:', value);
    } catch (error) {
      console.error('❌ DriverDashboard: Failed to update availability:', error);
      Alert.alert('Error', 'Failed to update availability status');
    }
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
        <Text style={styles.loadingText}>Loading driver dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Driver Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.name}!</Text>
      </View>

      {/* Availability Toggle */}
      <View style={styles.availabilityCard}>
        <View style={styles.availabilityHeader}>
          <Text style={styles.availabilityTitle}>Availability Status</Text>
          <Switch
            value={stats.isAvailable}
            onValueChange={toggleAvailability}
            trackColor={{ false: themeColors.textSecondary, true: themeColors.success }}
            thumbColor={stats.isAvailable ? themeColors.background : themeColors.textSecondary}
          />
        </View>
        <Text style={[styles.availabilityStatus, { color: stats.isAvailable ? themeColors.success : themeColors.textSecondary }]}>
          {stats.isAvailable ? 'Available for rides' : 'Offline'}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalRides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.rating.toFixed(1)} ⭐</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(stats.todayEarnings)}</Text>
          <Text style={styles.statLabel}>Today's Earnings</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(stats.totalEarnings)}</Text>
          <Text style={styles.statLabel}>Total Earnings</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Available Rides</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Ride History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Earnings Report</Text>
        </TouchableOpacity>
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
  availabilityCard: {
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
  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  availabilityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  availabilityStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  actionButton: {
    backgroundColor: theme.brand,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: theme.textInverse,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default DriverDashboard;