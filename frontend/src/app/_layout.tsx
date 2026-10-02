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
        <AppNavigation />
      </LanguageProvider>
    </ThemeProvider>
  );
}

function AppNavigation() {
  const { theme } = useAppTheme();

  // Load Ionicons font
  const [loaded, error] = useFonts({
    ...Ionicons.font,
  });

  // Hide splash screen when fonts finish loading
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Wait until fonts are ready
  if (!loaded && !error) {
    return null;
  }

  return (
    <RouterThemeProvider
      value={theme === 'dark' ? DarkTheme : DefaultTheme}
    >
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      />
    </RouterThemeProvider>
  );
}