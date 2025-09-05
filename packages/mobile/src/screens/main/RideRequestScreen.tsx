import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import apiService from '../../services/api';
import { useNavigation } from '@react-navigation/native';
import { locationService, Location } from '../../services/locationService';
import CustomMapView from '../../components/MapView';

interface RideRequest {
  pickupLocation: Location | null;
  destination: Location | null;
  rideType: 'ECONOMY' | 'COMFORT' | 'PREMIUM';
  scheduledTime?: Date;
}

const RideRequestScreen: React.FC = () => {
  const navigation = useNavigation();
  const [rideRequest, setRideRequest] = useState<RideRequest>({
    pickupLocation: null,
    destination: null,
    rideType: 'ECONOMY',
  });
  const [pickupAddress, setPickupAddress] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRideTypes, setShowRideTypes] = useState(false);

  console.log('🚗 RideRequestScreen: Component loaded');
  console.log('🚗 RideRequestScreen: Current ride request:', rideRequest);
  console.log('🚗 RideRequestScreen: Estimated fare:', estimatedFare);

  const rideTypes = [
    { id: 'ECONOMY', name: 'Economy', price: '8000 تومان/km', eta: '3-5 min' },
  { id: 'COMFORT', name: 'Comfort', price: '12000 تومان/km', eta: '2-4 min' },
  { id: 'PREMIUM', name: 'Premium', price: '18000 تومان/km', eta: '1-3 min' },
  ];

  useEffect(() => {
    // Get current location
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    console.log('🚗 RideRequestScreen: Getting current location');
    try {
      const location = await locationService.getCurrentLocation();
      const address = await locationService.reverseGeocode(location.latitude, location.longitude);
      const locationWithAddress: Location = { ...location, address };
      
      console.log('🚗 RideRequestScreen: Real location obtained:', locationWithAddress);
      setRideRequest(prev => ({ ...prev, pickupLocation: locationWithAddress }));
      setPickupAddress(locationWithAddress.address || 'Current Location');
    } catch (error) {
      console.error('🚗 RideRequestScreen: Error getting location:', error);
      // Fallback to mock location if real location fails
      const mockLocation: Location = {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Current Location, New Delhi',
      };
      console.log('🚗 RideRequestScreen: Using fallback location:', mockLocation);
      setRideRequest(prev => ({ ...prev, pickupLocation: mockLocation }));
      setPickupAddress(mockLocation.address || 'Current Location');
      Alert.alert('Location Notice', 'Using approximate location. Please enable location services for better accuracy.');
    }
  };

  const calculateFare = async () => {
    console.log('🚗 RideRequestScreen: Calculating fare');
    if (!rideRequest.pickupLocation || !rideRequest.destination) {
      console.log('🚗 RideRequestScreen: Missing locations for fare calculation');
      return;
    }
    
    try {
      // Calculate real distance using location service
      const distance = locationService.calculateDistance(
        rideRequest.pickupLocation,
        rideRequest.destination
      );
      
      const basePrice = rideRequest.rideType === 'ECONOMY' ? 8000 :
                      rideRequest.rideType === 'COMFORT' ? 12000 : 18000;
    const baseFare = 20000; // Base fare in Toman
    const fare = Math.round(baseFare + (distance * basePrice));
      
      console.log('🚗 RideRequestScreen: Calculated fare:', fare, 'for distance:', distance.toFixed(2), 'km, ride type:', rideRequest.rideType);
      setEstimatedFare(fare);
    } catch (error) {
      console.error('🚗 RideRequestScreen: Error calculating fare:', error);
      // Fallback to mock calculation
      const distance = 5.2; // km
      const basePrice = rideRequest.rideType === 'ECONOMY' ? 8000 :
                      rideRequest.rideType === 'COMFORT' ? 12000 : 18000;
    const fare = Math.round(distance * basePrice);
      console.log('🚗 RideRequestScreen: Using fallback fare calculation:', fare);
      setEstimatedFare(fare);
    }
  };

  const handleDestinationChange = async (address: string) => {
    console.log('🚗 RideRequestScreen: Destination address changed:', address);
    setDestinationAddress(address);
    
    if (address.length > 3) {
      try {
        const destination = await locationService.geocodeAddress(address);
        console.log('🚗 RideRequestScreen: Geocoded destination:', destination);
        setRideRequest(prev => ({ ...prev, destination }));
        calculateFare();
      } catch (error) {
        console.error('🚗 RideRequestScreen: Error geocoding address:', error);
        // Fallback to mock destination
        const mockDestination: Location = {
          latitude: 28.5355,
          longitude: 77.3910,
          address: address,
        };
        console.log('🚗 RideRequestScreen: Using fallback destination:', mockDestination);
        setRideRequest(prev => ({ ...prev, destination: mockDestination }));
        calculateFare();
      }
    } else {
      console.log('🚗 RideRequestScreen: Address too short, clearing destination');
      setRideRequest(prev => ({ ...prev, destination: null }));
      setEstimatedFare(null);
    }
  };

  const requestRide = async () => {
    console.log('🚗 RideRequestScreen: Attempting to request ride');
    console.log('🚗 RideRequestScreen: Pickup location:', rideRequest.pickupLocation);
    console.log('🚗 RideRequestScreen: Destination:', rideRequest.destination);
    
    if (!rideRequest.pickupLocation || !rideRequest.destination) {
      console.log('🚗 RideRequestScreen: Missing location data');
      Alert.alert('Error', 'Please select pickup and destination locations');
      return;
    }

    setLoading(true);
    try {
      console.log('🚗 RideRequestScreen: Making API call to request ride');
      
      const rideData = {
        pickupLatitude: rideRequest.pickupLocation.latitude,
        pickupLongitude: rideRequest.pickupLocation.longitude,
        pickupAddress: rideRequest.pickupLocation.address || 'Unknown pickup location',
        destinationLatitude: rideRequest.destination.latitude,
        destinationLongitude: rideRequest.destination.longitude,
        destinationAddress: rideRequest.destination.address || 'Unknown destination',
        rideType: rideRequest.rideType,
        estimatedFare: estimatedFare || 0
      };
      
      console.log('🚗 RideRequestScreen: Ride data to send:', rideData);
      
      // Submit ride request to API
      const response = await apiService.requestRide(rideData);
      console.log('🚗 RideRequestScreen: API response:', response.data);
      
      console.log('🚗 RideRequestScreen: Ride request successful');
      Alert.alert('Success', 'Ride requested! Looking for nearby drivers...', [
        { 
          text: 'OK', 
          onPress: () => {
            console.log('🚗 RideRequestScreen: Navigating to RideInProgress');
            navigation.navigate('RideInProgress' as never);
          }
        }
      ]);
    } catch (error) {
      console.error('🚗 RideRequestScreen: Error requesting ride:', error);
      Alert.alert('Error', 'Failed to request ride. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedRideType = rideTypes.find(type => type.id === rideRequest.rideType);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Request a Ride</Text>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationInput}>
            <Text style={styles.locationLabel}>From</Text>
            <TextInput
              style={styles.input}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Pickup location"
              editable={false}
            />
          </View>

          <View style={styles.locationInput}>
            <Text style={styles.locationLabel}>To</Text>
            <TextInput
              style={styles.input}
              value={destinationAddress}
              onChangeText={handleDestinationChange}
              placeholder="Where to?"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.rideTypeSelector}
          onPress={() => setShowRideTypes(true)}
        >
          <View style={styles.rideTypeInfo}>
            <Text style={styles.rideTypeName}>{selectedRideType?.name}</Text>
            <Text style={styles.rideTypePrice}>{selectedRideType?.price}</Text>
          </View>
          <Text style={styles.rideTypeEta}>ETA: {selectedRideType?.eta}</Text>
        </TouchableOpacity>

        {estimatedFare && (
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Estimated Fare</Text>
            <Text style={styles.fareAmount}>{estimatedFare} تومان</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.requestButton, loading && styles.buttonDisabled]}
          onPress={requestRide}
          disabled={loading || !rideRequest.destination}
        >
          <Text style={styles.requestButtonText}>
            {loading ? 'Requesting...' : 'Request Ride'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showRideTypes}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRideTypes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Ride Type</Text>
            {rideTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.rideTypeOption,
                  rideRequest.rideType === type.id && styles.selectedRideType
                ]}
                onPress={() => {
                  setRideRequest(prev => ({ ...prev, rideType: type.id as any }));
                  setShowRideTypes(false);
                  calculateFare();
                }}
              >
                <View style={styles.rideTypeDetails}>
                  <Text style={styles.rideTypeOptionName}>{type.name}</Text>
                  <Text style={styles.rideTypeOptionPrice}>{type.price}</Text>
                </View>
                <Text style={styles.rideTypeOptionEta}>{type.eta}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRideTypes(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  locationContainer: {
    marginBottom: 20,
  },
  locationInput: {
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  rideTypeSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTypeInfo: {
    flex: 1,
  },
  rideTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  rideTypePrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rideTypeEta: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  fareContainer: {
    backgroundColor: '#f0f8ff',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  requestButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  rideTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedRideType: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  rideTypeDetails: {
    flex: 1,
  },
  rideTypeOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rideTypeOptionPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  rideTypeOptionEta: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalCloseButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 10,
  },
  modalCloseText: {
    color: '#666',
    fontSize: 16,
  },
});

export default RideRequestScreen;