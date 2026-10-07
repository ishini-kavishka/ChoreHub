import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import { StyleSheet, Text, View } from 'react-native';
export function FeedbackBanner({ message, type = 'error' }: { message?: string; type?: 'error' | 'success' }) {
  const styles = useThemedStyles(createStyles);
  if (!message) return null;
  return <View style={[styles.banner, type === 'success' ? styles.success : styles.error]}><Text style={styles.text}>{message}</Text></View>;
}
const createStyles = (themeColors: ThemeColors) => StyleSheet.create({ banner: { borderRadius: 10, padding: 12 }, error: { backgroundColor: (themeColors.isDark ? themeColors.surface : '#FDECEC') }, success: { backgroundColor: (themeColors.isDark ? themeColors.surface : '#E7F7F0') }, text: { color: (themeColors.isDark ? themeColors.textPrimary : '#243447'), fontSize: 14 } });
