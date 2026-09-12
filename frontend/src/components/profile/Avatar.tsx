import { Image, StyleSheet, Text, View } from 'react-native';
export function Avatar({ name, uri, size = 88 }: { name: string; uri?: string; size?: number }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>{uri ? <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} /> : <Text style={[styles.initial, { fontSize: size * .4 }]}>{initial}</Text>}</View>;
}
const styles = StyleSheet.create({ avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#DDF3EE' }, initial: { color: '#247B6B', fontWeight: '800' } });
