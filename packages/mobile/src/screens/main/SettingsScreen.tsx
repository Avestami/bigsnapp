import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useThemedStyles, useThemeColors } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useNavigation } from '@react-navigation/native';
import { SettingsScreenNavigationProp } from '../../navigation/types';

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'toggle' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const SettingsScreen = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const themeColors = useThemeColors();
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [autoAcceptRides, setAutoAcceptRides] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            console.log('🚪 SettingsScreen: User logging out');
            logout();
          },
        },
      ]
    );
  };

  const settingSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'theme',
          title: 'Theme',
          subtitle: 'Customize app appearance',
          icon: 'palette',
          type: 'custom' as const,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          title: 'Push Notifications',
          subtitle: 'Receive ride updates and offers',
          icon: 'notifications',
          type: 'toggle' as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'location',
          title: 'Location Services',
          subtitle: 'Allow location access for better service',
          icon: 'location-on',
          type: 'toggle' as const,
          value: locationServices,
          onToggle: setLocationServices,
        },
        {
          id: 'auto-accept',
          title: 'Auto Accept Rides',
          subtitle: 'Automatically accept ride requests (Drivers only)',
          icon: 'directions-car',
          type: 'toggle' as const,
          value: autoAcceptRides,
          onToggle: setAutoAcceptRides,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          subtitle: 'Update your personal information',
          icon: 'person',
          type: 'navigation' as const,
          onPress: () => console.log('Navigate to Profile'),
        },
        {
          id: 'payment',
          title: 'Payment Methods',
          subtitle: 'Manage your payment options',
          icon: 'payment',
          type: 'navigation' as const,
          onPress: () => console.log('Navigate to Payment'),
        },
        {
          id: 'security',
          title: 'Security & Privacy',
          subtitle: 'Password and privacy settings',
          icon: 'security',
          type: 'navigation' as const,
          onPress: () => console.log('Navigate to Security'),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          subtitle: 'Get help and support',
          icon: 'help',
          type: 'navigation' as const,
          onPress: () => console.log('Navigate to Help'),
        },
        {
          id: 'contact',
          title: 'Contact Us',
          subtitle: 'Reach out to our support team',
          icon: 'contact-support',
          type: 'navigation' as const,
          onPress: () => console.log('Navigate to Contact'),
        },
        {
          id: 'about',
          title: 'About',
          subtitle: 'App version and information',
          icon: 'info',
          type: 'navigation' as const,
          onPress: () => console.log('Navigate to About'),
        },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    if (item.id === 'theme') {
      return (
        <View key={item.id} style={styles.themeContainer}>
          <ThemeToggle />
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.settingItem}
        onPress={item.onPress}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingContent}>
          <View style={styles.settingIcon}>
            <Icon name={item.icon} size={24} color={themeColors.brand} />
          </View>
          <View style={styles.settingText}>
            <Text style={styles.settingTitle}>{item.title}</Text>
            {item.subtitle && (
              <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
            )}
          </View>
          {item.type === 'toggle' && (
            <Switch
              value={item.value}
              onValueChange={item.onToggle}
              trackColor={{
                false: themeColors.border,
                true: themeColors.brand,
              }}
              thumbColor={item.value ? themeColors.surface : themeColors.background}
              ios_backgroundColor={themeColors.border}
            />
          )}
          {item.type === 'navigation' && (
            <Icon name="chevron-right" size={24} color={themeColors.textSecondary} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Icon name="account-circle" size={60} color={themeColors.brand} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            <View style={styles.userBadge}>
              <Text style={styles.userBadgeText}>
                {user?.userType === 'DRIVER' ? 'Driver' : 'Passenger'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Settings Sections */}
      {settingSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionContent}>
            {section.items.map(renderSettingItem)}
          </View>
        </View>
      ))}

      {/* Logout Button */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" size={24} color={themeColors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* App Version */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>Snapp Clone v1.0.0</Text>
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
    backgroundColor: colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  userBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.buttonText,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
  },
  themeContainer: {
    padding: 4,
  },
  settingItem: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.error,
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 20,
  },
  versionText: {
    fontSize: 14,
    color: colors.textDisabled,
  },
});

export default SettingsScreen;