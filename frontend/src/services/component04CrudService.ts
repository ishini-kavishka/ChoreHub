import { apiRequest, ApiError } from './api';
import { authService } from './authService';
import { reminderDeviceService } from './reminderDeviceService';
import { settingsService } from './settingsService';

export type Reminder = { id: string; chore_id: string | null; chore_name: string | null; chore_due_date?: string | null; vibrate?: boolean; sound?: boolean; title: string; note: string; remind_at: string; status: 'pending' | 'past' | 'unavailable'; created_at: string; updated_at: string };
export type Announcement = { id: string; title: string; message: string; status: 'draft' | 'published'; published_at: string | null; created_at: string; updated_at: string };
async function request<T>(path: string, method = 'GET', body?: object) {
  const token = await authService.getAuthToken();
  if (!token) throw new ApiError('Authentication required.', 401);
  return apiRequest<T>(`/api${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) }, token);
}
export const reminderService = {
  list: () => request<{ reminders: Reminder[] }>('/reminders'),
  chores: () => request<{ chores: { id: string; title: string; due_date?: string | null }[] }>('/reminders/chores'),
  get: (id: string) => request<{ reminder: Reminder }>(`/reminders/${id}`),
  save: (id: string | undefined, body: { title: string; note: string; remind_at: string; chore_id?: string; vibrate?: boolean; sound?: boolean }) => reminderDeviceService.mutate(id, reminderSnapshot,
    () => request<{ reminder: Reminder }>(id ? `/reminders/${id}` : '/reminders', id ? 'PATCH' : 'POST', body)),
  delete: (id: string) => reminderDeviceService.mutate(id, reminderSnapshot, () => request<{ id: string }>(`/reminders/${id}`, 'DELETE'), false),
};
export async function reminderSnapshot() {
  const member = await authService.getCurrentMember();
  if (!member) return { userId: null, reminders: [], enabled: false };
  const [records, settings] = await Promise.all([reminderService.list(), settingsService.getNotificationSettings(true)]);
  if ((await authService.getCurrentMember())?.id !== member.id) return { userId: null, reminders: [], enabled: false };
  return { userId: member.id, reminders: records.reminders, enabled: settings.chore_reminders };
}
export const announcementService = {
  list: (family: string) => request<{ announcements: Announcement[]; can_manage: boolean }>(`/announcements?family_id=${encodeURIComponent(family)}`),
  get: (id: string) => request<{ announcement: Announcement }>(`/announcements/${id}`),
  save: (family: string, id: string | undefined, body: { title: string; message: string; status: string }) => request(id ? `/announcements/${id}` : `/announcements?family_id=${encodeURIComponent(family)}`, id ? 'PATCH' : 'POST', body),
  delete: (id: string) => request(`/announcements/${id}`, 'DELETE'),
};
