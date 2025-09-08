import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  TextInput,
  Modal,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiService from '../../services/api';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';

interface FavoriteLocation {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'HOME' | 'WORK' | 'OTHER';
  createdAt: string;
}

interface FavoriteDriver {
  id: string;
  name: string;
  phone: string;
  vehicleNumber: string;
  vehicleType: string;
  rating: number;
  totalRides: number;
  photo?: string;
  createdAt: string;
}

const FavoritesScreen: React.FC = () => {
  const navigation = useNavigation();
  const themeColors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const [activeTab, setActiveTab] = useState<'LOCATIONS' | 'DRIVERS'>('LOCATIONS');
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>([
    {
      id: '1',
      name: 'Home',
      address: 'Sector 18, Noida, Uttar Pradesh 201301',
      latitude: 28.5672,
      longitude: 77.3269,
      type: 'HOME',
      createdAt: '2024-01-10T10:00:00Z',
    },
    {
      id: '2',
      name: 'Office',
      address: 'Connaught Place, New Delhi, Delhi 110001',
      latitude: 28.6315,
      longitude: 77.2167,
      type: 'WORK',
      createdAt: '2024-01-08T09:30:00Z',
    },
    {
      id: '3',
      name: 'Gym',
      address: 'DLF Mall of India, Sector 18, Noida',
      latitude: 28.5689,
      longitude: 77.3247,
      type: 'OTHER',
      createdAt: '2024-01-05T18:15:00Z',
    },
  ]);
  const [favoriteDrivers, setFavoriteDrivers] = useState<FavoriteDriver[]>([
    {
      id: '1',
      name: 'Rajesh Kumar',
      phone: '+91 9876543210',
      vehicleNumber: 'DL 01 AB 1234',
      vehicleType: 'Sedan',
      rating: 4.9,
      totalRides: 15,
      createdAt: '2024-01-12T14:30:00Z',
    },
    {
      id: '2',
      name: 'Priya Sharma',
      phone: '+91 9876543211',
      vehicleNumber: 'DL 02 CD 5678',
      vehicleType: 'Hatchback',
      rating: 4.8,
      totalRides: 8,
      createdAt: '2024-01-10T11:20:00Z',
    },
  ]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState({
    name: '',
    address: '',
    type: 'OTHER' as 'HOME' | 'WORK' | 'OTHER',
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  console.log('⭐ FavoritesScreen: Component loaded');
  console.log('⭐ FavoritesScreen: Active tab:', activeTab);
  console.log('⭐ FavoritesScreen: Favorite locations count:', favoriteLocations.length);
  console.log('⭐ FavoritesScreen: Favorite drivers count:', favoriteDrivers.length);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    console.log('⭐ FavoritesScreen: Fetching favorites from API');
    setRefreshing(true);
    try {
      // Fetch favorite locations and drivers from API
      const locationsResponse = await apiService.getFavoriteLocations();
      const driversResponse = await apiService.getFavoriteDrivers();
      
      // Update state with API data
      if (locationsResponse.data) {
        setFavoriteLocations(locationsResponse.data.locations || []);
      }
      if (driversResponse.data) {
        setFavoriteDrivers(driversResponse.data.drivers || []);
      }
      
      console.log('✅ FavoritesScreen: Favorites loaded successfully');
    } catch (error) {
      console.error('❌ FavoritesScreen: Error fetching favorites:', error);
      Alert.alert('Error', 'Failed to load favorites. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'HOME': return '🏠';
      case 'WORK': return '🏢';
      case 'OTHER': return '📍';
      default: return '📍';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const addFavoriteLocation = async () => {
    console.log('⭐ FavoritesScreen: Adding new location:', { name: newLocation.name, address: newLocation.address, type: newLocation.type });
    
    if (!newLocation.name.trim()) {
      console.log('❌ FavoritesScreen: Missing location name');
      Alert.alert('Error', 'Please enter a location name');
      return;
    }

    if (!newLocation.address.trim()) {
      console.log('❌ FavoritesScreen: Missing location address');
      Alert.alert('Error', 'Please enter the address');
      return;
    }

    setLoading(true);
    try {
      const location: FavoriteLocation = {
        id: Date.now().toString(),
        name: newLocation.name,
        address: newLocation.address,
        latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
        type: newLocation.type,
        createdAt: new Date().toISOString(),
      };

      // TODO: Implement API call to save favorite location
      // await apiService.addFavoriteLocation(location);
      
      setFavoriteLocations(prev => [location, ...prev]);
      setShowLocationModal(false);
      setNewLocation({ name: '', address: '', type: 'OTHER' });
      
      console.log('✅ FavoritesScreen: Location added successfully:', location);
      Alert.alert('Success', 'Location added to favorites!');
    } catch (error) {
      console.error('❌ FavoritesScreen: Error adding location:', error);
      Alert.alert('Error', 'Failed to add location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFavoriteLocation = (id: string) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this location from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFavoriteLocations(prev => prev.filter(location => location.id !== id));
          },
        },
      ]
    );
  };

  const removeFavoriteDriver = (id: string) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this driver from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setFavoriteDrivers(prev => prev.filter(driver => driver.id !== id));
          },
        },
      ]
    );
  };

  const requestRideToLocation = (location: FavoriteLocation) => {
    console.log('⭐ FavoritesScreen: Requesting ride to location:', location);
    Alert.alert(
      'Book Ride',
      `Would you like to book a ride to ${location.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Book Now', 
          onPress: () => {
            console.log('⭐ FavoritesScreen: User confirmed ride booking to:', location.name);
            // Navigate to ride booking with pre-filled destination
            // TODO: Implement navigation to RideRequest screen with pre-filled data
            Alert.alert('Success', `Booking ride to ${location.name}...`);
          }
        },
      ]
    );
  };

  const requestRideWithDriver = (driver: FavoriteDriver) => {
    Alert.alert(
      'Request Ride',
      `Request a ride with ${driver.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Ride',
          onPress: () => {
            console.log('Requesting ride with driver:', driver);
            Alert.alert('Success', 'Ride request sent to your favorite driver!');
          },
        },
      ]
    );
  };

  const renderLocation = ({ item }: { item: FavoriteLocation }) => (
    <View style={styles.favoriteItem}>
      <View style={styles.favoriteLeft}>
        <View style={styles.favoriteIcon}>
          <Text style={styles.favoriteEmoji}>{getLocationIcon(item.type)}</Text>
        </View>
        <View style={styles.favoriteDetails}>
          <Text style={styles.favoriteName}>{item.name}</Text>
          <Text style={styles.favoriteAddress}>{item.address}</Text>
          <Text style={styles.favoriteDate}>Added on {formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.favoriteActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => requestRideToLocation(item)}
        >
          <Text style={styles.actionButtonText}>🚗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removeFavoriteLocation(item.id)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderDriver = ({ item }: { item: FavoriteDriver }) => (
    <View style={styles.favoriteItem}>
      <View style={styles.favoriteLeft}>
        <View style={styles.driverAvatar}>
          <Text style={styles.driverInitial}>{item.name.charAt(0)}</Text>
        </View>
        <View style={styles.favoriteDetails}>
          <Text style={styles.favoriteName}>{item.name}</Text>
          <Text style={styles.driverVehicle}>{item.vehicleType} • {item.vehicleNumber}</Text>
          <View style={styles.driverStats}>
            <Text style={styles.driverRating}>⭐ {item.rating}</Text>
            <Text style={styles.driverRides}>• {item.totalRides} rides</Text>
          </View>
          <Text style={styles.favoriteDate}>Added on {formatDate(item.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.favoriteActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => requestRideWithDriver(item)}
        >
          <Text style={styles.actionButtonText}>🚗</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => removeFavoriteDriver(item.id)}
        >
          <Text style={styles.removeButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        {activeTab === 'LOCATIONS' && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Text style={styles.addButtonText}>+ Add Location</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'LOCATIONS' && styles.activeTab]}
          onPress={() => setActiveTab('LOCATIONS')}
        >
          <Text style={[styles.tabText, activeTab === 'LOCATIONS' && styles.activeTabText]}>
            📍 Locations ({favoriteLocations.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'DRIVERS' && styles.activeTab]}
          onPress={() => setActiveTab('DRIVERS')}
        >
          <Text style={[styles.tabText, activeTab === 'DRIVERS' && styles.activeTabText]}>
            👤 Drivers ({favoriteDrivers.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'LOCATIONS' ? (
          <View style={styles.favoritesContainer}>
            <FlatList
              data={favoriteLocations}
              renderItem={renderLocation}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.favoriteSeparator} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📍</Text>
                  <Text style={styles.emptyText}>No favorite locations</Text>
                  <Text style={styles.emptySubtext}>Add your frequently visited places for quick access</Text>
                  <TouchableOpacity
                    style={styles.emptyButton}
                    onPress={() => setShowLocationModal(true)}
                  >
                    <Text style={styles.emptyButtonText}>Add First Location</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        ) : (
          <View style={styles.favoritesContainer}>
            <FlatList
              data={favoriteDrivers}
              renderItem={renderDriver}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.favoriteSeparator} />}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>👤</Text>
                  <Text style={styles.emptyText}>No favorite drivers</Text>
                  <Text style={styles.emptySubtext}>Drivers you rate highly will appear here automatically</Text>
                </View>
              }
            />
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Favorite Location</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location Name</Text>
              <TextInput
                style={styles.textInput}
                value={newLocation.name}
                onChangeText={(text) => setNewLocation(prev => ({ ...prev, name: text }))}
                placeholder="e.g., Home, Office, Gym"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newLocation.address}
                onChangeText={(text) => setNewLocation(prev => ({ ...prev, address: text }))}
                placeholder="Enter full address"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Location Type</Text>
              <View style={styles.locationTypeSelector}>
                {[{ key: 'HOME', label: '🏠 Home' }, { key: 'WORK', label: '🏢 Work' }, { key: 'OTHER', label: '📍 Other' }].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.locationTypeOption,
                      newLocation.type === type.key && styles.locationTypeOptionActive
                    ]}
                    onPress={() => setNewLocation(prev => ({ ...prev, type: type.key as any }))}
                  >
                    <Text style={[
                      styles.locationTypeOptionText,
                      newLocation.type === type.key && styles.locationTypeOptionTextActive
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLocationModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, loading && styles.buttonDisabled]}
                onPress={addFavoriteLocation}
                disabled={loading}
              >
                <Text style={styles.modalConfirmText}>
                  {loading ? 'Adding...' : 'Add Location'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.themeColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.themeColors.surface,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
  },
  addButton: {
    backgroundColor: theme.themeColors.brand,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: theme.themeColors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.themeColors.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.themeColors.backgroundSecondary,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: theme.themeColors.brand,
  },
  tabText: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.themeColors.textInverse,
  },
  content: {
    flex: 1,
  },
  favoritesContainer: {
    backgroundColor: theme.themeColors.surface,
    margin: 20,
    borderRadius: 16,
    padding: 20,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  favoriteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  favoriteIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.themeColors.brandLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  favoriteEmoji: {
    fontSize: 20,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.themeColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  driverInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.themeColors.textInverse,
  },
  favoriteDetails: {
    flex: 1,
  },
  favoriteName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.themeColors.textPrimary,
    marginBottom: 4,
  },
  favoriteAddress: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  driverVehicle: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    marginBottom: 4,
  },
  driverStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  driverRating: {
    fontSize: 12,
    color: theme.themeColors.textPrimary,
  },
  driverRides: {
    fontSize: 12,
    color: theme.themeColors.textSecondary,
    marginLeft: 4,
  },
  favoriteDate: {
    fontSize: 12,
    color: theme.themeColors.textTertiary,
  },
  favoriteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.themeColors.brand,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
  },
  removeButton: {
    backgroundColor: theme.themeColors.error,
  },
  removeButtonText: {
    fontSize: 14,
  },
  favoriteSeparator: {
    height: 1,
    backgroundColor: theme.themeColors.backgroundSecondary,
    marginVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    color: theme.themeColors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.themeColors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.themeColors.brand,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.themeColors.surface,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.themeColors.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.themeColors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.themeColors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.themeColors.backgroundSecondary,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  locationTypeSelector: {
    gap: 8,
  },
  locationTypeOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.themeColors.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  locationTypeOptionActive: {
    borderColor: theme.themeColors.brand,
    backgroundColor: theme.themeColors.brandLight,
  },
  locationTypeOptionText: {
    fontSize: 14,
    color: theme.themeColors.textSecondary,
    fontWeight: '500',
  },
  locationTypeOptionTextActive: {
    color: theme.themeColors.brand,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: theme.themeColors.backgroundSecondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalCancelText: {
    color: theme.themeColors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: theme.themeColors.brand,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  modalConfirmText: {
    color: theme.themeColors.textInverse,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: theme.themeColors.disabled,
  },
});

export default FavoritesScreen;