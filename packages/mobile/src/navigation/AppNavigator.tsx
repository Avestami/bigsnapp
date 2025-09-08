import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

// Types
import {
  AuthStackParamList,
  MainStackParamList,
  MainTabParamList,
  DriverTabParamList,
  AdminStackParamList,
  RootStackParamList
} from './types';

// Context
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AdminProvider } from '../contexts/AdminContext';
import { UserType } from '../types/user';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main Screens
import HomeScreen from '../screens/main/HomeScreen';
import DeliveryScreen from '../screens/main/DeliveryScreen';
import WalletScreen from '../screens/main/WalletScreen';
import ReviewsScreen from '../screens/main/ReviewsScreen';
import FavoritesScreen from '../screens/main/FavoritesScreen';
import SettingsScreen from '../screens/main/SettingsScreen';

// Delivery Screens
import RequestDeliveryScreen from '../screens/delivery/RequestDeliveryScreen';
import TrackDeliveryScreen from '../screens/delivery/TrackDeliveryScreen';
import DeliveryHistoryScreen from '../screens/delivery/DeliveryHistoryScreen';

// Ride Screens
import RideRequestScreen from '../screens/main/RideRequestScreen';
import RideInProgressScreen from '../screens/main/RideInProgressScreen';

// Admin screens
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminUserManagement from '../screens/admin/AdminUserManagement';
import AdminOrderManagement from '../screens/admin/AdminOrderManagement';
import AdminAnalytics from '../screens/admin/AdminAnalytics';
import AdminSettings from '../screens/admin/AdminSettings';

// Driver screens
import DriverDashboard from '../screens/driver/DriverDashboard';
import DriverEarnings from '../screens/driver/DriverEarnings';
import DriverAvailability from '../screens/driver/DriverAvailability';

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const DriverTab = createBottomTabNavigator<DriverTabParamList>();
const AdminStackNav = createStackNavigator<AdminStackParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

// Admin Stack with AdminProvider
const AdminStack = () => {
  return (
    <AdminProvider>
      <AdminStackNav.Navigator>
        <AdminStackNav.Screen 
          name="AdminDashboard" 
          component={AdminDashboard}
          options={{ title: 'Admin Dashboard' }}
        />
        <AdminStackNav.Screen 
          name="AdminUserManagement" 
          component={AdminUserManagement}
          options={{ title: 'User Management' }}
        />
        <AdminStackNav.Screen 
          name="AdminOrderManagement" 
          component={AdminOrderManagement}
          options={{ title: 'Order Management' }}
        />
        <AdminStackNav.Screen 
          name="AdminAnalytics" 
          component={AdminAnalytics}
          options={{ title: 'Analytics' }}
        />
        <AdminStackNav.Screen 
          name="AdminSettings" 
          component={AdminSettings}
          options={{ title: 'Settings' }}
        />
      </AdminStackNav.Navigator>
    </AdminProvider>
  );
};

const HomeStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MainStack.Screen 
        name="RideRequest" 
        component={RideRequestScreen}
        options={{ title: 'Book a Ride' }}
      />
      <MainStack.Screen 
        name="RideInProgress" 
        component={RideInProgressScreen}
        options={{ title: 'Your Ride' }}
      />
    </MainStack.Navigator>
  );
};

const DeliveryStackNavigator = () => {
  return (
    <MainStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <MainStack.Screen 
        name="Delivery" 
        component={DeliveryScreen}
        options={{ title: 'Send Package' }}
      />
      <MainStack.Screen 
        name="DeliveryInProgress" 
        component={RideInProgressScreen}
        options={{ title: 'Your Delivery' }}
      />
    </MainStack.Navigator>
  );
};

const getTabBarIcon = (routeName: string, focused: boolean) => {
  let icon = '';
  
  switch (routeName) {
    case 'Home':
      icon = focused ? '🚗' : '🚙';
      break;
    case 'Delivery':
      icon = focused ? '📦' : '📫';
      break;
    case 'Wallet':
      icon = focused ? '💳' : '💰';
      break;
    case 'Reviews':
      icon = focused ? '⭐' : '☆';
      break;
    case 'Favorites':
      icon = focused ? '❤️' : '🤍';
      break;
    case 'Settings':
      icon = focused ? '⚙️' : '🔧';
      break;
    default:
      icon = '•';
  }
  
  return icon;
};

