import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import apiService from '../../services/api';

interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  rating: number;
  photo?: string;
}

interface DeliveryDetails {
  id: string;
  status: 'PENDING' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  pickupAddress: string;
  deliveryAddress: string;
  packageType: string;
  packageDescription: string;
  recipientName: string;
  recipientPhone: string;
  fare: number;
  estimatedTime: string;
  partner?: DeliveryPartner;
  trackingCode: string;
}

const DeliveryInProgressScreen: React.FC = () => {
  const navigation = useNavigation();
  const [delivery, setDelivery] = useState<DeliveryDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveDelivery();
    
    // Set up real-time updates polling
    const interval = setInterval(() => {
      if (delivery?.id) {
        fetchDeliveryStatus(delivery.id);
      }
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [delivery?.id]);

  const fetchActiveDelivery = async () => {
    try {
      setLoading(true);
      const response = await apiService.getDeliveries('active');
      if (response.data && response.data.length > 0) {
        setDelivery(response.data[0]); // Get the first active delivery
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching active delivery:', error);
      setLoading(false);
    }
  };

  const fetchDeliveryStatus = async (deliveryId: string) => {
    try {
      const response = await apiService.getDeliveryById(deliveryId);
      setDelivery(response.data);
    } catch (error) {
      console.error('Error fetching delivery status:', error);
    }
  };

  const getStatusMessage = () => {
    switch (delivery?.status) {
      case 'PENDING':
        return 'Looking for a delivery partner...';
      case 'ASSIGNED':
        return `${delivery?.partner?.name || 'Partner'} is heading to pickup location`;
      case 'PICKED_UP':
        return 'Package picked up and on the way to destination';
      case 'IN_TRANSIT':
        return 'Package is in transit to delivery location';
      case 'DELIVERED':
        return 'Package delivered successfully!';
      case 'CANCELLED':
        return 'Delivery has been cancelled';
      default:
        return 'Processing your delivery...';
    }
  };

  const getStatusColor = () => {
    switch (delivery?.status) {
      case 'PENDING':
        return '#FF9500';
      case 'ASSIGNED':
      case 'PICKED_UP':
      case 'IN_TRANSIT':
        return '#007AFF';
      case 'DELIVERED':
        return '#34C759';
      case 'CANCELLED':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const callDeliveryPartner = () => {
    if (delivery?.partner?.phone) {
      Linking.openURL(`tel:${delivery?.partner?.phone}`);
    }
  };

  const callRecipient = () => {
    Linking.openURL(`tel:${delivery?.recipientPhone || ''}`);
  };

  const cancelDelivery = () => {
    Alert.alert(
      'Cancel Delivery',
      'Are you sure you want to cancel this delivery? Cancellation charges may apply.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // API call to cancel delivery
              await new Promise(resolve => setTimeout(resolve, 1500));
              setDelivery(prev => prev ? { ...prev, status: 'CANCELLED' } : null);
              Alert.alert('Cancelled', 'Your delivery has been cancelled.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel delivery. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const markAsDelivered = () => {
    Alert.alert(
      'Confirm Delivery',
      'Has the package been delivered successfully?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Delivered',
          onPress: () => {
            setDelivery(prev => prev ? { ...prev, status: 'DELIVERED' } : null);
            Alert.alert('Success', 'Delivery marked as completed!', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          },
        },
      ]
    );
  };

  const renderStatusProgress = () => {
    const steps = [
      { key: 'ASSIGNED', label: 'Assigned', completed: true },
      { key: 'PICKED_UP', label: 'Picked Up', completed: ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(delivery?.status || '') },
      { key: 'IN_TRANSIT', label: 'In Transit', completed: ['IN_TRANSIT', 'DELIVERED'].includes(delivery?.status || '') },
      { key: 'DELIVERED', label: 'Delivered', completed: delivery?.status === 'DELIVERED' },
    ];

    return (
      <View style={styles.progressContainer}>
        {steps.map((step, index) => (
          <View key={step.key} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              step.completed && styles.progressDotCompleted,
              delivery?.status === step.key && styles.progressDotActive
            ]} />
            <Text style={[
              styles.progressLabel,
              step.completed && styles.progressLabelCompleted
            ]}>
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                step.completed && styles.progressLineCompleted
              ]} />
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Delivery Tracking</Text>
          <Text style={styles.trackingCode}>#{delivery?.trackingCode || 'N/A'}</Text>
        </View>

        <View style={[styles.statusContainer, { backgroundColor: getStatusColor() + '20' }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <View style={styles.statusTextContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusMessage()}
            </Text>
            <Text style={styles.estimatedTime}>ETA: {delivery?.estimatedTime || 'Unknown'}</Text>
          </View>
        </View>

        {renderStatusProgress()}

        {delivery?.partner && (
          <View style={styles.partnerContainer}>
            <Text style={styles.sectionTitle}>Delivery Partner</Text>
            <View style={styles.partnerInfo}>
              <View style={styles.partnerDetails}>
                <Text style={styles.partnerName}>{delivery?.partner?.name || 'Unknown Partner'}</Text>
                <Text style={styles.partnerVehicle}>Vehicle: {delivery?.partner?.vehicleNumber || 'Unknown'}</Text>
                <Text style={styles.partnerRating}>⭐ {delivery?.partner?.rating || 'N/A'}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={callDeliveryPartner}
              >
                <Text style={styles.callButtonText}>📞 Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.deliveryDetailsContainer}>
          <Text style={styles.sectionTitle}>Delivery Details</Text>
          
          <View style={styles.locationContainer}>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>From</Text>
              <Text style={styles.locationAddress}>{delivery?.pickupAddress || 'Unknown address'}</Text>
            </View>
            <View style={styles.locationItem}>
              <Text style={styles.locationLabel}>To</Text>
              <Text style={styles.locationAddress}>{delivery?.deliveryAddress || 'Unknown address'}</Text>
            </View>
          </View>

          <View style={styles.packageInfo}>
            <View style={styles.packageItem}>
              <Text style={styles.packageLabel}>Package Type</Text>
              <Text style={styles.packageValue}>{delivery?.packageType || 'Unknown'}</Text>
            </View>
            <View style={styles.packageItem}>
              <Text style={styles.packageLabel}>Description</Text>
              <Text style={styles.packageValue}>{delivery?.packageDescription || 'No description'}</Text>
            </View>
          </View>

          <View style={styles.recipientInfo}>
            <Text style={styles.recipientTitle}>Recipient Details</Text>
            <View style={styles.recipientRow}>
              <View style={styles.recipientDetails}>
                <Text style={styles.recipientName}>{delivery?.recipientName || 'Unknown'}</Text>
                <Text style={styles.recipientPhone}>{delivery?.recipientPhone || 'Unknown'}</Text>
              </View>
              <TouchableOpacity
                style={styles.callButton}
                onPress={callRecipient}
              >
                <Text style={styles.callButtonText}>📞 Call</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Delivery Fee</Text>
            <Text style={styles.fareAmount}>{delivery?.fare || 0} تومان</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {delivery?.status === 'DELIVERED' ? (
          <TouchableOpacity
            style={styles.completedButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.completedButtonText}>✓ Delivery Completed</Text>
          </TouchableOpacity>
        ) : delivery?.status === 'CANCELLED' ? (
          <TouchableOpacity
            style={styles.cancelledButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelledButtonText}>Delivery Cancelled</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.actionButtons}>
            {delivery?.status === 'IN_TRANSIT' && (
              <TouchableOpacity
                style={styles.deliveredButton}
                onPress={markAsDelivered}
              >
                <Text style={styles.deliveredButtonText}>Mark as Delivered</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.cancelButton, loading && styles.buttonDisabled]}
              onPress={cancelDelivery}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>
                {loading ? 'Cancelling...' : 'Cancel Delivery'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  trackingCode: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  progressStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ddd',
    marginBottom: 8,
  },
  progressDotCompleted: {
    backgroundColor: '#34C759',
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  progressLabelCompleted: {
    color: '#333',
    fontWeight: '600',
  },
  progressLine: {
    position: 'absolute',
    top: 10,
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#ddd',
    zIndex: -1,
  },
  progressLineCompleted: {
    backgroundColor: '#34C759',
  },
  partnerContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  partnerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
  },
  partnerDetails: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  partnerVehicle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  partnerRating: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  callButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deliveryDetailsContainer: {
    marginBottom: 20,
  },
  locationContainer: {
    marginBottom: 16,
  },
  locationItem: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
  },
  packageInfo: {
    marginBottom: 16,
  },
  packageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  packageLabel: {
    fontSize: 14,
    color: '#666',
  },
  packageValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  recipientInfo: {
    marginBottom: 16,
  },
  recipientTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  recipientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  recipientDetails: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  recipientPhone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
  },
  fareLabel: {
    fontSize: 16,
    color: '#333',
  },
  fareAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButtons: {
    gap: 12,
  },
  deliveredButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  deliveredButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completedButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  completedButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelledButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelledButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
});

export default DeliveryInProgressScreen;