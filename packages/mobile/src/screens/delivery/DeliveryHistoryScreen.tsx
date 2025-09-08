import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import apiService from '../../services/api';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';

type DeliveryHistoryScreenNavigationProp = NavigationProp<MainStackParamList, 'DeliveryHistory'>;

interface Props {
  navigation: DeliveryHistoryScreenNavigationProp;
}

interface DeliveryHistoryItem {
  id: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  recipientName: string;
  createdAt: string;
  deliveredAt?: string;
  cost: number;
}

const DeliveryHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [deliveries, setDeliveries] = useState<DeliveryHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDeliveryHistory();
  }, []);

  const fetchDeliveryHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDeliveries();
      setDeliveries(response.data || []);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      setLoading(false);
      setRefreshing(false);
      Alert.alert('Error', 'Failed to fetch delivery history. Please try again.');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeliveryHistory();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'picked_up': return '#2196f3';
      case 'in_transit': return '#4caf50';
      case 'delivered': return '#8bc34a';
      case 'cancelled': return '#f44336';
      default: return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'picked_up': return 'Picked Up';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const handleDeliveryPress = (deliveryId: string) => {
    navigation.navigate('TrackDelivery', { deliveryId });
  };

  const renderDeliveryItem = ({ item }: { item: DeliveryHistoryItem }) => (
    <TouchableOpacity
      style={styles.deliveryItem}
      onPress={() => handleDeliveryPress(item.id)}
    >
      <View style={styles.deliveryHeader}>
        <Text style={styles.deliveryId}>#{item.id}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <View style={styles.deliveryDetails}>
        <Text style={styles.addressText} numberOfLines={1}>
          From: {item.pickupAddress}
        </Text>
        <Text style={styles.addressText} numberOfLines={1}>
          To: {item.deliveryAddress}
        </Text>
        <Text style={styles.packageText} numberOfLines={1}>
          Package: {item.packageDescription}
        </Text>
        <Text style={styles.recipientText} numberOfLines={1}>
          Recipient: {item.recipientName}
        </Text>
      </View>
      
      <View style={styles.deliveryFooter}>
        <Text style={styles.dateText}>{item.createdAt}</Text>
        <Text style={styles.costText}>${item.cost.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading delivery history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Delivery History</Text>
      
      {deliveries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No deliveries found</Text>
          <TouchableOpacity
            style={styles.requestButton}
            onPress={() => navigation.navigate('RequestDelivery')}
          >
            <Text style={styles.requestButtonText}>Request Delivery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={deliveries}
          renderItem={renderDeliveryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.themeColors.backgroundSecondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
    color: theme.themeColors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: theme.themeColors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: theme.themeColors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  requestButton: {
    backgroundColor: theme.themeColors.brand,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  requestButtonText: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  listContainer: {
    padding: 15,
  },
  deliveryItem: {
    backgroundColor: theme.themeColors.background,
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: theme.themeColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  deliveryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  deliveryId: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.themeColors.textPrimary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: theme.themeColors.textInverse,
    fontSize: 12,
    fontWeight: '600',
  },
  deliveryDetails: {
    marginBottom: 10,
  },
  addressText: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    marginBottom: 2,
  },
  packageText: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    marginBottom: 2,
  },
  recipientText: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
  },
  deliveryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.themeColors.border,
    paddingTop: 10,
  },
  dateText: {
    fontSize: 12,
    color: theme.themeColors.textTertiary,
  },
  costText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.themeColors.brand,
  },
});

export default DeliveryHistoryScreen;