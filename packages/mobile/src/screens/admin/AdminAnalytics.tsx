import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAdmin } from '../../contexts/AdminContext';

// Debug logging utility
const debugLog = (component: string, action: string, data?: any) => {
  console.log(`📊 [${component}::${action}]`, data ? JSON.stringify(data, null, 2) : '');
};

const errorLog = (component: string, action: string, error: any) => {
  console.error(`❌ [${component}::${action}] ERROR:`, error);
  if (error?.message) {
    console.error(`❌ [${component}::${action}] Error Message:`, error.message);
  }
  console.error(`❌ [${component}::${action}] Full Error:`, error);
};

const { width } = Dimensions.get('window');

interface AnalyticsData {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeDrivers: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  ordersByStatus: Record<string, number>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
}

interface OrderStats {
  pending: number;
  assigned: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

const AdminAnalytics: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    analytics,
    analyticsLoading: loading,
    analyticsError: error,
    fetchAnalytics
  } = useAdmin();
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  debugLog('AdminAnalytics', 'Component initialized', {
    currentUser: user ? { id: user.id, email: user.email, userType: user.userType } : null,
    analyticsData: analytics ? {
      totalUsers: analytics.totalUsers,
      totalOrders: analytics.totalOrders,
      totalRevenue: analytics.totalRevenue,
      activeDrivers: analytics.activeDrivers
    } : null,
    loading,
    error: !!error,
    selectedPeriod
  });

  // Extract order stats from analytics data when analytics changes
  useEffect(() => {
    debugLog('AdminAnalytics', 'useEffect analytics changed', { analyticsExists: !!analytics });
    if (analytics) {
      const orderStatsData = {
        pending: analytics.pendingOrders || 0,
        assigned: analytics.ordersByStatus?.ASSIGNED || 0,
        inProgress: analytics.ordersByStatus?.IN_PROGRESS || analytics.ordersByStatus?.PICKED_UP || analytics.ordersByStatus?.IN_TRANSIT || 0,
        completed: analytics.completedOrders || 0,
        cancelled: analytics.cancelledOrders || 0
      };
      
      debugLog('AdminAnalytics', 'Order stats calculated', orderStatsData);
      setOrderStats(orderStatsData);
    }
  }, [analytics]);

  const onRefresh = async () => {
    debugLog('AdminAnalytics', 'onRefresh started', { selectedPeriod });
    setRefreshing(true);
    try {
      await fetchAnalytics();
      debugLog('AdminAnalytics', 'onRefresh completed successfully', { 
        analyticsLoaded: !!analytics,
        orderStatsLoaded: !!orderStats
      });
    } catch (error) {
      errorLog('AdminAnalytics', 'onRefresh failed', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US');
  };

  const getOrdersForPeriod = () => {
    if (!analytics) return 0;
    // Since we don't have period-specific data, return total orders
    return analytics.totalOrders;
  };

  const StatCard: React.FC<{ title: string; value: string; color: string; subtitle?: string }> = ({ 
    title, 
    value, 
    color, 
    subtitle 
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const ProgressBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ 
    label, 
    value, 
    total, 
    color 
  }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>{label}</Text>
          <Text style={styles.progressValue}>{value}</Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
      </View>
    );
  };

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  if (error || (!analytics || !orderStats)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load analytics data'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAnalytics}>
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
        <Text style={styles.title}>Analytics Dashboard</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Key Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.statsGrid}>
            <StatCard 
              title="Total Users" 
              value={formatNumber(analytics.totalUsers)} 
              color="#4CAF50" 
            />
            <StatCard 
              title="Active Drivers" 
              value={analytics.activeDrivers.toString()} 
              color="#4CAF50" 
            />
            <StatCard 
              title="Total Orders" 
              value={analytics.totalOrders.toString()} 
              color="#2196F3" 
            />
            <StatCard 
              title="Total Revenue" 
              value={formatCurrency(analytics.totalRevenue)} 
              color="#FF9800" 
            />
          </View>
        </View>

        {/* Order Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Statistics</Text>
          
          {/* Period Selector */}
          <View style={styles.periodSelector}>
            {(['today', 'week', 'month'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.periodButton,
                  selectedPeriod === period && styles.periodButtonActive
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <Text style={[
                  styles.periodButtonText,
                  selectedPeriod === period && styles.periodButtonTextActive
                ]}>
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.orderStatsCard}>
            <Text style={styles.orderStatsTitle}>
              Orders {selectedPeriod === 'today' ? 'Today' : `This ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`}
            </Text>
            <Text style={styles.orderStatsValue}>{getOrdersForPeriod()}</Text>
          </View>
        </View>

        {/* Order Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Status Breakdown</Text>
          <View style={styles.progressSection}>
            <ProgressBar 
              label="Pending" 
              value={orderStats.pending} 
              total={analytics.totalOrders} 
              color="#FF9800" 
            />
            <ProgressBar 
              label="Assigned" 
              value={orderStats.assigned} 
              total={analytics.totalOrders} 
              color="#9C27B0" 
            />
            <ProgressBar 
              label="In Progress" 
              value={orderStats.inProgress} 
              total={analytics.totalOrders} 
              color="#2196F3" 
            />
            <ProgressBar 
              label="Completed" 
              value={orderStats.completed} 
              total={analytics.totalOrders} 
              color="#4CAF50" 
            />
            <ProgressBar 
              label="Cancelled" 
              value={orderStats.cancelled} 
              total={analytics.totalOrders} 
              color="#F44336" 
            />
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.performanceGrid}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>Avg. Order Value</Text>
              <Text style={styles.performanceValue}>{formatCurrency(analytics.averageOrderValue)}</Text>
            </View>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceTitle}>Completion Rate</Text>
              <Text style={styles.performanceValue}>{analytics.totalOrders > 0 ? ((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1) : 0}%</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>Export Report</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton}>
              <Text style={styles.quickActionText}>View Detailed Stats</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    width: (width - 45) / 2,
    marginBottom: 10,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 3,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  periodButtonActive: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  orderStatsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  orderStatsTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  orderStatsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  progressSection: {
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
  progressContainer: {
    marginBottom: 15,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  performanceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  performanceCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    width: (width - 45) / 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  performanceTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
  performanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 15,
    width: (width - 45) / 2,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AdminAnalytics;