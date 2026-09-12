import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

export function PrimaryButton({ title, onPress, loading, variant = 'primary', style }: { title: string; onPress: () => void; loading?: boolean; variant?: 'primary' | 'outline' | 'danger'; style?: ViewStyle }) {
  const isOutline = variant === 'outline';
  return <Pressable accessibilityRole="button" disabled={loading} onPress={onPress} style={({ pressed }) => [styles.button, styles[variant], pressed && styles.pressed, loading && styles.disabled, style]}>
    {loading ? <ActivityIndicator color={isOutline ? '#247B6B' : '#FFF'} /> : <Text style={[styles.text, isOutline && styles.outlineText]}>{title}</Text>}
  </Pressable>;
}
const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  primary: { backgroundColor: '#247B6B' }, outline: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#247B6B' }, danger: { backgroundColor: '#C94C4C' },
  text: { color: '#FFF', fontSize: 16, fontWeight: '800' }, outlineText: { color: '#247B6B' }, pressed: { opacity: .82 }, disabled: { opacity: .65 },
});
