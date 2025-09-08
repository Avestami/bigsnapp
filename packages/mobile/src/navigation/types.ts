import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

// Auth Stack Types
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// Main Tab Types (for riders)
export type MainTabParamList = {
  Home: undefined;
  Delivery: undefined;
  Wallet: undefined;
  Reviews: undefined;
  Favorites: undefined;
  Settings: undefined;
};

// Driver Tab Types
export type DriverTabParamList = {
  Dashboard: undefined;
  Earnings: undefined;
  Availability: undefined;
  Settings: undefined;
};

// Main Stack Types
export type MainStackParamList = {
  MainTabs: undefined;
  RequestDelivery: undefined;
  TrackDelivery: { deliveryId: string };
  DeliveryHistory: undefined;
  RideRequest: undefined;
  RideInProgress: { rideId: string };
  Delivery: undefined;
  DeliveryInProgress: { deliveryId: string };
};

// Admin Stack Types
export type AdminStackParamList = {
  AdminDashboard: undefined;
  AdminUserManagement: undefined;
  AdminOrderManagement: undefined;
  AdminAnalytics: undefined;
  AdminSettings: undefined;
};

// Root Stack Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Admin: undefined;
  MainTabs: { screen?: keyof MainTabParamList } | undefined;
  DriverTabs: { screen?: keyof DriverTabParamList } | undefined;
  RequestDelivery: undefined;
  TrackDelivery: { deliveryId: string };
  DeliveryHistory: undefined;
  RideRequest: undefined;
  RideInProgress: { rideId: string };
  Delivery: undefined;
  DeliveryInProgress: { deliveryId: string };
};

// Navigation Props
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;
export type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<MainStackParamList>
>;

export type DeliveryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Delivery'>,
  StackNavigationProp<MainStackParamList>
>;

export type WalletScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Wallet'>,
  StackNavigationProp<MainStackParamList>
>;

export type ReviewsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Reviews'>,
  StackNavigationProp<MainStackParamList>
>;

export type FavoritesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Favorites'>,
  StackNavigationProp<MainStackParamList>
>;

export type SettingsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Settings'>,
  StackNavigationProp<MainStackParamList>
>;

export type RequestDeliveryScreenNavigationProp = StackNavigationProp<MainStackParamList, 'RequestDelivery'>;
export type TrackDeliveryScreenNavigationProp = StackNavigationProp<MainStackParamList, 'TrackDelivery'>;
export type DeliveryHistoryScreenNavigationProp = StackNavigationProp<MainStackParamList, 'DeliveryHistory'>;
export type RideRequestScreenNavigationProp = StackNavigationProp<MainStackParamList, 'RideRequest'>;
export type RideInProgressScreenNavigationProp = StackNavigationProp<MainStackParamList, 'RideInProgress'>;

export type AdminDashboardScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminDashboard'>;
export type AdminUserManagementScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminUserManagement'>;
export type AdminOrderManagementScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminOrderManagement'>;
export type AdminAnalyticsScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminAnalytics'>;
export type AdminSettingsScreenNavigationProp = StackNavigationProp<AdminStackParamList, 'AdminSettings'>;