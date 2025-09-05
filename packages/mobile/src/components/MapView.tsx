import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
} from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE } from 'react-native-maps';
import { locationService, Location } from '../services/locationService';

interface Props {
  initialLocation?: Location;
  onLocationSelect?: (location: Location) => void;
  showCurrentLocation?: boolean;
  markers?: Array<{
    id: string;
    location: Location;
    title?: string;
    description?: string;
  }>;
  style?: any;
}

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const CustomMapView: React.FC<Props> = ({
  initialLocation,
  onLocationSelect,
  showCurrentLocation = true,
  markers = [],
  style,
}) => {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>({
    latitude: initialLocation?.latitude || 28.6139,
    longitude: initialLocation?.longitude || 77.2090,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [loading, setLoading] = useState(false);

  console.log('🗺️ MapView: Component loaded with initial location:', initialLocation);
  console.log('🗺️ MapView: Show current location:', showCurrentLocation);
  console.log('🗺️ MapView: Markers count:', markers.length);

  useEffect(() => {
    if (showCurrentLocation) {
      getCurrentLocation();
    }
  }, [showCurrentLocation]);

  const getCurrentLocation = async () => {
    console.log('🗺️ MapView: Getting current location');
    setLoading(true);
    
    try {
      const location = await locationService.getCurrentLocation();
      const address = await locationService.reverseGeocode(location.latitude, location.longitude);
      const locationWithAddress = { ...location, address };
      
      console.log('🗺️ MapView: Current location obtained:', locationWithAddress);
      setCurrentLocation(locationWithAddress);
      
      // Update region to center on current location
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      setRegion(newRegion);
      
      // Animate to current location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    } catch (error) {
      console.error('🗺️ MapView: Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Please check your location settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('🗺️ MapView: Map pressed at:', latitude, longitude);
    
    try {
      const address = await locationService.reverseGeocode(latitude, longitude);
      const location: Location = { latitude, longitude, address };
      
      console.log('🗺️ MapView: Location selected:', location);
      setSelectedLocation(location);
      
      if (onLocationSelect) {
        onLocationSelect(location);
      }
    } catch (error) {
      console.error('🗺️ MapView: Error processing map press:', error);
    }
  };

  const handleRegionChange = (newRegion: Region) => {
    console.log('🗺️ MapView: Region changed:', newRegion);
    setRegion(newRegion);
  };

  const centerOnCurrentLocation = () => {
    console.log('🗺️ MapView: Centering on current location');
    if (currentLocation && mapRef.current) {
      const newRegion = {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      };
      mapRef.current.animateToRegion(newRegion, 1000);
    } else {
      getCurrentLocation();
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChange={handleRegionChange}
        onPress={handleMapPress}
        showsUserLocation={showCurrentLocation}
        showsMyLocationButton={false}
        showsCompass={true}
        showsScale={true}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
      >
        {/* Current location marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Current Location"
            description={currentLocation.address}
            pinColor="blue"
          />
        )}

        {/* Selected location marker */}
        {selectedLocation && (
          <Marker
            coordinate={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
            }}
            title="Selected Location"
            description={selectedLocation.address}
            pinColor="red"
          />
        )}

        {/* Custom markers */}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.location.latitude,
              longitude: marker.location.longitude,
            }}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </MapView>

      {/* Current location button */}
      {showCurrentLocation && (
        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={centerOnCurrentLocation}
          disabled={loading}
        >
          <Text style={styles.currentLocationButtonText}>
            {loading ? '📍' : '🎯'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  currentLocationButtonText: {
    fontSize: 20,
  },
});

export default CustomMapView;