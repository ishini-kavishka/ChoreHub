import { useThemedStyles, type ThemeColors } from '@/context/ThemeContext';
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

export function Avatar({ name, uri, size = 88 }: { name: string; uri?: string; size?: number }) {
  const styles = useThemedStyles(createStyles);
  const [hasError, setHasError] = useState(false);
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  // Native React Native RCTImageLoader cannot load blob: URIs
  const isInvalidBlob = !!uri && uri.startsWith('blob:') && Platform.OS !== 'web';
  const showImage = !!uri && !hasError && !isInvalidBlob;

  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: size / 2 }}
          onError={() => setHasError(true)}
        />
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
