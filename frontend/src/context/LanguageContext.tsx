/**
 * LanguageContext – manages app-wide language (i18n).
 * - Instant UI language switching via React state
 * - Local offline persistence via AsyncStorage for fast startup
 * - Backend PostgreSQL persistence via settingsService
 * - Dynamic admin-controlled language availability & safe English fallback
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, TranslationKey, translations } from '@/i18n/translations';
import {
  settingsService,
  SupportedLanguageItem,
  DEFAULT_SUPPORTED_LANGUAGES,
} from '@/services/settingsService';

interface LanguageContextValue {
  language: Language;
  t: (key: TranslationKey | string, fallback?: string) => string;
  setLanguage: (lang: Language, syncBackend?: boolean) => Promise<void>;
  availableLanguages: SupportedLanguageItem[];
  refreshAvailableLanguages: () => Promise<SupportedLanguageItem[]>;
  isLanguageEnabled: (code: Language) => boolean;
}

const LANG_KEY = 'chorehub.language';

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: (key, fallback) => (translations.en as Record<string, string>)[key] ?? fallback ?? key,
  setLanguage: async () => {},
  availableLanguages: DEFAULT_SUPPORTED_LANGUAGES,
  refreshAvailableLanguages: async () => DEFAULT_SUPPORTED_LANGUAGES,
  isLanguageEnabled: () => true,
});

async function persistLang(value: string) {
  try {
    await AsyncStorage.setItem(LANG_KEY, value);
  } catch {
    // Ignore storage write errors
  }
}

async function readPersistedLang(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LANG_KEY);
  } catch {
    return null;
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('en');
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguageItem[]>(DEFAULT_SUPPORTED_LANGUAGES);

  const refreshAvailableLanguages = useCallback(async (): Promise<SupportedLanguageItem[]> => {
    try {
      const langs = await settingsService.getSupportedLanguages();
      setAvailableLanguages(langs);

      // Edge case: if current language was disabled by admin, fall back to English
      const currentEntry = langs.find((l) => l.code === language);
      if (currentEntry && !currentEntry.is_enabled && language !== 'en') {
        setLangState('en');
        await persistLang('en');
        settingsService.savePreferences({ language: 'en' }).catch(() => {});
      }
      return langs;
    } catch {
      return DEFAULT_SUPPORTED_LANGUAGES;
    }
  }, [language]);

  // Initial load: 1. read local cache for fast startup, 2. sync with backend
  useEffect(() => {
    let isMounted = true;

    async function init() {
      // 1. Instant local read
      const saved = await readPersistedLang();
      let initialLang: Language = 'en';
      if (saved && saved in translations) {
        initialLang = saved as Language;
        if (isMounted) setLangState(initialLang);
      }

      // 2. Fetch admin-configured languages from backend
      try {
        const langs = await settingsService.getSupportedLanguages();
        if (isMounted) setAvailableLanguages(langs);

        // Check if saved language is disabled by admin
        const entry = langs.find((l) => l.code === initialLang);
        if (entry && !entry.is_enabled && initialLang !== 'en') {
          initialLang = 'en';
          if (isMounted) setLangState('en');
          await persistLang('en');
        }

        // 3. If authenticated, sync with user preferences from backend
        const prefs = await settingsService.getPreferences().catch(() => null);
        if (prefs?.language && prefs.language in translations) {
          const prefEntry = langs.find((l) => l.code === prefs.language);
          if (!prefEntry || prefEntry.is_enabled) {
            if (isMounted) setLangState(prefs.language);
            await persistLang(prefs.language);
          }
        }
      } catch {
        // Soft fail to offline cache
      }
    }

    void init();
    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = useCallback(
    async (lang: Language, syncBackend: boolean = true) => {
      // 1. Immediately update React state for instant UI update
      setLangState(lang);
      // 2. Persist to AsyncStorage for instant reload
      await persistLang(lang);
      // 3. Persist to backend PostgreSQL if enabled
      if (syncBackend) {
        try {
          await settingsService.savePreferences({ language: lang });
        } catch {
          // Soft fail backend save if offline
        }
      }
    },
    []
  );

  const isLanguageEnabled = useCallback(
    (code: Language): boolean => {
      const match = availableLanguages.find((l) => l.code === code);
      return match ? match.is_enabled : true;
    },
    [availableLanguages]
  );

  const t = useCallback(
    (key: TranslationKey | string, fallback?: string): string => {
      const activeDict = (translations[language] || translations.en) as Record<string, string>;
      const englishDict = translations.en as Record<string, string>;

      const val = activeDict[key] ?? englishDict[key];
      if (val !== undefined && val !== null) {
        return val;
      }
      return fallback ?? String(key);
    },
    [language]
  );

  return (
    <LanguageContext.Provider
      value={{
        language,
        t,
        setLanguage,
        availableLanguages,
        refreshAvailableLanguages,
        isLanguageEnabled,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
