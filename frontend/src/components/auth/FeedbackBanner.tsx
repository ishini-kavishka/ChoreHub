import { StyleSheet, Text, View } from 'react-native';
export function FeedbackBanner({ message, type = 'error' }: { message?: string; type?: 'error' | 'success' }) {
  if (!message) return null;
  return <View style={[styles.banner, type === 'success' ? styles.success : styles.error]}><Text style={styles.text}>{message}</Text></View>;
}
const styles = StyleSheet.create({ banner: { borderRadius: 10, padding: 12 }, error: { backgroundColor: '#FDECEC' }, success: { backgroundColor: '#E7F7F0' }, text: { color: '#243447', fontSize: 14 } });
