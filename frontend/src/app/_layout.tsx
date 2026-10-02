import { DarkTheme, DefaultTheme, Stack, ThemeProvider as RouterThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useAppTheme, ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return <ThemeProvider><LanguageProvider><AppNavigation /></LanguageProvider></ThemeProvider>;
}

function AppNavigation() {
  const { theme } = useAppTheme();
  return <RouterThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}><Stack screenOptions={{ headerShown: false, animation: 'fade' }} /></RouterThemeProvider>;
}
