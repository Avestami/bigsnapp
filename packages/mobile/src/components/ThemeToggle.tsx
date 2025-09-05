import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme, useThemedStyles } from '../contexts/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  style?: any;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showLabel = true, 
  style 
}) => {
  const { isDark, toggleTheme, theme } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={toggleTheme}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Icon 
            name={isDark ? 'dark-mode' : 'light-mode'} 
            size={24} 
            color={theme.themeColors.brand} 
          />
        </View>
        
        {showLabel && (
          <View style={styles.labelContainer}>
            <Text style={styles.title}>Dark Mode</Text>
            <Text style={styles.subtitle}>
              {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            </Text>
          </View>
        )}
        
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{
            false: theme.themeColors.border,
            true: theme.themeColors.brand,
          }}
          thumbColor={isDark ? theme.themeColors.surface : theme.themeColors.background}
          ios_backgroundColor={theme.themeColors.border}
        />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  labelContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default ThemeToggle;