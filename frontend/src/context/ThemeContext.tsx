/**
 * ThemeContext – manages app-wide LIGHT / DARK theme override.
 * Persisted via expo-secure-store (already in the project).
 * Falls back to system color scheme when no preference is saved.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppTheme = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  /** Resolved theme – always 'light' or 'dark' */
  theme: 'light' | 'dark';
  /** User preference (may be 'system') */
  preference: AppTheme;
  setTheme: (t: AppTheme) => Promise<void>;
}

const THEME_KEY = 'chorehub.theme';

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  preference: 'system',
  setTheme: async () => {},
});

async function persistTheme(value: string) {
  await AsyncStorage.setItem(THEME_KEY, value);
}

async function readPersistedTheme(): Promise<string | null> {
  return AsyncStorage.getItem(THEME_KEY);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [preference, setPreference] = useState<AppTheme>('system');

  useEffect(() => {
    readPersistedTheme().then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setPreference(saved);
      }
    });
  }, []);

  const resolvedTheme: 'light' | 'dark' =
    preference === 'system' ? systemScheme : preference;

  const setTheme = useCallback(async (t: AppTheme) => {
    setPreference(t);
    await persistTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: resolvedTheme, preference, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
