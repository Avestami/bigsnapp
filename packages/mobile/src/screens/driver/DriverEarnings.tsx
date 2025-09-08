import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';
import apiService from '../../services/api';

interface EarningsData {
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  totalEarnings: number;
  totalRides: number;
  averagePerRide: number;
}

interface RecentRide {
  id: string;
  date: string;
  from: string;
  to: string;
  earnings: number;
  distance: number;
}

const DriverEarnings: React.FC = () => {
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [earnings, setEarnings] = useState<EarningsData>({
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
    totalEarnings: 0,
    totalRides: 0,
    averagePerRide: 0,
  });
  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'total'>('today');

  console.log('💰 DriverEarnings: Component loaded');

  useEffect(() => {
    fetchEarningsData();
  }, []);

  const fetchEarningsData = async () => {
    try {
      console.log('💰 DriverEarnings: Fetching earnings data');
      // TODO: Replace with actual API call when backend is ready
      // const response = await apiService.getDriverEarnings();
      
      // Mock data for now
      const mockEarnings: EarningsData = {
        todayEarnings: 180000,
        weekEarnings: 1250000,
        monthEarnings: 4800000,
        totalEarnings: 12450000,
        totalRides: 127,
        averagePerRide: 98000,
      };
      
      const mockRecentRides: RecentRide[] = [
        {
          id: '1',
          date: '2024-01-15 14:30',
          from: 'Tehran University',
          to: 'Azadi Square',
          earnings: 85000,
          distance: 12.5,
        },
        {
          id: '2',
          date: '2024-01-15 12:15',
          from: 'Imam Khomeini Airport',
          to: 'Valiasr Street',
          earnings: 120000,
          distance: 18.2,
        },
        {
          id: '3',
          date: '2024-01-15 09:45',
          from: 'Tajrish Square',
          to: 'Enghelab Square',
          earnings: 95000,
          distance: 14.8,
        },
      ];
      
      setEarnings(mockEarnings);
      setRecentRides(mockRecentRides);
      console.log('💰 DriverEarnings: Data loaded successfully');
    } catch (error) {
      console.error('❌ DriverEarnings: Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEarningsData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentEarnings = () => {
    switch (selectedPeriod) {
      case 'today':
        return earnings.todayEarnings;
      case 'week':
        return earnings.weekEarnings;
      case 'month':
        return earnings.monthEarnings;
      case 'total':
        return earnings.totalEarnings;
      default:
        return earnings.todayEarnings;
    }
  };

  const periods = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'total', label: 'All Time' },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading earnings...</Text>
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
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your income and performance</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              selectedPeriod === period.key && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period.key as any)}
          >
            <Text
              style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Earnings Display */}
      <View style={styles.mainEarningsCard}>
        <Text style={styles.mainEarningsLabel}>
          {periods.find(p => p.key === selectedPeriod)?.label} Earnings
        </Text>
        <Text style={styles.mainEarningsValue}>
          {formatCurrency(getCurrentEarnings())}
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{earnings.totalRides}</Text>
          <Text style={styles.statLabel}>Total Rides</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatCurrency(earnings.averagePerRide)}</Text>
          <Text style={styles.statLabel}>Avg per Ride</Text>
        </View>
      </View>

      {/* Recent Rides */}
      <View style={styles.recentRidesContainer}>
        <Text style={styles.sectionTitle}>Recent Rides</Text>
        {recentRides.map((ride) => (
          <View key={ride.id} style={styles.rideCard}>
            <View style={styles.rideHeader}>
              <Text style={styles.rideDate}>{ride.date}</Text>
              <Text style={styles.rideEarnings}>{formatCurrency(ride.earnings)}</Text>
            </View>
            <View style={styles.rideRoute}>
              <Text style={styles.rideLocation}>{ride.from}</Text>
              <Text style={styles.rideArrow}>→</Text>
              <Text style={styles.rideLocation}>{ride.to}</Text>
            </View>
            <Text style={styles.rideDistance}>{ride.distance} km</Text>
          </View>
        ))}
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
  periodSelector: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 8,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.brand,
  },
  periodButtonText: {
    fontSize: 14,
    color: theme.textSecondary,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: theme.textInverse,
  },
  mainEarningsCard: {
    margin: 16,
    padding: 24,
    backgroundColor: theme.backgroundSecondary,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mainEarningsLabel: {
    fontSize: 16,
    color: theme.textSecondary,
    marginBottom: 8,
  },
  mainEarningsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.success,
  },
  statsGrid: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  recentRidesContainer: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textPrimary,
    marginBottom: 12,
  },
  rideCard: {
    backgroundColor: theme.backgroundSecondary,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: theme.textPrimary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  rideDate: {
    fontSize: 12,
    color: theme.textSecondary,
  },
  rideEarnings: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.success,
  },
  rideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rideLocation: {
    flex: 1,
    fontSize: 14,
    color: theme.textPrimary,
  },
  rideArrow: {
    fontSize: 14,
    color: theme.textSecondary,
    marginHorizontal: 8,
  },
  rideDistance: {
    fontSize: 12,
    color: theme.textSecondary,
  },
});

export default DriverEarnings;