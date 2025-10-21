/**
 * Design System Constants
 * 
 * Enforces consistent spacing, typography, and visual hierarchy
 * throughout the application.
 */

/**
 * Spacing Scale (4px base)
 * 
 * Use ONLY these spacing values for gap, padding, and margin.
 * Skip intermediate values (3, 5, 7, 9, etc.) to maintain consistency.
 */
export const SPACING = {
  xs: "gap-1",      // 4px   - Tight
  sm: "gap-2",      // 8px   - Compact
  md: "gap-4",      // 16px  - Normal (default)
  lg: "gap-6",      // 24px  - Relaxed
  xl: "gap-8",      // 32px  - Loose
  "2xl": "gap-12",  // 48px  - Very loose
} as const;

export const PADDING = {
  xs: "p-1",        // 4px
  sm: "p-2",        // 8px
  md: "p-4",        // 16px (default for cards)
  lg: "p-6",        // 24px
  xl: "p-8",        // 32px
  "2xl": "p-12",    // 48px
} as const;

export const MARGIN = {
  xs: "m-1",        // 4px
  sm: "m-2",        // 8px
  md: "m-4",        // 16px
  lg: "m-6",        // 24px
  xl: "m-8",        // 32px
  "2xl": "m-12",    // 48px
} as const;

/**
 * Typography Scale
 * 
 * Consistent text sizing and hierarchy
 */
export const TYPOGRAPHY = {
  display: "text-5xl font-bold leading-tight",
  h1: "text-4xl font-bold leading-tight",
  h2: "text-3xl font-semibold leading-snug",
  h3: "text-2xl font-semibold leading-snug",
  h4: "text-xl font-semibold leading-normal",
  "body-lg": "text-lg leading-relaxed",
  body: "text-base leading-normal",
  "body-sm": "text-sm leading-normal",
  caption: "text-xs leading-tight",
} as const;

/**
 * Border Radius
 */
export const RADIUS = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  full: "rounded-full",
} as const;

/**
 * Semantic Colors
 */
export const SEMANTIC_COLORS = {
  success: {
    text: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500",
  },
  warning: {
    text: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500",
  },
  error: {
    text: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500",
  },
  info: {
    text: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500",
  },
} as const;

/**
 * Animation Durations
 */
export const ANIMATION = {
  fast: "150ms",
  normal: "300ms",
  slow: "500ms",
} as const;

/**
 * Breakpoints
 */
export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;

/**
 * Z-Index Scale
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 10,
  modal: 20,
  overlay: 30,
  toast: 40,
  tooltip: 50,
} as const;

/**
 * Helper functions
 */
export const getSpacing = (size: keyof typeof SPACING) => SPACING[size];
export const getPadding = (size: keyof typeof PADDING) => PADDING[size];
export const getTypography = (variant: keyof typeof TYPOGRAPHY) => TYPOGRAPHY[variant];
export const getRadius = (size: keyof typeof RADIUS) => RADIUS[size];
