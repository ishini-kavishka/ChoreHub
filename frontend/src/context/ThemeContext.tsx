/**
 * ThemeContext – manages app-wide LIGHT / DARK theme and brightness customization.
 * Persisted locally via AsyncStorage for instant flicker-free startup,
 * and synchronized with the backend user_preferences database.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { settingsService } from '@/services/settingsService';

export type AppTheme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  card: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  primary: string;
  inputBackground: string;
  navigationBackground: string;
  isDark: boolean;
}

export interface ThemeContextValue {
  /** Resolved theme – always 'light' or 'dark' */
  theme: 'light' | 'dark';
  /** User preference (may be 'system', 'light', 'dark') */
  preference: AppTheme;
  /** Brightness percentage (30 - 100) */
  brightness: number;
  /** Whether auto-brightness is enabled */
  autoBrightness: boolean;
  /** Semantic theme colors calculated dynamically from theme & brightness */
  colors: ThemeColors;
  setTheme: (t: AppTheme, syncRemote?: boolean) => Promise<void>;
  setBrightness: (b: number) => Promise<void>;
  setAutoBrightness: (a: boolean) => Promise<void>;
}

const THEME_KEY = 'chorehub.theme';
const BRIGHTNESS_KEY = 'chorehub.brightness';
const AUTO_BRIGHTNESS_KEY = 'chorehub.auto_brightness';

function interpolateRgb(
  color1: [number, number, number],
  color2: [number, number, number],
  factor: number
): string {
  const f = Math.max(0, Math.min(1, factor));
  const r = Math.round(color1[0] + f * (color2[0] - color1[0]));
  const g = Math.round(color1[1] + f * (color2[1] - color1[1]));
  const b = Math.round(color1[2] + f * (color2[2] - color1[2]));
  return `rgb(${r}, ${g}, ${b})`;
}

function calculateColors(theme: 'light' | 'dark', brightness: number): ThemeColors {
  const factor = (brightness - 30) / 70; // 0.0 at 30%, 1.0 at 100%
  const isDark = theme === 'dark';

  if (isDark) {
    // Dark theme: 30% = deep night mode, 100% = crisp vivid dark mode
    const bg = interpolateRgb([9, 8, 15], [26, 23, 40], factor);
    const card = interpolateRgb([17, 15, 27], [38, 33, 56], factor);
    const surface = interpolateRgb([24, 21, 38], [48, 42, 70], factor);
    const textPrimary = interpolateRgb([215, 212, 228], [255, 255, 255], factor);
    const textSecondary = interpolateRgb([138, 134, 156], [195, 190, 215], factor);
    const border = interpolateRgb([32, 28, 48], [58, 50, 86], factor);

    return {
      background: bg,
      card,
      surface,
      textPrimary,
      textSecondary,
      border,
      primary: '#7C5CFC',
      inputBackground: card,
      navigationBackground: card,
      isDark: true,
    };
  }

  // Light theme: 30% = softer paper tone, 100% = crisp clean white
  const bg = interpolateRgb([220, 218, 228], [250, 249, 253], factor);
  const card = interpolateRgb([234, 232, 242], [255, 255, 255], factor);
  const surface = interpolateRgb([212, 209, 224], [244, 242, 250], factor);
  const textPrimary = interpolateRgb([22, 19, 32], [30, 27, 46], factor);
  const textSecondary = interpolateRgb([95, 92, 110], [117, 114, 136], factor);
  const border = interpolateRgb([202, 199, 218], [234, 231, 245], factor);

  return {
    background: bg,
    card,
    surface,
    textPrimary,
    textSecondary,
    border,
    primary: '#7C5CFC',
    inputBackground: card,
    navigationBackground: card,
    isDark: false,
  };
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  preference: 'system',
  brightness: 70,
  autoBrightness: false,
  colors: calculateColors('light', 70),
  setTheme: async () => {},
  setBrightness: async () => {},
  setAutoBrightness: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreference] = useState<AppTheme>('system');
  const [brightness, setBrightnessState] = useState<number>(70);
  const [autoBrightness, setAutoBrightnessState] = useState<boolean>(false);

  // 1. Instant local restore
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(THEME_KEY),
      AsyncStorage.getItem(BRIGHTNESS_KEY),
      AsyncStorage.getItem(AUTO_BRIGHTNESS_KEY),
    ]).then(([savedTheme, savedBrightness, savedAuto]) => {
      if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system') {
        setPreference(savedTheme);
      }
      if (savedBrightness) {
        const parsed = parseInt(savedBrightness, 10);
        if (!isNaN(parsed) && parsed >= 30 && parsed <= 100) {
          setBrightnessState(parsed);
        }
      }
      if (savedAuto !== null) {
        setAutoBrightnessState(savedAuto === 'true');
      }
    });

    // 2. Background sync from server-side user preferences
    settingsService
      .getPreferences()
      .then((serverPrefs) => {
        if (serverPrefs) {
          if (serverPrefs.theme) setPreference(serverPrefs.theme);
          if (typeof serverPrefs.brightness === 'number') {
            setBrightnessState(Math.max(30, Math.min(100, serverPrefs.brightness)));
          }
          if (typeof serverPrefs.auto_brightness === 'boolean') {
            setAutoBrightnessState(serverPrefs.auto_brightness);
          }
        }
      })
      .catch(() => {
        // Offline / not logged in yet — local cache is used
      });
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    preference === 'system' ? systemScheme : preference;

  // If auto-brightness is enabled, adapt brightness to theme/environment
  const activeBrightness = autoBrightness
    ? resolvedTheme === 'dark'
      ? 60
      : 85
    : brightness;

  const colors = useMemo(
    () => calculateColors(resolvedTheme, activeBrightness),
    [resolvedTheme, activeBrightness]
  );

  const setTheme = useCallback(async (t: AppTheme, syncRemote = true) => {
    setPreference(t);
    await AsyncStorage.setItem(THEME_KEY, t);
    if (syncRemote) settingsService.savePreferences({ theme: t }).catch(() => {});
  }, []);

  const setBrightness = useCallback(async (b: number) => {
    const clamped = Math.max(30, Math.min(100, Math.round(b)));
    setBrightnessState(clamped);
    await AsyncStorage.setItem(BRIGHTNESS_KEY, clamped.toString());
    settingsService.savePreferences({ brightness: clamped }).catch(() => {});
  }, []);

  const setAutoBrightness = useCallback(async (a: boolean) => {
    setAutoBrightnessState(a);
    await AsyncStorage.setItem(AUTO_BRIGHTNESS_KEY, a.toString());
    settingsService.savePreferences({ auto_brightness: a }).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        preference,
        brightness: activeBrightness,
        autoBrightness,
        colors,
        setTheme,
        setBrightness,
        setAutoBrightness,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
