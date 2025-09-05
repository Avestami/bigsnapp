// Modern Spacing System
// Based on 8px grid system for consistent layout and spacing

// Base spacing unit (8px)
const BASE_UNIT = 8;

// Spacing scale - multipliers of base unit
export const Spacing = {
  // Micro spacing
  xs: BASE_UNIT * 0.5,    // 4px
  sm: BASE_UNIT * 1,      // 8px
  md: BASE_UNIT * 2,      // 16px
  lg: BASE_UNIT * 3,      // 24px
  xl: BASE_UNIT * 4,      // 32px
  '2xl': BASE_UNIT * 5,   // 40px
  '3xl': BASE_UNIT * 6,   // 48px
  '4xl': BASE_UNIT * 8,   // 64px
  '5xl': BASE_UNIT * 10,  // 80px
  '6xl': BASE_UNIT * 12,  // 96px
  
  // Semantic spacing
  none: 0,
  auto: 'auto',
} as const;

// Component-specific spacing
export const ComponentSpacing = {
  // Container padding
  containerPadding: Spacing.md,        // 16px
  containerPaddingLarge: Spacing.lg,   // 24px
  
  // Card spacing
  cardPadding: Spacing.md,             // 16px
  cardMargin: Spacing.sm,              // 8px
  cardGap: Spacing.md,                 // 16px
  
  // Button spacing
  buttonPaddingVertical: Spacing.sm,   // 8px
  buttonPaddingHorizontal: Spacing.md, // 16px
  buttonMargin: Spacing.sm,            // 8px
  buttonGap: Spacing.sm,               // 8px
  
  // Input spacing
  inputPadding: Spacing.sm,            // 8px
  inputMargin: Spacing.sm,             // 8px
  inputGap: Spacing.xs,                // 4px
  
  // List spacing
  listItemPadding: Spacing.md,         // 16px
  listItemGap: Spacing.sm,             // 8px
  listSectionGap: Spacing.lg,          // 24px
  
  // Header spacing
  headerPadding: Spacing.md,           // 16px
  headerHeight: Spacing['4xl'] + Spacing.lg, // 88px (64 + 24)
  
  // Tab bar spacing
  tabBarHeight: Spacing['4xl'],        // 64px
  tabBarPadding: Spacing.sm,           // 8px
  
  // Modal spacing
  modalPadding: Spacing.lg,            // 24px
  modalMargin: Spacing.md,             // 16px
  
  // Screen spacing
  screenPadding: Spacing.md,           // 16px
  screenMargin: Spacing.lg,            // 24px
  
  // Icon spacing
  iconMargin: Spacing.sm,              // 8px
  iconPadding: Spacing.xs,             // 4px
} as const;

// Layout spacing helpers
export const LayoutSpacing = {
  // Safe area insets
  safeAreaTop: 44,
  safeAreaBottom: 34,
  
  // Status bar
  statusBarHeight: 24,
  
  // Navigation
  navigationHeaderHeight: 56,
  navigationTabHeight: 60,
  
  // Common layout dimensions
  minTouchTarget: 44,      // Minimum touch target size
  maxContentWidth: 400,    // Maximum content width for tablets
  
  // Grid system
  gridGutter: Spacing.md,  // 16px
  gridMargin: Spacing.md,  // 16px
} as const;

// Responsive spacing (for different screen sizes)
export const ResponsiveSpacing = {
  // Small screens (phones)
  small: {
    containerPadding: Spacing.md,      // 16px
    sectionGap: Spacing.lg,            // 24px
    cardGap: Spacing.sm,               // 8px
  },
  
  // Medium screens (large phones, small tablets)
  medium: {
    containerPadding: Spacing.lg,      // 24px
    sectionGap: Spacing.xl,            // 32px
    cardGap: Spacing.md,               // 16px
  },
  
  // Large screens (tablets)
  large: {
    containerPadding: Spacing.xl,      // 32px
    sectionGap: Spacing['2xl'],        // 40px
    cardGap: Spacing.lg,               // 24px
  },
} as const;

// Animation and transition spacing
export const AnimationSpacing = {
  // Slide distances
  slideDistance: Spacing['2xl'],       // 40px
  
  // Parallax offsets
  parallaxOffset: Spacing.lg,          // 24px
  
  // Gesture thresholds
  swipeThreshold: Spacing['3xl'],      // 48px
  dragThreshold: Spacing.md,           // 16px
} as const;

// Helper functions
export const spacing = {
  // Get spacing value by key
  get: (key: keyof typeof Spacing) => Spacing[key],
  
  // Create custom spacing
  custom: (multiplier: number) => BASE_UNIT * multiplier,
  
  // Create responsive spacing
  responsive: (small: number, medium?: number, large?: number) => ({
    small: BASE_UNIT * small,
    medium: BASE_UNIT * (medium || small),
    large: BASE_UNIT * (large || medium || small),
  }),
  
  // Create symmetric padding/margin
  symmetric: (horizontal: number, vertical?: number) => ({
    paddingHorizontal: BASE_UNIT * horizontal,
    paddingVertical: BASE_UNIT * (vertical || horizontal),
  }),
  
  // Create asymmetric spacing
  asymmetric: (top: number, right?: number, bottom?: number, left?: number) => ({
    paddingTop: BASE_UNIT * top,
    paddingRight: BASE_UNIT * (right || top),
    paddingBottom: BASE_UNIT * (bottom || top),
    paddingLeft: BASE_UNIT * (left || right || top),
  }),
} as const;

export type SpacingKey = keyof typeof Spacing;
export type ComponentSpacingKey = keyof typeof ComponentSpacing;
export type LayoutSpacingKey = keyof typeof LayoutSpacing;