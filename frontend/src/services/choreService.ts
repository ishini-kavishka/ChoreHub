import { apiRequest } from './api';
import { authService } from './authService';

export interface ChoreStats {
  completed: number;
  pending: number;
  overdue: number;
  total: number;
  completionPercentage: number;
}

export interface ChoreItem {
  id: string;
  family_id?: string | null;
  title: string;
  description?: string | null;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string | null;
  status: 'pending' | 'completed';
  assigned_to?: string | null;
  assignee_name?: string | null;
  assignee_avatar?: string | null;
  creator_name?: string | null;
  created_by?: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  completed_at?: string | null;
  created_at?: string;
}

export interface CreateChoreData {
  title: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  assigned_to?: string | null;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
}

async function token() {
  const value = await authService.getAuthToken();
  if (!value) throw new Error('Your session has ended. Please sign in again.');
  return value;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
  phone?: string;
  family_role?: string;
  family_name?: string;
}

export const choreService = {
  async getAdminStats() {
    return apiRequest<{ stats: ChoreStats; chores: ChoreItem[] }>(
      '/api/chores/admin/stats',
      {},
      await token()
    );
  },

  async getAdminAllUsers() {
    return apiRequest<{ users: AdminUser[] }>(
      '/api/chores/admin/users',
      {},
      await token()
    );
  },

  async getMemberChores() {
    return apiRequest<{ stats: ChoreStats; chores: ChoreItem[] }>(
      '/api/chores/my-chores',
      {},
      await token()
    );
  },

  async getStats() {
    return apiRequest<{ stats: ChoreStats; todaysChores: ChoreItem[] }>(
      '/api/chores/stats',
      {},
      await token()
    );
  },

  async getChores(params?: { today?: boolean; status?: 'pending' | 'completed'; assigned_to?: string }) {
    const query = new URLSearchParams();
    if (params?.today) query.append('today', 'true');
    if (params?.status) query.append('status', params.status);
    if (params?.assigned_to) query.append('assigned_to', params.assigned_to);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiRequest<{ chores: ChoreItem[] }>(
      `/api/chores${queryString}`,
      {},
      await token()
    );
  },

  async getChoreById(id: string) {
    return apiRequest<{ chore: ChoreItem }>(
      `/api/chores/${id}`,
      {},
      await token()
    );
  },

  async createChore(data: CreateChoreData) {
    return apiRequest<{ chore: ChoreItem }>(
      '/api/chores',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      await token()
    );
  },

  async updateChore(id: string, data: Partial<CreateChoreData> & { status?: 'pending' | 'completed' }) {
    return apiRequest<{ chore: ChoreItem }>(
      `/api/chores/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      await token()
    );
  },

  async toggleChoreComplete(id: string) {
    return apiRequest<{ chore: ChoreItem }>(
      `/api/chores/${id}/complete`,
      {
        method: 'PATCH',
      },
      await token()
    );
  },

  async deleteChore(id: string) {
    return apiRequest<{ message: string; id: string }>(
      `/api/chores/${id}`,
      {
        method: 'DELETE',
      },
      await token()
    );
  },
};
