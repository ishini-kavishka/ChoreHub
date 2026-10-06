import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as RouterThemeProvider,
} from 'expo-router';

import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useLanguage } from '@/context/LanguageContext';
import { AppDialogProvider } from '@/components/ui/AppDialog';

import {
  useAppTheme,
  ThemeProvider,
} from '@/context/ThemeContext';

import {
  LanguageProvider,
} from '@/context/LanguageContext';

// Keep splash screen visible while resources are loading
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppDialogProvider><AppNavigation /></AppDialogProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppNavigation() {
  const { theme, colors, ready: themeReady } = useAppTheme();
  const { ready: languageReady } = useLanguage();

  // Load Ionicons font
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  // Hide splash screen when fonts finish loading
  useEffect(() => {
    if ((loaded || error) && themeReady && languageReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, themeReady, languageReady]);

  // Wait until fonts are ready
  if ((!loaded && !error) || !themeReady || !languageReady) {
    return null;
  }

  return (
    <RouterThemeProvider
      value={theme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </RouterThemeProvider>
  );
}
