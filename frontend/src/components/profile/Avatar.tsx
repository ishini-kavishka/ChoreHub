import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import { Image, StyleSheet, Text, View } from 'react-native';

export function Avatar({ name, uri, size = 88 }: { name: string; uri?: string; size?: number }) {
  const styles = useThemedStyles(createStyles);
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
      )}
    </View>
  );
}

const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: (themeColors.isDark ? themeColors.surface : '#EDE9FE'),
    borderWidth: 2,
    borderColor: '#713DE8',
    overflow: 'hidden',
  },
  initial: {
    color: '#713DE8',
    fontWeight: '900',
  },
});
