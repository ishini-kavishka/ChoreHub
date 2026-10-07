import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, View } from 'react-native';
import languageCatalog from '../../../shared/languages.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Language, translations } from '@/i18n/translations';
import { settingsService, SupportedLanguageItem, DEFAULT_SUPPORTED_LANGUAGES } from '@/services/settingsService';
import { getUser, subscribeSession } from '@/services/authStorage';

const fallbackLanguages = DEFAULT_SUPPORTED_LANGUAGES.filter(item => item.code === 'en');
const supported = (code: string): code is Language => Object.prototype.hasOwnProperty.call(translations, code);
interface LanguageContextValue {
  ready: boolean;
  language: Language;
  t: (key: string, fallback?: string) => string;
  setLanguage: (language: Language, syncBackend?: boolean) => Promise<void>;
  availableLanguages: SupportedLanguageItem[];
  refreshAvailableLanguages: () => Promise<SupportedLanguageItem[]>;
  isLanguageEnabled: (code: Language) => boolean;
}
const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [language, setLangState] = useState<Language>('en');
  const [availableLanguages, setAvailableLanguages] = useState<SupportedLanguageItem[]>(fallbackLanguages);
  const current = useRef<Language>('en');
  const available = useRef(fallbackLanguages);
  const version = useRef(0);
  const cacheKey = useRef('chorehub.language.guest');
  const apply = useCallback(async (code: Language) => {
    current.current = code;
    setLangState(code);
    await AsyncStorage.setItem(cacheKey.current, code);
  }, []);
  const allowed = useCallback((code: string) => supported(code) && available.current.some(item => item.code === code && item.is_enabled && item.translation_supported), []);
  const refreshAvailableLanguages = useCallback(async () => {
    const langs = await settingsService.getSupportedLanguages();
    available.current = langs;
    setAvailableLanguages(langs);
    await AsyncStorage.setItem('chorehub.languageAvailability', JSON.stringify(langs));
    if (!allowed(current.current)) {
      await apply('en');
      if (await getUser()) await settingsService.savePreferences({ language: 'en' });
    }
    return langs;
  }, [allowed, apply]);

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const request = ++version.current;
      const user = await getUser();
      if (!active || request !== version.current) return;
      cacheKey.current = 'chorehub.language.' + (user?.id || 'guest');
      const saved = await AsyncStorage.getItem(cacheKey.current);
      const cached = await AsyncStorage.getItem('chorehub.languageAvailability');
      let langs = fallbackLanguages;
      try { const parsed = cached && JSON.parse(cached); if (Array.isArray(parsed)) langs = parsed; } catch {}
      if (!active || request !== version.current) return;
      available.current = langs;
      setAvailableLanguages(langs);
      await apply(allowed(saved || '') ? saved as Language : 'en');
      if (allowed(saved || '') && active && request === version.current) setReady(true);
      try { langs = await settingsService.getSupportedLanguages(); } catch { /* Last successful configuration is used offline. */ }
      if (!active || request !== version.current) return;
      available.current = langs; setAvailableLanguages(langs);
      await AsyncStorage.setItem('chorehub.languageAvailability', JSON.stringify(langs));
      let selected: string = saved || 'en';
      if (user) {
        try { selected = (await settingsService.getPreferences(true)).language; } catch { /* Keep this user's cached preference offline. */ }
      }
      if (!active || request !== version.current) return;
      await apply(allowed(selected) ? selected as Language : 'en');
      if (active && request === version.current) setReady(true);
    };
    const run = () => { const request = version.current + 1; void restore().catch(() => { if (active && request === version.current) { current.current = 'en'; setLangState('en'); setReady(true); } }); };
    run();
    const unsubscribe = subscribeSession(run);
    const foreground = AppState.addEventListener('change', state => { if (state === 'active') run(); });
    return () => { active = false; version.current++; unsubscribe(); foreground.remove(); };
  }, [allowed, apply]);

  const setLanguage = useCallback(async (code: Language, syncBackend = true) => {
    if (!supported(code) || (syncBackend && !allowed(code))) throw new Error('Language is unavailable.');
    const previous = current.current;
    const request = ++version.current;
    await apply(code);
    const user = syncBackend ? await getUser() : null;
    if (request !== version.current) return;
    if (user) {
      try { await settingsService.savePreferences({ language: code }); }
      catch (error) { if (request === version.current) await apply(previous); throw error; }
    }
  }, [allowed, apply]);
  const t = useCallback((key: string, fallback?: string): string => {
    const value = (translations[language] as Record<string, string>)[key] ?? (translations.en as Record<string, string>)[key];
    return value ?? fallback ?? translations.en.error;
  }, [language]);
  const rtl = languageCatalog.find(item => item.code === language)?.rtl ?? false;
  return <LanguageContext.Provider value={{ ready, language, t, setLanguage, availableLanguages, refreshAvailableLanguages, isLanguageEnabled: allowed }}><View style={{ flex: 1, direction: rtl ? 'rtl' : 'ltr' }}>{children}</View></LanguageContext.Provider>;
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('LanguageProvider is required.');
  return context;
}
