import { apiRequest, ApiError } from './api';
import { authService } from './authService';

export type Household = { id: string; name: string };
export type Range = 'today' | 'week' | 'month';
export type ProgressChore = { id: string; title: string; category: string; assigned_to: string | null; due_date: string | null; bucket: 'pending' | 'completed' | 'overdue' };
export type Dashboard = {
  household: Household; range: Range;
  summary: { total: number; pending: number; completed: number; overdue: number; percentage: number };
  members: { id: string; name: string; avatar?: string; total: number; completed: number; percentage: number }[];
  categories: { name: string; count: number }[];
  chores: ProgressChore[];
};
async function request<T>(path: string, options: RequestInit = {}) {
  const token = await authService.getAuthToken();
  if (!token) throw new ApiError('Authentication required.', 401);
  return apiRequest<T>(`/api/admin/component04${path}`, options, token);
}
export const adminComponent04Service = {
  context: () => request<{ households: Household[] }>('/context'),
  progress: (familyId: string, range: Range) => request<Dashboard>(`/progress?family_id=${encodeURIComponent(familyId)}&range=${range}`),
  rename: (familyId: string, name: string) => request<{ household: Household }>(`/household?family_id=${encodeURIComponent(familyId)}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
};
