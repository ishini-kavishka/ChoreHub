import { apiRequest } from './api';
import { authService } from './authService';
import { ApiError } from './api';
export let settingsDemoMode = false;

export interface NotificationSettings {
  user_id?: string;
  chore_reminders: boolean;
  due_date_alerts?: boolean;
  weekly_summary?: boolean;
  chore_completions: boolean;
  family_updates: boolean;
  announcements: boolean;
  reminder_time: '10min' | '30min' | '1hour' | '1day';
}

export interface UserPreferences {
  user_id?: string;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'si' | 'ta';
  brightness?: number;
  auto_brightness?: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  chore_reminders: true,
  due_date_alerts: true,
  weekly_summary: true,
  chore_completions: true,
  family_updates: true,
  announcements: false,
  reminder_time: '10min',
};

const DEFAULT_PREFS: UserPreferences = {
  theme: 'light',
  language: 'en',
  brightness: 70,
  auto_brightness: false,
};

async function token() {
  const value = await authService.getAuthToken();
  if (!value) throw new Error('Your session has ended. Please sign in again.');
  return value;
}

export const settingsService = {
  async getNotificationSettings(requireBackend = false): Promise<NotificationSettings> {
    const authToken = await token();
    try {
      const res = await apiRequest<{ settings: NotificationSettings }>(
        '/api/settings/notifications',
        {},
        authToken
      );
      settingsDemoMode = false;
      if (requireBackend && !res.settings) throw new Error('Missing notification settings.');
      return res.settings ?? DEFAULT_SETTINGS;
    } catch (error) {
      if (requireBackend || !(error instanceof ApiError) || error.status !== undefined) throw error;
      settingsDemoMode = true;
      return DEFAULT_SETTINGS;
    }
  },

  async saveNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    const res = await apiRequest<{ settings: NotificationSettings }>(
      '/api/settings/notifications',
      { method: 'PUT', body: JSON.stringify(settings) },
      await token()
    );
    if (!res.settings) throw new Error('Missing saved notification settings.');
    return res.settings;
  },

  async getPreferences(requireBackend = false): Promise<UserPreferences> {
    const authToken = await token();
    try {
      const res = await apiRequest<{ preferences: UserPreferences }>(
        '/api/settings/preferences',
        {},
        authToken
      );
      settingsDemoMode = false;
      if (requireBackend && !res.preferences) throw new Error('Missing preferences.');
      return res.preferences ?? DEFAULT_PREFS;
    } catch (error) {
      if (requireBackend || !(error instanceof ApiError) || error.status !== undefined) throw error;
      settingsDemoMode = true;
      return DEFAULT_PREFS;
    }
  },

  async savePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await apiRequest<{ preferences: UserPreferences }>(
      '/api/settings/preferences',
      { method: 'PUT', body: JSON.stringify(prefs) },
      await token()
    );
    if (!res.preferences) throw new Error('Missing saved preferences.');
    return res.preferences;
  },

  async getSupportedLanguages(): Promise<SupportedLanguageItem[]> {
    try {
      const authToken = await token().catch(() => null);
      const res = await apiRequest<{ languages: SupportedLanguageItem[] }>(
        '/api/settings/languages',
        {},
        authToken ?? undefined
      );
      return res.languages ?? DEFAULT_SUPPORTED_LANGUAGES;
    } catch {
      return DEFAULT_SUPPORTED_LANGUAGES;
    }
  },

  async updateSupportedLanguage(code: 'en' | 'si' | 'ta', is_enabled: boolean): Promise<SupportedLanguageItem> {
    const res = await apiRequest<{ language: SupportedLanguageItem }>(
      '/api/settings/languages',
      { method: 'PUT', body: JSON.stringify({ code, is_enabled }) },
      await token()
    );
    if (!res.language) throw new Error('Could not update language availability.');
    return res.language;
  },
};

export interface SupportedLanguageItem {
  code: 'en' | 'si' | 'ta';
  name: string;
  native_name: string;
  flag: string;
  is_enabled: boolean;
  sort_order: number;
}

export const DEFAULT_SUPPORTED_LANGUAGES: SupportedLanguageItem[] = [
  { code: 'en', name: 'English', native_name: 'English', flag: '🌐', is_enabled: true, sort_order: 1 },
  { code: 'si', name: 'Sinhala', native_name: 'සිංහල',  flag: '🇱🇰', is_enabled: true, sort_order: 2 },
  { code: 'ta', name: 'Tamil',   native_name: 'தமிழ்',  flag: '🇮🇳', is_enabled: true, sort_order: 3 },
];

