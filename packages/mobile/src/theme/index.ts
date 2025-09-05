// Modern Theme System for Snapp Clone
// Comprehensive design system with colors, typography, spacing, and components

import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Colors, ThemeColors } from './colors';
import { Typography, FontSize, FontWeight } from './typography';
import { Spacing, ComponentSpacing, LayoutSpacing } from './spacing';

// Border radius system
export const BorderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

// Shadow system
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  xs: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  sm: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  md: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  
  lg: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  
  xl: {
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;

// Component styles - Pre-built component styles
export const ComponentStyles = {
  // Button variants
  button: {
    base: {
      borderRadius: BorderRadius.md,
      paddingVertical: ComponentSpacing.buttonPaddingVertical,
      paddingHorizontal: ComponentSpacing.buttonPaddingHorizontal,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      flexDirection: 'row' as const,
      minHeight: LayoutSpacing.minTouchTarget,
    } as ViewStyle,
    
    primary: {
      backgroundColor: ThemeColors.brand,
      ...Shadows.sm,
    } as ViewStyle,
    
    secondary: {
      backgroundColor: Colors.neutral[100],
      borderWidth: 1,
      borderColor: Colors.border.light,
    } as ViewStyle,
    
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: ThemeColors.brand,
    } as ViewStyle,
    
    ghost: {
      backgroundColor: 'transparent',
    } as ViewStyle,
    
    danger: {
      backgroundColor: Colors.error[500],
      ...Shadows.sm,
    } as ViewStyle,
  },
  
  // Card variants
  card: {
    base: {
      backgroundColor: ThemeColors.surface,
      borderRadius: BorderRadius.lg,
      padding: ComponentSpacing.cardPadding,
      ...Shadows.sm,
    } as ViewStyle,
    
    elevated: {
      backgroundColor: ThemeColors.surface,
      borderRadius: BorderRadius.lg,
      padding: ComponentSpacing.cardPadding,
      ...Shadows.md,
    } as ViewStyle,
    
    outlined: {
      backgroundColor: ThemeColors.surface,
      borderRadius: BorderRadius.lg,
      padding: ComponentSpacing.cardPadding,
      borderWidth: 1,
      borderColor: Colors.border.light,
    } as ViewStyle,
  },
  
  // Input variants
  input: {
    base: {
      borderRadius: BorderRadius.md,
      padding: ComponentSpacing.inputPadding,
      borderWidth: 1,
      borderColor: Colors.border.light,
      backgroundColor: ThemeColors.surface,
      fontSize: FontSize.base,
      color: ThemeColors.textPrimary,
      minHeight: LayoutSpacing.minTouchTarget,
    } as ViewStyle & TextStyle,
    
    focused: {
      borderColor: Colors.border.focus,
      ...Shadows.sm,
    } as ViewStyle,
    
    error: {
      borderColor: Colors.border.error,
    } as ViewStyle,
    
    disabled: {
      backgroundColor: Colors.surface.disabled,
      color: Colors.text.disabled,
    } as ViewStyle & TextStyle,
  },
  
  // Container variants
  container: {
    screen: {
      flex: 1,
      backgroundColor: ThemeColors.background,
      padding: ComponentSpacing.screenPadding,
    } as ViewStyle,
    
    section: {
      marginBottom: ComponentSpacing.listSectionGap,
    } as ViewStyle,
    
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: ComponentSpacing.cardGap,
    } as ViewStyle,
    
    column: {
      flexDirection: 'column' as const,
      gap: ComponentSpacing.cardGap,
    } as ViewStyle,
  },
  
  // Header variants
  header: {
    base: {
      backgroundColor: ThemeColors.surface,
      paddingHorizontal: ComponentSpacing.headerPadding,
      paddingVertical: ComponentSpacing.headerPadding,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
    } as ViewStyle,
    
    primary: {
      backgroundColor: ThemeColors.brand,
      borderBottomWidth: 0,
      ...Shadows.sm,
    } as ViewStyle,
  },
  
  // List item variants
  listItem: {
    base: {
      backgroundColor: ThemeColors.surface,
      padding: ComponentSpacing.listItemPadding,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.light,
    } as ViewStyle,
    
    card: {
      backgroundColor: ThemeColors.surface,
      padding: ComponentSpacing.listItemPadding,
      borderRadius: BorderRadius.md,
      marginBottom: ComponentSpacing.listItemGap,
      ...Shadows.sm,
    } as ViewStyle,
  },
  
  // Badge variants
  badge: {
    base: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    } as ViewStyle,
    
    primary: {
      backgroundColor: ThemeColors.brand,
    } as ViewStyle,
    
    success: {
      backgroundColor: Colors.success[500],
    } as ViewStyle,
    
    warning: {
      backgroundColor: Colors.warning[500],
    } as ViewStyle,
    
    error: {
      backgroundColor: Colors.error[500],
    } as ViewStyle,
    
    neutral: {
      backgroundColor: Colors.neutral[200],
    } as ViewStyle,
  },
  
  // Avatar variants
  avatar: {
    base: {
      borderRadius: BorderRadius.full,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: Colors.neutral[200],
    } as ViewStyle,
    
    small: {
      width: 32,
      height: 32,
    } as ViewStyle,
    
    medium: {
      width: 48,
      height: 48,
    } as ViewStyle,
    
    large: {
      width: 64,
      height: 64,
    } as ViewStyle,
  },
} as const;

