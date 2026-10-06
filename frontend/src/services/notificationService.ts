import { apiRequest } from './api';
import { authService } from './authService';
import { ApiError } from './api';

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'chore_reminder' | 'chore_completed' | 'chore_assigned' | 'weekly_progress' | 'family_update' | 'info' | 'personal_reminder' | 'announcement';
  is_read: boolean;
  reminder_at?: string | null;
  created_at: string;
}

export interface ReminderPayload {
  title: string;
  message: string;
  reminder_at?: string;
}

async function token() {
  const value = await authService.getAuthToken();
  if (!value) throw new Error('Your session has ended. Please sign in again.');
  return value;
}

// ─── Mock fallback ─────────────────────────────────────────────────────────────
function makeMockNotifications(): AppNotification[] {
  const now = new Date();
  const hAgo = (h: number) => new Date(now.getTime() - h * 3600_000).toISOString();
  return [
    { id: '1', user_id: '', title: 'Chore Reminder', message: 'Vacuum Living Room is due in 10 minutes', type: 'chore_reminder', is_read: false, created_at: hAgo(1) },
    { id: '2', user_id: '', title: 'Chore Completed', message: 'Dad completed: Wash the car', type: 'chore_completed', is_read: false, created_at: hAgo(2) },
    { id: '3', user_id: '', title: 'New Chore Assigned', message: 'You have been assigned: Grocery Shopping', type: 'chore_assigned', is_read: false, created_at: hAgo(3) },
    { id: '4', user_id: '', title: 'Weekly Progress Update', message: 'Your family completed 72% of chores this week! Great job!', type: 'weekly_progress', is_read: true, created_at: hAgo(24) },
    { id: '5', user_id: '', title: 'Family Update', message: 'Mom joined the ChoreSync family', type: 'family_update', is_read: true, created_at: hAgo(26) },
    { id: '6', user_id: '', title: 'Chore Reminder', message: 'Take out trash is due tomorrow', type: 'chore_reminder', is_read: true, created_at: hAgo(28) },
  ];
}
let mockNotifications: AppNotification[] = makeMockNotifications();
export function isDemoNotificationMode() { return mockNotifications !== null && demoMode; }
let demoMode = false;
const unreadListeners = new Set<(count: number) => void>();
function publishUnread(count: number) { unreadListeners.forEach((listener) => listener(count)); }

export const notificationService = {
  subscribeUnreadCount(listener: (count: number) => void) { unreadListeners.add(listener); return () => unreadListeners.delete(listener); },

  async getNotifications(filter: 'all' | 'unread' | 'read' = 'all'): Promise<AppNotification[]> {
    const authToken = await token();
    try {
      const res = await apiRequest<{ notifications: AppNotification[] }>(
        `/api/notifications?filter=${filter}`,
        {},
        authToken
      );
      demoMode = false;
      return res.notifications ?? [];
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      demoMode = true;
      const all = mockNotifications;
      if (filter === 'unread') return all.filter((n) => !n.is_read);
      if (filter === 'read') return all.filter((n) => n.is_read);
      return all;
    }
  },

  async getUnreadCount(): Promise<number> {
    const authToken = await token();
    try {
      const res = await apiRequest<{ count: number }>('/api/notifications/unread-count', {}, authToken);
      demoMode = false;
      publishUnread(res.count ?? 0);
      return res.count ?? 0;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      demoMode = true;
      const count = mockNotifications.filter((n) => !n.is_read).length; publishUnread(count); return count;
    }
  },

  async markRead(id: string): Promise<void> {
    const authToken = await token();
    try {
      await apiRequest<{ message: string }>(`/api/notifications/${id}/read`, { method: 'PATCH' }, authToken);
      demoMode = false;
      await notificationService.getUnreadCount();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      demoMode = true;
      mockNotifications = mockNotifications.map((n) => n.id === id ? { ...n, is_read: true } : n);
      publishUnread(mockNotifications.filter((n) => !n.is_read).length);
    }
  },

  async markAllRead(): Promise<void> {
    const authToken = await token();
    try {
      await apiRequest<{ message: string }>('/api/notifications/read-all', { method: 'PATCH' }, authToken);
      demoMode = false;
      publishUnread(0);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      demoMode = true;
      mockNotifications = mockNotifications.map((n) => ({ ...n, is_read: true }));
      publishUnread(0);
    }
  },

  async deleteNotification(id: string): Promise<void> {
    const authToken = await token();
    try {
      await apiRequest<{ message: string; id: string }>(`/api/notifications/${id}`, { method: 'DELETE' }, authToken);
      demoMode = false;
      await notificationService.getUnreadCount();
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      demoMode = true;
      mockNotifications = mockNotifications.filter((n) => n.id !== id);
      publishUnread(mockNotifications.filter((n) => !n.is_read).length);
    }
  },

  // ─── Personal Reminder CRUD ────────────────────────────────────────────────

  async createReminder(payload: ReminderPayload): Promise<AppNotification> {
    const res = await apiRequest<{ notification: AppNotification }>(
      '/api/notifications/reminders',
      { method: 'POST', body: JSON.stringify(payload) },
      await token()
    );
    return res.notification;
  },

  async updateReminder(id: string, payload: ReminderPayload): Promise<AppNotification> {
    const res = await apiRequest<{ notification: AppNotification }>(
      `/api/notifications/reminders/${id}`,
      { method: 'PUT', body: JSON.stringify(payload) },
      await token()
    );
    return res.notification;
  },
};
