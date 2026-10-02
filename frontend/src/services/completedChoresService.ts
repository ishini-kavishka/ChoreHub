import { apiRequest } from './api';
import { authService } from './authService';

export type CompletedChore = { id: string; title: string; completed_at?: string; updated_at: string; assignee_name?: string; creator_name?: string };
export const completedChoresService = {
  async get(range: 'all'|'today'|'week'|'month', q: string) {
    const token = await authService.getAuthToken();
    if (!token) throw new Error('Your session has ended. Please sign in again.');
    const query = new URLSearchParams({ range, q }).toString();
    return (await apiRequest<{chores: CompletedChore[]}>(`/api/chores/completed?${query}`, {}, token)).chores;
  }
};
