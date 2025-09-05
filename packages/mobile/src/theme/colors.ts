// Modern Color Palette for Snapp Clone
// Inspired by contemporary design systems with Persian cultural elements

export const Colors = {
  // Primary Brand Colors - Modern Blue with Persian Turquoise accents
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main brand color
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  // Secondary Colors - Persian Saffron inspired
  secondary: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#FFC107', // Saffron gold
    600: '#FFB300',
    700: '#FFA000',
    800: '#FF8F00',
    900: '#FF6F00',
  },

  // Accent Colors - Persian Rose
  accent: {
    50: '#FCE4EC',
    100: '#F8BBD9',
    200: '#F48FB1',
    300: '#F06292',
    400: '#EC407A',
    500: '#E91E63', // Persian rose
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
    900: '#880E4F',
  },

  // Success Colors - Persian Green
  success: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Success green
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  // Warning Colors
  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800', // Warning orange
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },

  // Error Colors
  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336', // Error red
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  // Neutral Colors - Modern grayscale
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    1000: '#000000',
  },

  // Surface Colors
  surface: {
    background: '#FAFAFA',
    card: '#FFFFFF',
    elevated: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
    disabled: '#F5F5F5',
  },

  // Text Colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    inverse: '#FFFFFF',
    link: '#2196F3',
    placeholder: '#9E9E9E',
  },

  // Border Colors
  border: {
    light: '#E0E0E0',
    medium: '#BDBDBD',
    dark: '#757575',
    focus: '#2196F3',
    error: '#F44336',
  },

  // Status Colors for Delivery/Ride states
  status: {
    pending: '#FF9800',
    confirmed: '#2196F3',
    inProgress: '#4CAF50',
    completed: '#4CAF50',
    cancelled: '#F44336',
    delivered: '#4CAF50',
    onTheWay: '#FF9800',
  },

  // Transportation specific colors
  transport: {
    car: '#2196F3',
    bike: '#4CAF50',
    delivery: '#FF9800',
    taxi: '#FFC107',
  },

  // Gradient combinations
  gradients: {
    primary: ['#2196F3', '#1976D2'],
    secondary: ['#FFC107', '#FF8F00'],
    accent: ['#E91E63', '#C2185B'],
    success: ['#4CAF50', '#388E3C'],
    sunset: ['#FF9800', '#E91E63'],
    ocean: ['#2196F3', '#00BCD4'],
    persian: ['#E91E63', '#2196F3'],
  },
} as const;

// Theme-aware color aliases
export const ThemeColors = {
  // Main brand identity
  brand: Colors.primary[500],
  brandLight: Colors.primary[300],
  brandDark: Colors.primary[700],
  
  // Background hierarchy
  background: Colors.surface.background,
  surface: Colors.surface.card,
  surfaceElevated: Colors.surface.elevated,
  
  // Text hierarchy
  textPrimary: Colors.text.primary,
  textSecondary: Colors.text.secondary,
  textDisabled: Colors.text.disabled,
  textInverse: Colors.text.inverse,
  
  // Interactive elements
  interactive: Colors.primary[500],
  interactiveHover: Colors.primary[600],
  interactivePressed: Colors.primary[700],
  interactiveDisabled: Colors.neutral[300],
  
  // Feedback colors
  success: Colors.success[500],
  warning: Colors.warning[500],
  error: Colors.error[500],
  info: Colors.primary[500],
  
  // Borders and dividers
  border: Colors.border.light,
  borderFocus: Colors.border.focus,
  divider: Colors.neutral[200],
  
  // Shadows
  shadow: Colors.neutral[900],
  shadowLight: Colors.neutral[400],
} as const;

export type ColorKey = keyof typeof Colors;
export type ThemeColorKey = keyof typeof ThemeColors;