import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import apiService from '../../services/api';
import { useNavigation, NavigationProp, RouteProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';

type TrackDeliveryScreenNavigationProp = NavigationProp<MainStackParamList, 'TrackDelivery'>;
type TrackDeliveryScreenRouteProp = RouteProp<MainStackParamList, 'TrackDelivery'>;

interface Props {
  navigation: TrackDeliveryScreenNavigationProp;
  route: TrackDeliveryScreenRouteProp;
}

interface DeliveryStatus {
  id: string;
  status: 'pending' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  pickupAddress: string;
  deliveryAddress: string;
  packageDescription: string;
  recipientName: string;
  estimatedDelivery: string;
  driverName?: string;
  driverPhone?: string;
}

const TrackDeliveryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { deliveryId } = route.params;
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveryStatus();
  }, [deliveryId]);

  const fetchDeliveryStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDeliveryById(deliveryId);
      setDelivery(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching delivery status:', error);
      setLoading(false);
      // Show error message to user
      Alert.alert('Error', 'Failed to fetch delivery status. Please try again.');
    }
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
      case 'pending': return 'Pending Pickup';
      case 'picked_up': return 'Picked Up';
      case 'in_transit': return 'In Transit';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading delivery status...</Text>
      </View>
    );
  }

  if (!delivery) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Delivery not found</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Track Delivery</Text>
        <Text style={styles.deliveryId}>ID: {delivery.id}</Text>
        
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(delivery.status) }]}>
            <Text style={styles.statusText}>{getStatusText(delivery.status)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{delivery.pickupAddress}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>To:</Text>
            <Text style={styles.value}>{delivery.deliveryAddress}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Package:</Text>
            <Text style={styles.value}>{delivery.packageDescription}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Recipient:</Text>
            <Text style={styles.value}>{delivery.recipientName}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.label}>Estimated Delivery:</Text>
            <Text style={styles.value}>{delivery.estimatedDelivery}</Text>
          </View>
        </View>

        {delivery.driverName && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Driver Information</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.label}>Driver:</Text>
              <Text style={styles.value}>{delivery.driverName}</Text>
            </View>
            
            {delivery.driverPhone && (
              <View style={styles.detailRow}>
                <Text style={styles.label}>Phone:</Text>
                <Text style={styles.value}>{delivery.driverPhone}</Text>
              </View>
            )}
          </View>
        )}

        <TouchableOpacity style={styles.refreshButton} onPress={fetchDeliveryStatus}>
          <Text style={styles.buttonText}>Refresh Status</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
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
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  deliveryId: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    width: 100,
  },
  value: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TrackDeliveryScreen;