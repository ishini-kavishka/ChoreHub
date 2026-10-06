import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { authService } from '@/services/authService';

const choreHubLogo = require('../../../assets/images/chorehub-logo.png');

export default function SplashScreen() {
  useEffect(() => {
    let active = true;
    ExpoSplashScreen.hideAsync();
    authService.getCurrentMember().then((member) => {
      if (active) router.replace(member ? '/profile' : '/auth/welcome');
    }).catch(() => {
      if (active) router.replace('/auth/welcome');
    });
    return () => { active = false; };
  }, []);
  return (
    <View style={styles.screen}>
      <Image
        source={choreHubLogo}
        style={styles.logo}
        resizeMode="contain"
        accessible
        accessibilityLabel="ChoreHub family chores logo"
      />
      <Text style={styles.tagline}>A calmer way to share the load.</Text>
      <ActivityIndicator style={styles.loading} color="#713DE8" size="small" />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAFAFD',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  logo: {
    width: '100%',
    maxWidth: 360,
    aspectRatio: 1,
  },
  tagline: {
    color: '#656276',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  loading: {
    marginTop: 28,
  },
});
