import { useThemedStyles, useAppTheme, type ThemeColors } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ExpoSplashScreen from 'expo-splash-screen';
import { authService } from '@/services/authService';

const choreHubLogo = require('../../../assets/images/chorehub-logo.png');

export default function SplashScreen() {
  const styles = useThemedStyles(createStyles);
  const themeColors = useAppTheme().colors;
  const { t } = useLanguage();
  useEffect(() => {
    let active = true;
    ExpoSplashScreen.hideAsync();
    authService.getCurrentMember().then((member) => {
      if (active) {
        if (!member) {
          router.replace('/auth/welcome');
        } else if (member.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/home' as any);
        }
      }
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
        accessibilityLabel="ChoreHub"
      />
      <Text style={styles.tagline}>{t('ui_a_calmer_way_to_share_the_load')}</Text>
      <ActivityIndicator style={styles.loading} color="#713DE8" size="small" />
    </View>
  );
}
const createStyles = (themeColors: ThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: (themeColors.isDark ? themeColors.background : '#FAFAFD'),
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
    color: (themeColors.isDark ? themeColors.textSecondary : '#656276'),
    fontSize: 16,
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  loading: {
    marginTop: 28,
  },
});
