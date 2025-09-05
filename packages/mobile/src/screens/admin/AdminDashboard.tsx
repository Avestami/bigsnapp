import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';

// Debug logging utilities
const debugLog = (action: string, data?: any) => {
  console.log(`👑 [AdminDashboard] ${action}`, data ? JSON.stringify(data, null, 2) : '');
};

const errorLog = (action: string, error: any) => {
  console.error(`❌ [AdminDashboard] ${action} ERROR:`, error);
  if (error?.response) {
    console.error(`❌ [AdminDashboard] Response Status:`, error.response.status);
    console.error(`❌ [AdminDashboard] Response Data:`, error.response.data);
  }
  if (error?.message) {
    console.error(`❌ [AdminDashboard] Error Message:`, error.message);
  }
  console.error(`❌ [AdminDashboard] Full Error:`, error);
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();

  debugLog('Component loaded', {
    hasUser: !!user,
    userId: user?.id,
    userEmail: user?.email,
    userType: user?.userType,
    userName: user?.name
  });

  const handleLogout = () => {
    debugLog('handleLogout - Logout confirmation requested');
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            debugLog('handleLogout - Logout cancelled by user');
          },
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            debugLog('handleLogout - Logout confirmed, calling logout()');
            try {
              await logout();
              debugLog('handleLogout - Logout successful');
            } catch (error) {
              errorLog('handleLogout', error);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome, {user?.name}</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => {
            debugLog('Navigation - User Management selected');
            navigation.navigate('AdminUserManagement' as never);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>User Management</Text>
          <Text style={styles.cardDescription}>
            Manage users, drivers, and riders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => {
            debugLog('Navigation - Order Management selected');
            navigation.navigate('AdminOrderManagement' as never);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>Order Management</Text>
          <Text style={styles.cardDescription}>
            View and manage delivery orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => {
            debugLog('Navigation - Analytics selected');
            navigation.navigate('AdminAnalytics' as never);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>Analytics</Text>
          <Text style={styles.cardDescription}>
            View platform statistics and reports
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card} 
          onPress={() => {
            debugLog('Navigation - Settings selected');
            navigation.navigate('AdminSettings' as never);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>Settings</Text>
          <Text style={styles.cardDescription}>
            Configure platform settings
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminDashboard;