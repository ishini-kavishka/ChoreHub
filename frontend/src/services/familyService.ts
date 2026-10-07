import { apiRequest } from './api';
import { getToken } from './authStorage';

export interface FamilyMemberItem {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string; // admin / member
  relationship?: string; // Mother / Father / Daughter / Son / Other
  is_active?: boolean;
  joined_at?: string;
}

export type FamilyMember = FamilyMemberItem;

export interface FamilyInfo {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

export interface SearchedUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role: string;
  is_active?: boolean;
  is_already_member?: boolean;
}

async function getAuthToken(): Promise<string> {
  const token = await getToken();
  if (!token) throw new Error('Your session has ended. Please sign in again.');
  return token;
}

export const familyService = {
  async getMyFamily(): Promise<{ family: FamilyInfo | null; members: FamilyMemberItem[] }> {
    const token = await getAuthToken();
    return apiRequest<{ family: FamilyInfo | null; members: FamilyMemberItem[] }>('/api/families/my-family', {}, token);
  },

  async searchUserByEmail(email: string): Promise<SearchedUser> {
    const token = await getAuthToken();
    const encoded = encodeURIComponent(email.trim());
    const res = await apiRequest<{ user: SearchedUser }>(`/api/families/search-user?email=${encoded}`, {}, token);
    return res.user;
  },

  async addFamilyMember(userId: string, relationship: string): Promise<{ message: string }> {
    const token = await getAuthToken();
    return apiRequest<{ message: string }>('/api/families/add-member', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, relationship }),
    }, token);
  },
};