// Rider Tab Navigator (for regular users)
const RiderTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Delivery') {
            iconName = focused ? 'local-shipping' : 'local-shipping';
          } else if (route.name === 'Wallet') {
            iconName = focused ? 'account-balance-wallet' : 'account-balance-wallet';
          } else if (route.name === 'Reviews') {
            iconName = focused ? 'star' : 'star-border';
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'favorite' : 'favorite-border';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Delivery" component={DeliveryScreen} />
      <Tab.Screen name="Wallet" component={WalletScreen} />
      <Tab.Screen name="Reviews" component={ReviewsScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

// Driver Tab Navigator (for drivers)
const DriverTabNavigator = () => {
  return (
    <DriverTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'dashboard' : 'dashboard';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'attach-money' : 'attach-money';
          } else if (route.name === 'Availability') {
            iconName = focused ? 'toggle-on' : 'toggle-off';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <DriverTab.Screen 
        name="Dashboard" 
        component={DriverDashboard}
        options={{ title: 'Dashboard' }}
      />
      <DriverTab.Screen 
        name="Earnings" 
        component={DriverEarnings}
        options={{ title: 'Earnings' }}
      />
      <DriverTab.Screen 
        name="Availability" 
        component={DriverAvailability}
        options={{ title: 'Availability' }}
      />
      <DriverTab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </DriverTab.Navigator>
  );
};

// Loading Screen Component
const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

// Rider Navigator that wraps rider tabs with stack for modal screens
const RiderNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={RiderTabNavigator} />
      <RootStack.Screen 
        name="RideRequest" 
        component={RideRequestScreen}
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'Book a Ride'
        }}
      />
      <RootStack.Screen 
        name="RequestDelivery" 
        component={RequestDeliveryScreen}
        options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'Send Package'
        }}
      />
      <RootStack.Screen 
        name="RideInProgress" 
        component={RideInProgressScreen}
        options={{ 
          headerShown: true,
          title: 'Your Ride'
        }}
      />
      <RootStack.Screen 
        name="TrackDelivery" 
        component={TrackDeliveryScreen}
        options={{ 
          headerShown: true,
          title: 'Track Delivery'
        }}
      />
      <RootStack.Screen 
        name="DeliveryHistory" 
        component={DeliveryHistoryScreen}
        options={{ 
          headerShown: true,
          title: 'Delivery History'
        }}
      />
    </RootStack.Navigator>
  );
};

// Driver Navigator that wraps driver tabs with stack for modal screens
const DriverNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="DriverTabs" component={DriverTabNavigator} />
      <RootStack.Screen 
        name="RideInProgress" 
        component={RideInProgressScreen}
        options={{ 
          headerShown: true,
          title: 'Current Ride'
        }}
      />
    </RootStack.Navigator>
  );
};

// Navigation Component that uses Auth Context
const AppNavigation = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  console.log('🧭 AppNavigation State:');
  console.log('- isLoading:', isLoading);
  console.log('- isAuthenticated:', isAuthenticated);
  console.log('- user:', user ? { id: user.id, email: user.email, userType: user.userType } : null);

  if (isLoading) {
    console.log('⏳ AppNavigation: Showing loading screen');
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    console.log('🔐 AppNavigation: User not authenticated, showing AuthNavigator');
    return <AuthNavigator />;
  }

  // Navigate based on user type
  if (user?.userType === UserType.ADMIN) {
    console.log('👑 AppNavigation: Admin user detected, showing AdminStack');
    return <AdminStack />;
  }

  if (user?.userType === UserType.DRIVER) {
    console.log('🚗 AppNavigation: Driver user detected, showing DriverNavigator');
    return <DriverNavigator />;
  }

  // Default to rider navigator for RIDER
  console.log('👤 AppNavigation: Rider user detected, showing RiderNavigator');
  return <RiderNavigator />;
};

// Main App Navigator with Auth Provider
const AppNavigator = () => {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default AppNavigator;