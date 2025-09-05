import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { MainStackParamList } from '../../navigation/types';

interface Driver {
  id: string;
  name: string;
  phone: string;
  rating: number;
  vehicleNumber: string;
  vehicleModel: string;
  photo?: string;
}

interface RideStatus {
  id: string;
  status: 'REQUESTED' | 'ACCEPTED' | 'DRIVER_ARRIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  driver?: Driver;
  estimatedArrival?: number; // minutes
  fare?: number;
  pickupLocation: string;
  destination: string;
}

const RideInProgressScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<MainStackParamList>>();
  const [rideStatus, setRideStatus] = useState<RideStatus>({
    id: 'ride_123',
    status: 'REQUESTED',
    pickupLocation: 'Current Location, New Delhi',
    destination: 'Destination Address, New Delhi',
  });

  console.log('🚗 RideInProgressScreen: Component loaded');
  console.log('🚗 RideInProgressScreen: Initial ride status:', rideStatus);

  useEffect(() => {
    // Simulate ride status updates
    const statusUpdates = [
      { status: 'ACCEPTED', delay: 2000 },
      { status: 'DRIVER_ARRIVED', delay: 5000 },
      { status: 'IN_PROGRESS', delay: 8000 },
    ];

    statusUpdates.forEach(({ status, delay }) => {
      setTimeout(() => {
        console.log(`🚗 RideInProgressScreen: Status updating to ${status}`);
        setRideStatus(prev => ({
          ...prev,
          status: status as any,
          driver: {
            id: 'driver_123',
            name: 'Rajesh Kumar',
            phone: '+91 98765 43210',
            rating: 4.8,
            vehicleNumber: 'DL 01 AB 1234',
            vehicleModel: 'Maruti Swift',
          },
          estimatedArrival: status === 'ACCEPTED' ? 5 : status === 'DRIVER_ARRIVED' ? 0 : undefined,
          fare: 156,
        }));
        console.log(`✅ RideInProgressScreen: Status updated to ${status}`);
      }, delay);
    });
  }, []);

  const getStatusMessage = () => {
    switch (rideStatus.status) {
      case 'REQUESTED':
        return 'Looking for nearby drivers...';
      case 'ACCEPTED':
        return `Driver is on the way • ETA ${rideStatus.estimatedArrival} min`;
      case 'DRIVER_ARRIVED':
        return 'Driver has arrived at pickup location';
      case 'IN_PROGRESS':
        return 'Ride in progress';
      case 'COMPLETED':
        return 'Ride completed';
      case 'CANCELLED':
        return 'Ride cancelled';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (rideStatus.status) {
      case 'REQUESTED':
        return '#FF9500';
      case 'ACCEPTED':
      case 'DRIVER_ARRIVED':
        return '#007AFF';
      case 'IN_PROGRESS':
        return '#34C759';
      case 'COMPLETED':
        return '#34C759';
      case 'CANCELLED':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const callDriver = () => {
    console.log('📞 RideInProgressScreen: User tapped call driver');
    if (rideStatus.driver?.phone) {
      console.log('📞 RideInProgressScreen: Opening dialer for:', rideStatus.driver.phone);
      Linking.openURL(`tel:${rideStatus.driver.phone}`);
    } else {
      console.log('❌ RideInProgressScreen: No driver phone number available');
    }
  };

  const cancelRide = () => {
    console.log('🚫 RideInProgressScreen: User initiated ride cancellation');
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this ride?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            console.log('❌ RideInProgressScreen: User confirmed ride cancellation');
            setRideStatus(prev => ({ ...prev, status: 'CANCELLED' }));
            setTimeout(() => {
              console.log('🔙 RideInProgressScreen: Navigating back after cancellation');
              navigation.goBack();
            }, 2000);
          }
        }
      ]
    );
  };

  const completeRide = () => {
    console.log('✅ RideInProgressScreen: Completing ride');
    setRideStatus(prev => ({ ...prev, status: 'COMPLETED' }));
    setTimeout(() => {
      console.log('🏠 RideInProgressScreen: Navigating to RideRequest after completion');
      navigation.navigate('RideRequest');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Ride</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{rideStatus.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusMessage}>{getStatusMessage()}</Text>
      </View>

      <View style={styles.locationContainer}>
        <View style={styles.locationItem}>
          <View style={styles.locationDot} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Pickup</Text>
            <Text style={styles.locationAddress}>{rideStatus.pickupLocation}</Text>
          </View>
        </View>
        
        <View style={styles.locationLine} />
        
        <View style={styles.locationItem}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Destination</Text>
            <Text style={styles.locationAddress}>{rideStatus.destination}</Text>
          </View>
        </View>
      </View>

      {rideStatus.driver && (
        <View style={styles.driverContainer}>
          <View style={styles.driverInfo}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverInitial}>
                {rideStatus.driver.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.driverDetails}>
              <Text style={styles.driverName}>{rideStatus.driver.name}</Text>
              <Text style={styles.vehicleInfo}>
                {rideStatus.driver.vehicleModel} • {rideStatus.driver.vehicleNumber}
              </Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.rating}>★ {rideStatus.driver.rating}</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton} onPress={callDriver}>
            <Text style={styles.callButtonText}>📞</Text>
          </TouchableOpacity>
        </View>
      )}

      {rideStatus.fare && (
        <View style={styles.fareContainer}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareAmount}>{rideStatus.fare} تومان</Text>
        </View>
      )}

      <View style={styles.actionContainer}>
        {rideStatus.status === 'REQUESTED' || rideStatus.status === 'ACCEPTED' ? (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelRide}>
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </TouchableOpacity>
        ) : rideStatus.status === 'IN_PROGRESS' ? (
          <TouchableOpacity style={styles.completeButton} onPress={completeRide}>
            <Text style={styles.completeButtonText}>Complete Ride</Text>
          </TouchableOpacity>
        ) : rideStatus.status === 'COMPLETED' ? (
          <TouchableOpacity
            style={styles.newRideButton}
            onPress={() => navigation.navigate('RideRequest' as never)}
          >
            <Text style={styles.newRideButtonText}>Book Another Ride</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  locationContainer: {
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#34C759',
    marginTop: 4,
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#FF3B30',
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ddd',
    marginLeft: 5,
    marginVertical: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  driverContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInitial: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButtonText: {
    fontSize: 20,
  },
  fareContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
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
  actionContainer: {
    marginTop: 'auto',
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
  completeButton: {
    backgroundColor: '#34C759',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  newRideButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  newRideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideInProgressScreen;