import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAuth } from '../../contexts/AuthContext';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';
import { RootStackParamList } from '../../navigation/types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const { width } = Dimensions.get('window');

interface QuickAction {
  id: string;
  title: string;
  icon: string;
  color: string;
  onPress: () => void;
}

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const themeColors = useThemeColors();
  const [greeting, setGreeting] = useState('');

  console.log('🏠 HomeScreen: Component loaded');
  console.log('🏠 HomeScreen: Current user:', user ? { id: user.id, email: user.email, userType: user.userType } : null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: '1',
      title: 'Book a Ride',
      icon: '🚗',
      color: themeColors.brand,
      onPress: () => {
        console.log('🚗 HomeScreen: User tapped "Book a Ride"');
        navigation.navigate('RideRequest');
      },
    },
    {
      id: '2',
      title: 'Send Package',
      icon: '📦',
      color: themeColors.warning,
      onPress: () => {
        console.log('📦 HomeScreen: User tapped "Send Package"');
        navigation.navigate('RequestDelivery');
      },
    },
    {
      id: '3',
      title: 'My Wallet',
      icon: '💳',
      color: themeColors.success,
      onPress: () => {
        console.log('💳 HomeScreen: User tapped "My Wallet"');
        // Navigate to the Wallet tab
        navigation.navigate('MainTabs', { screen: 'Wallet' } as never);
      },
    },
    {
      id: '4',
      title: 'Favorites',
      icon: '❤️',
      color: themeColors.warning,
      onPress: () => {
        console.log('❤️ HomeScreen: User tapped "Favorites"');
        // Navigate to the Favorites tab
        navigation.navigate('MainTabs', { screen: 'Favorites' } as never);
      },
    },
  ];

  const recentActivity = [
    {
      id: '1',
      type: 'ride',
      title: 'Ride to Airport',
      subtitle: 'Completed • Jan 15, 2024',
      amount: '120000 تومان',
      status: 'completed',
    },
    {
      id: '2',
      type: 'delivery',
      title: 'Food Delivery',
      subtitle: 'Delivered • Jan 14, 2024',
      amount: '85000 تومان',
      status: 'completed',
    },
    {
      id: '3',
      type: 'wallet',
      title: 'Wallet Top-up',
      subtitle: 'Added • Jan 13, 2024',
      amount: '+500000 تومان',
      status: 'completed',
    },
  ];

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={[styles.quickActionCard, { borderLeftColor: action.color }]}
      onPress={action.onPress}
    >
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionIcon}>{action.icon}</Text>
        <Text style={styles.quickActionTitle}>{action.title}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecentItem = (item: any) => (
    <View key={item.id} style={styles.recentItem}>
      <View style={styles.recentLeft}>
        <View style={[styles.recentIcon, { backgroundColor: getStatusColor(item.type) }]}>
          <Text style={styles.recentEmoji}>{getTypeIcon(item.type)}</Text>
        </View>
        <View style={styles.recentDetails}>
          <Text style={styles.recentTitle}>{item.title}</Text>
          <Text style={styles.recentSubtitle}>{item.subtitle}</Text>
        </View>
      </View>
      <Text style={[styles.recentAmount, { color: item.amount.startsWith('+') ? themeColors.success : themeColors.textPrimary }]}>
        {item.amount}
      </Text>
    </View>
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ride': return '🚗';
      case 'delivery': return '📦';
      case 'wallet': return '💳';
      default: return '📱';
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'ride': return '#007AFF';
      case 'delivery': return '#FF6B35';
      case 'wallet': return '#28A745';
      default: return '#6C757D';
    }
  };

  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting}!</Text>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map(renderQuickAction)}
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.recentContainer}>
          {recentActivity.map(renderRecentItem)}
        </View>
      </View>


    </ScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIcon: {
    fontSize: 20,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    width: (width - 52) / 2,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  recentContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentEmoji: {
    fontSize: 18,
    color: '#fff',
  },
  recentDetails: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  recentSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  recentAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },

});

export default HomeScreen;