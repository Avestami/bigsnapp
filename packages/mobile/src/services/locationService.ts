import Geolocation from 'react-native-geolocation-service';
import { PermissionsAndroid, Platform, Alert } from 'react-native';

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface LocationError {
  code: number;
  message: string;
}

class LocationService {
  private watchId: number | null = null;

  async requestLocationPermission(): Promise<boolean> {
    console.log('📍 LocationService: Requesting location permission');
    
    if (Platform.OS === 'ios') {
      const result = await Geolocation.requestAuthorization('whenInUse');
      console.log('📍 LocationService: iOS permission result:', result);
      return result === 'granted';
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to your location to provide ride services.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        console.log('📍 LocationService: Android permission result:', granted);
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('📍 LocationService: Error requesting Android permission:', err);
        return false;
      }
    }

    return false;
  }

  async getCurrentLocation(): Promise<Location> {
    console.log('📍 LocationService: Getting current location');
    
    const hasPermission = await this.requestLocationPermission();
    if (!hasPermission) {
      console.error('📍 LocationService: Location permission denied');
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log('📍 LocationService: Current location obtained:', location);
          resolve(location);
        },
        (error) => {
          console.error('📍 LocationService: Error getting current location:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        },
      );
    });
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    console.log('📍 LocationService: Reverse geocoding:', latitude, longitude);
    
    try {
      // TODO: Implement actual reverse geocoding using Google Maps API or similar
      // For now, return a mock address
      const mockAddress = `Location at ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      console.log('📍 LocationService: Mock address generated:', mockAddress);
      return mockAddress;
    } catch (error) {
      console.error('📍 LocationService: Error in reverse geocoding:', error);
      throw error;
    }
  }

  async geocodeAddress(address: string): Promise<Location> {
    console.log('📍 LocationService: Geocoding address:', address);
    
    try {
      // TODO: Implement actual geocoding using Google Maps API or similar
      // For now, return mock coordinates
      const mockLocation: Location = {
        latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
        address: address,
      };
      console.log('📍 LocationService: Mock location generated:', mockLocation);
      return mockLocation;
    } catch (error) {
      console.error('📍 LocationService: Error in geocoding:', error);
      throw error;
    }
  }

  startWatchingLocation(
    onLocationUpdate: (location: Location) => void,
    onError: (error: LocationError) => void,
  ): void {
    console.log('📍 LocationService: Starting location watch');
    
    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        console.log('📍 LocationService: Location update:', location);
        onLocationUpdate(location);
      },
      (error) => {
        console.error('📍 LocationService: Location watch error:', error);
        onError(error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000,
      },
    );
  }

  stopWatchingLocation(): void {
    console.log('📍 LocationService: Stopping location watch');
    
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
      console.log('📍 LocationService: Location watch stopped');
    }
  }

  calculateDistance(loc1: Location, loc2: Location): number {
    console.log('📍 LocationService: Calculating distance between:', loc1, loc2);
    
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(loc2.latitude - loc1.latitude);
    const dLon = this.deg2rad(loc2.longitude - loc1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(loc1.latitude)) *
        Math.cos(this.deg2rad(loc2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    
    console.log('📍 LocationService: Calculated distance:', distance, 'km');
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const locationService = new LocationService();
export default locationService;