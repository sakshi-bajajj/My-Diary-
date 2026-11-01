/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

// 🩵 Our cute blue diary palette
export const DiaryColors = {
  background: '#D6E8F7',       // soft blue app background
  cardBackground: '#FFFFFF',   // white cards
  cardBlue: '#E8F2FB',         // pale blue card tint
  primaryBlue: '#5B9BD5',      // main accent blue (progress bar, buttons)
  darkBlue: '#2C4A6E',         // heading text, dark navy
  textPrimary: '#2C4A6E',
  textSecondary: '#6B8CAE',
  accentYellow: '#FDF3D8',     // sticky note yellow
  accentPink: '#F7D9DC',       // priority badge pink
  accentGreen: '#DCEEDD',      // personal category green
  accentOrange: '#FBE7C6',     // other category orange
  border: '#C3DCF0',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export type DiaryPalette = Record<keyof typeof DiaryColors, string>;

export type ThemeKey = 'blue' | 'pink' | 'lavender' | 'midnight';

// needTiers = how many path tiers you must clear to unlock it (see Rewards)
export const themes: Record<
  ThemeKey,
  { name: string; emoji: string; needTiers: number; colors: DiaryPalette }
> = {
  blue: { name: 'Blue Diary', emoji: '🩵', needTiers: 0, colors: DiaryColors },
  pink: {
    name: 'Pink Blossom',
    emoji: '🌸',
    needTiers: 3,
    colors: {
      background: '#FBE4EC',
      cardBackground: '#FFFFFF',
      cardBlue: '#FCEEF3',
      primaryBlue: '#E58AA8',
      darkBlue: '#6E2B45',
      textPrimary: '#6E2B45',
      textSecondary: '#A8677F',
      accentYellow: '#FFF1D6',
      accentPink: '#F9D0DC',
      accentGreen: '#DCEEDD',
      accentOrange: '#FBE0C6',
      border: '#F2C6D4',
    },
  },
  lavender: {
    name: 'Lavender Dream',
    emoji: '💜',
    needTiers: 6,
    colors: {
      background: '#E6E0F5',
      cardBackground: '#FFFFFF',
      cardBlue: '#F0ECFA',
      primaryBlue: '#9B87D6',
      darkBlue: '#3E2F6B',
      textPrimary: '#3E2F6B',
      textSecondary: '#7C6FA8',
      accentYellow: '#FDF3D8',
      accentPink: '#F4D6EA',
      accentGreen: '#DCEEDD',
      accentOrange: '#FBE7C6',
      border: '#CFC4EA',
    },
  },
  midnight: {
    name: 'Midnight',
    emoji: '🌙',
    needTiers: 12,
    colors: {
      background: '#141B2D',
      cardBackground: '#1F2A44',
      cardBlue: '#2A3757',
      primaryBlue: '#6FA8E8',
      darkBlue: '#E6EEFF',
      textPrimary: '#E6EEFF',
      textSecondary: '#9FB2D4',
      accentYellow: '#3A3550',
      accentPink: '#4A3045',
      accentGreen: '#2C4A3E',
      accentOrange: '#4A3E2C',
      border: '#33436A',
    },
  },
};