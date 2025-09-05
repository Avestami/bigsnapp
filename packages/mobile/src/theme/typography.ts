// Modern Typography System
// Based on Material Design 3 and contemporary mobile design principles

import { TextStyle } from 'react-native';
import { Colors } from './colors';

// Font families - using system fonts for better performance and consistency
export const FontFamily = {
  regular: 'System',
  medium: 'System',
  semiBold: 'System',
  bold: 'System',
  // For Persian text support
  persian: 'System',
} as const;

// Font weights
export const FontWeight = {
  light: '300' as TextStyle['fontWeight'],
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  extraBold: '800' as TextStyle['fontWeight'],
} as const;

// Font sizes - Modern scale based on 16px base
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 36,
  '6xl': 48,
  '7xl': 60,
} as const;

// Line heights - Optimized for readability
export const LineHeight = {
  tight: 1.2,
  normal: 1.4,
  relaxed: 1.6,
  loose: 1.8,
} as const;

// Letter spacing
export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
} as const;

// Typography variants - Complete design system
export const Typography = {
  // Display styles - For hero sections and large headings
  displayLarge: {
    fontSize: FontSize['7xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['7xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    color: Colors.text.primary,
  } as TextStyle,

  displayMedium: {
    fontSize: FontSize['6xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['6xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    color: Colors.text.primary,
  } as TextStyle,

  displaySmall: {
    fontSize: FontSize['5xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['5xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  // Headline styles - For section headers
  headlineLarge: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  headlineMedium: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize['3xl'] * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  headlineSmall: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize['2xl'] * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  // Title styles - For card headers and important labels
  titleLarge: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.xl * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  titleMedium: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.lg * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  titleSmall: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  // Body styles - For main content
  bodyLarge: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.base * LineHeight.relaxed,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  bodyMedium: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.sm * LineHeight.relaxed,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  bodySmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.relaxed,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.secondary,
  } as TextStyle,

  // Label styles - For form labels and captions
  labelLarge: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.wide,
    color: Colors.text.primary,
  } as TextStyle,

  labelMedium: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.wide,
    color: Colors.text.secondary,
  } as TextStyle,

  labelSmall: {
    fontSize: 11,
    fontWeight: FontWeight.medium,
    lineHeight: 11 * LineHeight.normal,
    letterSpacing: LetterSpacing.wider,
    color: Colors.text.secondary,
  } as TextStyle,

  // Button styles
  buttonLarge: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.base * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
    color: Colors.text.inverse,
  } as TextStyle,

  buttonMedium: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.sm * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
    color: Colors.text.inverse,
  } as TextStyle,

  buttonSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.wider,
    color: Colors.text.inverse,
  } as TextStyle,

  // Special purpose styles
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.regular,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.secondary,
  } as TextStyle,

  overline: {
    fontSize: 10,
    fontWeight: FontWeight.medium,
    lineHeight: 10 * LineHeight.normal,
    letterSpacing: LetterSpacing.wider,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
  } as TextStyle,

  // Price and currency styles
  price: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    lineHeight: FontSize.lg * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  priceSmall: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.base * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.primary,
  } as TextStyle,

  // Status and badge styles
  badge: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
    color: Colors.text.inverse,
  } as TextStyle,

  // Navigation styles
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
    color: Colors.text.secondary,
  } as TextStyle,

  tabLabelActive: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semiBold,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.normal,
    color: Colors.primary[500],
  } as TextStyle,
} as const;

// Helper function to create text styles with color variants
export const createTextStyle = (baseStyle: TextStyle, color?: string): TextStyle => ({
  ...baseStyle,
  ...(color && { color }),
});

// Common text style combinations
export const TextStyles = {
  // Error states
  error: (baseStyle: TextStyle) => createTextStyle(baseStyle, Colors.error[500]),
  success: (baseStyle: TextStyle) => createTextStyle(baseStyle, Colors.success[500]),
  warning: (baseStyle: TextStyle) => createTextStyle(baseStyle, Colors.warning[500]),
  
  // Interactive states
  link: (baseStyle: TextStyle) => createTextStyle(baseStyle, Colors.primary[500]),
  disabled: (baseStyle: TextStyle) => createTextStyle(baseStyle, Colors.text.disabled),
  
  // Emphasis
  muted: (baseStyle: TextStyle) => createTextStyle(baseStyle, Colors.text.secondary),
  inverse: (baseStyle: TextStyle) => createTextStyle(baseStyle, Colors.text.inverse),
} as const;

export type TypographyKey = keyof typeof Typography;
export type FontSizeKey = keyof typeof FontSize;
export type FontWeightKey = keyof typeof FontWeight;