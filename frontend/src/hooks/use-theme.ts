/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useAppTheme } from '@/context/ThemeContext';

export function useTheme() {
  const { colors } = useAppTheme();
  return { text: colors.textPrimary, background: colors.background,
    backgroundElement: colors.card, backgroundSelected: colors.surface,
    textSecondary: colors.textSecondary };
}
