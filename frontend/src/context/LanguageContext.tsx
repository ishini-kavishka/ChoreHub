/**
 * LanguageContext – manages app-wide language (i18n).
 * Persisted via expo-secure-store.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, TranslationKey, translations } from '@/i18n/translations';

interface LanguageContextValue {
  language: Language;
  t: (key: TranslationKey) => string;
  setLanguage: (lang: Language) => Promise<void>;
}

const LANG_KEY = 'chorehub.language';

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  t: (key) => translations.en[key] as string,
  setLanguage: async () => {},
});

async function persistLang(value: string) {
  await AsyncStorage.setItem(LANG_KEY, value);
}

async function readPersistedLang(): Promise<string | null> {
  return AsyncStorage.getItem(LANG_KEY);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>('en');

  useEffect(() => {
    readPersistedLang().then((saved) => {
      if (saved === 'en' || saved === 'si' || saved === 'ta') setLangState(saved);
    });
  }, []);

  const setLanguage = useCallback(async (lang: Language) => {
    setLangState(lang);
    await persistLang(lang);
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[language] as Record<string, string>;
      return dict[key] ?? (translations.en[key] as string) ?? key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
