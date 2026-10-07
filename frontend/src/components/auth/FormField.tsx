import { translateFeedback } from '@/i18n/translations';
import { useLanguage } from '@/context/LanguageContext';
import { useThemedStyles, useAppTheme as useClientTheme, type ThemeColors } from '@/context/ThemeContext';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & { label: string; error?: string };

export function FormField({ label, error, style, ...props }: Props) {
  const {t} = useLanguage();
  const themeColors = useClientTheme().colors;
  const styles = useThemedStyles(createStyles);
  return <View style={styles.group}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor={themeColors.isDark ? themeColors.textSecondary : "#8A98A6"} style={[styles.input, error && styles.inputError, style]} {...props} />
    {error ? <Text style={styles.error}>{translateFeedback(error, t)}</Text> : null}
  </View>;
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  group: { gap: 6 }, label: { color: (themeColors.isDark ? themeColors.textPrimary : '#243447'), fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: (themeColors.isDark ? themeColors.card : '#F7F9FC'), borderColor: (themeColors.isDark ? themeColors.border : '#DCE4EC'), borderWidth: 1, borderRadius: 14, color: (themeColors.isDark ? themeColors.textPrimary : '#162536'), fontSize: 16, minHeight: 52, paddingHorizontal: 16 },
  inputError: { borderColor: themeColors.error }, error: { color: themeColors.error, fontSize: 12 },
});
