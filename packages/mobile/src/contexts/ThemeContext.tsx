import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, ThemeContextType, ThemeType } from '../theme';
import { Colors } from '../theme/colors';

// Dark theme colors (extending the existing color system)
const DarkColors = {
  ...Colors,
  
  // Override surface colors for dark theme
  surface: {
    background: '#121212',
    card: '#1E1E1E',
    elevated: '#2D2D2D',
    overlay: 'rgba(0, 0, 0, 0.7)',
    disabled: '#2D2D2D',
  },
  
  // Override text colors for dark theme
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    disabled: '#666666',
    inverse: '#000000',
    link: '#64B5F6',
    placeholder: '#666666',
  },
  
  // Override border colors for dark theme
  border: {
    light: '#333333',
    medium: '#555555',
    dark: '#777777',
    focus: '#64B5F6',
    error: '#EF5350',
  },
  
  // Override neutral colors for dark theme
  neutral: {
    ...Colors.neutral,
    0: '#000000',
    50: '#121212',
    100: '#1E1E1E',
    200: '#2D2D2D',
    300: '#404040',
    400: '#666666',
    500: '#888888',
    600: '#B3B3B3',
    700: '#CCCCCC',
    800: '#E0E0E0',
    900: '#F5F5F5',
    1000: '#FFFFFF',
  },
};

// Dark theme object
const DarkTheme = {
  ...Theme,
  colors: DarkColors,
  themeColors: {
    ...Theme.themeColors,
    background: DarkColors.surface.background,
    surface: DarkColors.surface.card,
    surfaceElevated: DarkColors.surface.elevated,
    textPrimary: DarkColors.text.primary,
    textSecondary: DarkColors.text.secondary,
    textDisabled: DarkColors.text.disabled,
    textInverse: DarkColors.text.inverse,
    border: DarkColors.border.light,
    borderFocus: DarkColors.border.focus,
    divider: DarkColors.neutral[200],
    shadow: DarkColors.neutral[0],
    shadowLight: DarkColors.neutral[100],
  },
};

const THEME_STORAGE_KEY = '@snapp_theme_preference';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference on app start
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-switch if user hasn't set a manual preference
      AsyncStorage.getItem(THEME_STORAGE_KEY).then((storedTheme) => {
        if (!storedTheme) {
          setIsDark(colorScheme === 'dark');
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  const loadThemePreference = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      
      if (storedTheme !== null) {
        // User has a saved preference
        setIsDark(storedTheme === 'dark');
      } else {
        // No saved preference, use system theme
        const systemTheme = Appearance.getColorScheme();
        setIsDark(systemTheme === 'dark');
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
      // Fallback to system theme
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDark;
      setIsDark(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme ? 'dark' : 'light');
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  };

  const resetToSystemTheme = async () => {
    try {
      await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      const systemTheme = Appearance.getColorScheme();
      setIsDark(systemTheme === 'dark');
    } catch (error) {
      console.warn('Failed to reset theme preference:', error);
    }
  };

  const currentTheme = isDark ? DarkTheme : Theme;

  const contextValue: ThemeContextType = {
    theme: currentTheme as ThemeType,
    isDark,
    toggleTheme,
  };

  // Show loading state while theme is being determined
  if (isLoading) {
    return null; // or a loading component
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook to get current colors (shorthand)
export const useColors = () => {
  const { theme } = useTheme();
  return theme.colors;
};

// Hook to get theme colors (shorthand)
export const useThemeColors = () => {
  const { theme } = useTheme();
  return theme.themeColors;
};

// Hook to get typography (shorthand)
export const useTypography = () => {
  const { theme } = useTheme();
  return theme.typography;
};

// Hook to get spacing (shorthand)
export const useSpacing = () => {
  const { theme } = useTheme();
  return theme.spacing;
};

// Hook to get component styles (shorthand)
export const useComponentStyles = () => {
  const { theme } = useTheme();
  return theme.components;
};

// Hook to create themed styles
export const useThemedStyles = <T extends Record<string, any>>(
  createStyles: (theme: typeof Theme) => T
): T => {
  const { theme } = useTheme();
  return createStyles(theme);
};

export default ThemeContext;