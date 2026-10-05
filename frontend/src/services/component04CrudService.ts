import { apiRequest, ApiError } from './api';
import { authService } from './authService';

export type Reminder = { id: string; chore_id: string | null; chore_name: string | null; title: string; note: string; remind_at: string; status: 'pending' | 'past' | 'unavailable'; created_at: string; updated_at: string };
export type Announcement = { id: string; title: string; message: string; status: 'draft' | 'published'; published_at: string | null; created_at: string; updated_at: string };
async function request<T>(path: string, method = 'GET', body?: object) {
  const token = await authService.getAuthToken();
  if (!token) throw new ApiError('Authentication required.', 401);
  return apiRequest<T>(`/api${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) }, token);
}
export const reminderService = {
  list: () => request<{ reminders: Reminder[] }>('/reminders'),
  chores: () => request<{ chores: { id: string; title: string }[] }>('/reminders/chores'),
  get: (id: string) => request<{ reminder: Reminder }>(`/reminders/${id}`),
  save: (id: string | undefined, body: { title: string; note: string; remind_at: string; chore_id?: string }) => request(id ? `/reminders/${id}` : '/reminders', id ? 'PATCH' : 'POST', body),
  delete: (id: string) => request(`/reminders/${id}`, 'DELETE'),
};
export const announcementService = {
  list: (family: string) => request<{ announcements: Announcement[]; can_manage: boolean }>(`/announcements?family_id=${encodeURIComponent(family)}`),
  get: (id: string) => request<{ announcement: Announcement }>(`/announcements/${id}`),
  save: (family: string, id: string | undefined, body: { title: string; message: string; status: string }) => request(id ? `/announcements/${id}` : `/announcements?family_id=${encodeURIComponent(family)}`, id ? 'PATCH' : 'POST', body),
  delete: (id: string) => request(`/announcements/${id}`, 'DELETE'),
};
