import { apiRequest } from './api';
import { authService } from './authService';
import { ApiError } from './api';
export let settingsDemoMode = false;

export interface NotificationSettings {
  user_id?: string;
  chore_reminders: boolean;
  chore_completions: boolean;
  family_updates: boolean;
  announcements: boolean;
  reminder_time: '10min' | '30min' | '1hour' | '1day';
}

export interface UserPreferences {
  user_id?: string;
  theme: 'light' | 'dark';
  language: 'en' | 'si' | 'ta';
}

const DEFAULT_SETTINGS: NotificationSettings = {
  chore_reminders: true,
  chore_completions: true,
  family_updates: true,
  announcements: false,
  reminder_time: '10min',
};

const DEFAULT_PREFS: UserPreferences = {
  theme: 'light',
  language: 'en',
};

async function token() {
  const value = await authService.getAuthToken();
  if (!value) throw new Error('Your session has ended. Please sign in again.');
  return value;
}

export const settingsService = {
  async getNotificationSettings(): Promise<NotificationSettings> {
    const authToken = await token();
    try {
      const res = await apiRequest<{ settings: NotificationSettings }>(
        '/api/settings/notifications',
        {},
        authToken
      );
      settingsDemoMode = false;
      return res.settings ?? DEFAULT_SETTINGS;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
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
    return res.settings ?? settings;
  },

  async getPreferences(): Promise<UserPreferences> {
    const authToken = await token();
    try {
      const res = await apiRequest<{ preferences: UserPreferences }>(
        '/api/settings/preferences',
        {},
        authToken
      );
      settingsDemoMode = false;
      return res.preferences ?? DEFAULT_PREFS;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      settingsDemoMode = true;
      return DEFAULT_PREFS;
    }
  },

  async savePreferences(prefs: UserPreferences): Promise<UserPreferences> {
    const res = await apiRequest<{ preferences: UserPreferences }>(
      '/api/settings/preferences',
      { method: 'PUT', body: JSON.stringify(prefs) },
      await token()
    );
    return res.preferences ?? prefs;
  },
};
