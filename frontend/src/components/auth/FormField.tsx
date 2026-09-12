import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

type Props = TextInputProps & { label: string; error?: string };

export function FormField({ label, error, style, ...props }: Props) {
  return <View style={styles.group}>
    <Text style={styles.label}>{label}</Text>
    <TextInput placeholderTextColor="#8A98A6" style={[styles.input, error && styles.inputError, style]} {...props} />
    {error ? <Text style={styles.error}>{error}</Text> : null}
  </View>;
}

const styles = StyleSheet.create({
  group: { gap: 6 }, label: { color: '#243447', fontSize: 14, fontWeight: '700' },
  input: { backgroundColor: '#F7F9FC', borderColor: '#DCE4EC', borderWidth: 1, borderRadius: 14, color: '#162536', fontSize: 16, minHeight: 52, paddingHorizontal: 16 },
  inputError: { borderColor: '#D14B4B' }, error: { color: '#C23B3B', fontSize: 12 },
});
