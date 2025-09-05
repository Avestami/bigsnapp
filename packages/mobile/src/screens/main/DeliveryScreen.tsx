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
import { useNavigation } from '@react-navigation/native';

interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

interface DeliveryRequest {
  pickupLocation: Location | null;
  deliveryLocation: Location | null;
  packageType: 'DOCUMENT' | 'SMALL_PACKAGE' | 'MEDIUM_PACKAGE' | 'LARGE_PACKAGE';
  packageDescription: string;
  recipientName: string;
  recipientPhone: string;
  scheduledTime?: Date;
  instructions?: string;
}

const DeliveryScreen: React.FC = () => {
  const navigation = useNavigation();
  const [deliveryRequest, setDeliveryRequest] = useState<DeliveryRequest>({
    pickupLocation: null,
    deliveryLocation: null,
    packageType: 'SMALL_PACKAGE',
    packageDescription: '',
    recipientName: '',
    recipientPhone: '',
    instructions: '',
  });
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [estimatedFare, setEstimatedFare] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPackageTypes, setShowPackageTypes] = useState(false);

  const packageTypes = [
    { id: 'DOCUMENT', name: 'Document', price: '25000 تومان', maxWeight: '1kg', description: 'Papers, certificates' },
  { id: 'SMALL_PACKAGE', name: 'Small Package', price: '40000 تومان', maxWeight: '5kg', description: 'Books, electronics' },
  { id: 'MEDIUM_PACKAGE', name: 'Medium Package', price: '60000 تومان', maxWeight: '15kg', description: 'Clothes, gifts' },
  { id: 'LARGE_PACKAGE', name: 'Large Package', price: '100000 تومان', maxWeight: '25kg', description: 'Appliances, furniture' },
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const mockLocation: Location = {
        latitude: 28.6139,
        longitude: 77.2090,
        address: 'Current Location, New Delhi',
      };
      setDeliveryRequest(prev => ({ ...prev, pickupLocation: mockLocation }));
      setPickupAddress(mockLocation.address);
    } catch (error) {
      Alert.alert('Error', 'Unable to get current location');
    }
  };

  const calculateFare = async () => {
    if (!deliveryRequest.pickupLocation || !deliveryRequest.deliveryLocation) return;
    
    const distance = 3.8; // km
    const basePrice = deliveryRequest.packageType === 'DOCUMENT' ? 25000 :
                      deliveryRequest.packageType === 'SMALL_PACKAGE' ? 40000 :
                      deliveryRequest.packageType === 'MEDIUM_PACKAGE' ? 60000 : 100000;
    const distancePrice = Math.round(distance * 8000); // 8000 تومان per km
    const fare = basePrice + distancePrice;
    setEstimatedFare(fare);
  };

  const handleDeliveryAddressChange = (address: string) => {
    setDeliveryAddress(address);
    if (address.length > 3) {
      const mockDestination: Location = {
        latitude: 28.5355,
        longitude: 77.3910,
        address: address,
      };
      setDeliveryRequest(prev => ({ ...prev, deliveryLocation: mockDestination }));
      calculateFare();
    }
  };

  const requestDelivery = async () => {
    if (!deliveryRequest.pickupLocation || !deliveryRequest.deliveryLocation) {
      Alert.alert('Error', 'Please select pickup and delivery locations');
      return;
    }

    if (!deliveryRequest.packageDescription.trim()) {
      Alert.alert('Error', 'Please describe the package');
      return;
    }

    if (!deliveryRequest.recipientName.trim() || !deliveryRequest.recipientPhone.trim()) {
      Alert.alert('Error', 'Please provide recipient details');
      return;
    }

    setLoading(true);
    try {
      console.log('Delivery request:', deliveryRequest);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert('Success', 'Delivery requested! Looking for nearby delivery partners...', [
        { text: 'OK', onPress: () => navigation.navigate('DeliveryInProgress' as never) }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to request delivery. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPackageType = packageTypes.find(type => type.id === deliveryRequest.packageType);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Request Delivery</Text>
        </View>

        <View style={styles.locationContainer}>
          <View style={styles.locationInput}>
            <Text style={styles.locationLabel}>Pickup From</Text>
            <TextInput
              style={styles.input}
              value={pickupAddress}
              onChangeText={setPickupAddress}
              placeholder="Pickup location"
              editable={false}
            />
          </View>

          <View style={styles.locationInput}>
            <Text style={styles.locationLabel}>Deliver To</Text>
            <TextInput
              style={styles.input}
              value={deliveryAddress}
              onChangeText={handleDeliveryAddressChange}
              placeholder="Delivery address"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.packageTypeSelector}
          onPress={() => setShowPackageTypes(true)}
        >
          <View style={styles.packageTypeInfo}>
            <Text style={styles.packageTypeName}>{selectedPackageType?.name}</Text>
            <Text style={styles.packageTypeDetails}>
              {selectedPackageType?.description} • Max {selectedPackageType?.maxWeight}
            </Text>
          </View>
          <Text style={styles.packageTypePrice}>{selectedPackageType?.price}</Text>
        </TouchableOpacity>

        <View style={styles.packageDetailsContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Package Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={deliveryRequest.packageDescription}
              onChangeText={(text) => setDeliveryRequest(prev => ({ ...prev, packageDescription: text }))}
              placeholder="Describe what you're sending"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Recipient Name *</Text>
              <TextInput
                style={styles.input}
                value={deliveryRequest.recipientName}
                onChangeText={(text) => setDeliveryRequest(prev => ({ ...prev, recipientName: text }))}
                placeholder="Full name"
                autoCapitalize="words"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Recipient Phone *</Text>
              <TextInput
                style={styles.input}
                value={deliveryRequest.recipientPhone}
                onChangeText={(text) => setDeliveryRequest(prev => ({ ...prev, recipientPhone: text }))}
                placeholder="Phone number"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Special Instructions</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={deliveryRequest.instructions}
              onChangeText={(text) => setDeliveryRequest(prev => ({ ...prev, instructions: text }))}
              placeholder="Any special delivery instructions"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {estimatedFare && (
          <View style={styles.fareContainer}>
            <Text style={styles.fareLabel}>Estimated Delivery Fee</Text>
            <Text style={styles.fareAmount}>{estimatedFare} تومان</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.requestButton, loading && styles.buttonDisabled]}
          onPress={requestDelivery}
          disabled={loading || !deliveryRequest.deliveryLocation}
        >
          <Text style={styles.requestButtonText}>
            {loading ? 'Requesting...' : 'Request Delivery'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showPackageTypes}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPackageTypes(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Package Type</Text>
            {packageTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.packageTypeOption,
                  deliveryRequest.packageType === type.id && styles.selectedPackageType
                ]}
                onPress={() => {
                  setDeliveryRequest(prev => ({ ...prev, packageType: type.id as any }));
                  setShowPackageTypes(false);
                  calculateFare();
                }}
              >
                <View style={styles.packageTypeDetailsContainer}>
                  <Text style={styles.packageTypeOptionName}>{type.name}</Text>
                  <Text style={styles.packageTypeOptionDescription}>{type.description}</Text>
                  <Text style={styles.packageTypeOptionWeight}>Max weight: {type.maxWeight}</Text>
                </View>
                <Text style={styles.packageTypeOptionPrice}>{type.price}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPackageTypes(false)}
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  packageTypeSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageTypeInfo: {
    flex: 1,
  },
  packageTypeName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  packageTypeDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  packageTypePrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  packageDetailsContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
  packageTypeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
  },
  selectedPackageType: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  packageTypeDetailsContainer: {
    flex: 1,
  },
  packageTypeOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  packageTypeOptionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  packageTypeOptionWeight: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  packageTypeOptionPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
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

export default DeliveryScreen;