import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';
import apiService from '../../services/api';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';

type RequestDeliveryScreenNavigationProp = NavigationProp<RootStackParamList, 'RequestDelivery'>;

interface Props {
  navigation: RequestDeliveryScreenNavigationProp;
}

const RequestDeliveryScreen: React.FC<Props> = ({ navigation }) => {
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [pickupAddress, setPickupAddress] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [packageDescription, setPackageDescription] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestDelivery = async () => {
    console.log('🚚 RequestDeliveryScreen: Attempting to request delivery');
    console.log('🚚 RequestDeliveryScreen: Form data:', {
      pickupAddress,
      deliveryAddress,
      recipientName,
      recipientPhone,
      packageDescription
    });
    
    if (!pickupAddress.trim() || !deliveryAddress.trim() || !recipientName.trim() || !recipientPhone.trim()) {
      console.log('❌ RequestDeliveryScreen: Missing required fields');
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!packageDescription.trim()) {
      console.log('❌ RequestDeliveryScreen: Missing package description');
      Alert.alert('Error', 'Please describe what you want to deliver');
      return;
    }

    setLoading(true);
    try {
      console.log('🚚 RequestDeliveryScreen: Calling delivery API');
      
      const deliveryData = {
        pickupLatitude: 0, // TODO: Get from map
        pickupLongitude: 0, // TODO: Get from map
        pickupAddress: pickupAddress.trim(),
        deliveryLatitude: 0, // TODO: Get from map
        deliveryLongitude: 0, // TODO: Get from map
        deliveryAddress: deliveryAddress.trim(),
        packageType: 'standard', // TODO: Add package type selection
        packageDescription: packageDescription.trim(),
        recipientName: recipientName.trim(),
        recipientPhone: recipientPhone.trim(),
        estimatedFare: 0, // TODO: Calculate estimated fare
      };
      
      // Submit delivery request to API
      const response = await apiService.requestDelivery(deliveryData);
      console.log('🚚 RequestDeliveryScreen: Delivery request submitted:', response.data);
      
      console.log('✅ RequestDeliveryScreen: Delivery request submitted successfully');
      Alert.alert(
        'Success',
        'Your delivery request has been submitted! A driver will be assigned shortly.',
        [
          {
            text: 'OK',
            onPress: () => {
              console.log('🚚 RequestDeliveryScreen: Navigating back after successful request');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ RequestDeliveryScreen: Delivery request failed:', error);
      Alert.alert('Error', 'Failed to submit delivery request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Request Delivery</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Pickup Address</Text>
          <TextInput
            style={styles.input}
            value={pickupAddress}
            onChangeText={setPickupAddress}
            placeholder="Enter pickup address"
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
            placeholder="Enter delivery address"
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Package Description</Text>
          <TextInput
            style={styles.input}
            value={packageDescription}
            onChangeText={setPackageDescription}
            placeholder="Describe the package"
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipient Name</Text>
          <TextInput
            style={styles.input}
            value={recipientName}
            onChangeText={setRecipientName}
            placeholder="Enter recipient name"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Recipient Phone</Text>
          <TextInput
            style={styles.input}
            value={recipientPhone}
            onChangeText={setRecipientPhone}
            placeholder="Enter recipient phone number"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRequestDelivery}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Submitting...' : 'Request Delivery'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.themeColors.backgroundSecondary,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: theme.themeColors.textPrimary,
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
    color: theme.themeColors.textPrimary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.themeColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.themeColors.background,
    color: theme.themeColors.textPrimary,
  },
  button: {
    backgroundColor: theme.themeColors.brand,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: theme.themeColors.disabled,
  },
  buttonText: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RequestDeliveryScreen;