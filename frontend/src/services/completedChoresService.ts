import { apiRequest } from './api';
import { authService } from './authService';

export type CompletedChore = { id: string; title: string; completed_at?: string; updated_at: string; assignee_name?: string; creator_name?: string };
export const completedChoresService = {
  async get(range: 'all'|'today'|'week'|'month', q: string, familyId?: string) {
    const token = await authService.getAuthToken();
    if (!token) throw new Error('Your session has ended. Please sign in again.');
    const query = new URLSearchParams({ range, q }).toString();
    const path = familyId ? `/api/admin/component04/completed?${query}&family_id=${encodeURIComponent(familyId)}` : `/api/chores/completed?${query}`;
    return (await apiRequest<{chores: CompletedChore[]}>(path, {}, token)).chores;
  }
};