// Animation configurations
export const Animations = {
  // Duration
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  // Easing
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
  
  // Common animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  
  slideUp: {
    from: { transform: [{ translateY: 20 }], opacity: 0 },
    to: { transform: [{ translateY: 0 }], opacity: 1 },
  },
  
  scale: {
    from: { transform: [{ scale: 0.95 }], opacity: 0 },
    to: { transform: [{ scale: 1 }], opacity: 1 },
  },
} as const;



// Main theme object
export const Theme = {
  colors: Colors,
  themeColors: ThemeColors,
  typography: Typography,
  spacing: Spacing,
  componentSpacing: ComponentSpacing,
  layoutSpacing: LayoutSpacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  components: ComponentStyles,
  animations: Animations,
} as const;

// Theme context type
export interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

// Helper functions
export const createStyle = {
  // Create button style
  button: (variant: keyof typeof ComponentStyles.button = 'primary', size: 'small' | 'medium' | 'large' = 'medium') => {
    const baseStyle = ComponentStyles.button.base;
    const variantStyle = ComponentStyles.button[variant];
    
    const sizeStyles = {
      small: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm },
      medium: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
      large: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
    };
    
    return {
      ...baseStyle,
      ...variantStyle,
      ...sizeStyles[size],
    } as ViewStyle;
  },
  
  // Create card style
  card: (variant: keyof typeof ComponentStyles.card = 'base') => {
    return ComponentStyles.card[variant];
  },
  
  // Create input style
  input: (state: 'base' | 'focused' | 'error' | 'disabled' = 'base') => {
    const baseStyle = ComponentStyles.input.base;
    const stateStyle = state !== 'base' ? ComponentStyles.input[state] : {};
    
    return {
      ...baseStyle,
      ...stateStyle,
    } as ViewStyle & TextStyle;
  },
  
  // Create text style with color
  text: (variant: keyof typeof Typography, color?: string) => {
    return {
      ...Typography[variant],
      ...(color && { color }),
    } as TextStyle;
  },
};

// Export everything
export * from './colors';
export * from './typography';
export * from './spacing';

export default Theme;

// Type exports
export type ThemeType = typeof Theme;
export type ColorKey = keyof typeof Colors;
export type TypographyKey = keyof typeof Typography;
export type SpacingKey = keyof typeof Spacing;
export type BorderRadiusKey = keyof typeof BorderRadius;
export type ShadowKey = keyof typeof Shadows;