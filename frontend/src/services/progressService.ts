import { apiRequest } from './api';
import { authService } from './authService';
import { ApiError } from './api';

export interface ProgressSummary {
  total: number;
  completed: number;
  pending: number;
  percentage: number;
}

export interface MemberProgress {
  id: string;
  name: string;
  avatar?: string | null;
  total: number;
  completed: number;
  percentage: number;
}

async function token() {
  const value = await authService.getAuthToken();
  if (!value) throw new Error('Your session has ended. Please sign in again.');
  return value;
}

// ─── Mock fallback data ────────────────────────────────────────────────────────
const MOCK_SUMMARY: ProgressSummary = {
  total: 25,
  completed: 18,
  pending: 7,
  percentage: 72,
};

const MOCK_MEMBERS: MemberProgress[] = [
  { id: '1', name: 'chamara', avatar: null, total: 16, completed: 14, percentage: 88 },
  { id: '2', name: 'Dad', avatar: null, total: 20, completed: 17, percentage: 85 },
  { id: '3', name: 'Mom', avatar: null, total: 18, completed: 14, percentage: 78 },
  { id: '4', name: 'Ravi', avatar: null, total: 17, completed: 10, percentage: 59 },
];
let summaryDemo = false;
let membersDemo = false;
export function isDemoProgressMode() { return summaryDemo || membersDemo; }

export const progressService = {
  async getSummary(): Promise<ProgressSummary> {
    const authToken = await token();
    try {
      const result = await apiRequest<ProgressSummary>('/api/progress/summary', {}, authToken); summaryDemo = false; return result;
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      summaryDemo = true; return MOCK_SUMMARY;
    }
  },

  async getMembers(): Promise<MemberProgress[]> {
    const authToken = await token();
    try {
      const res = await apiRequest<{ members: MemberProgress[] }>('/api/progress/members', {}, authToken);
      membersDemo = false;
      return res.members ?? [];
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== undefined) throw error;
      membersDemo = true; return MOCK_MEMBERS;
    }
  },
};
