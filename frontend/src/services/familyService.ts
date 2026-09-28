import { apiRequest } from './api';
import { authService } from './authService';

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
  role?: string;
  phone?: string;
}

export interface FamilyInfo {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
}

async function token() {
  const value = await authService.getAuthToken();
  if (!value) throw new Error('Your session has ended. Please sign in again.');
  return value;
}

export const familyService = {
  async getMyFamily() {
    return apiRequest<{ family: FamilyInfo | null; members: FamilyMember[] }>(
      '/api/families/my-family',
      {},
      await token()
    );
  },

  async createFamily(name: string) {
    return apiRequest<{ family: FamilyInfo }>(
      '/api/families',
      {
        method: 'POST',
        body: JSON.stringify({ name }),
      },
      await token()
    );
  },

  async joinFamily(invite_code: string) {
    return apiRequest<{ message: string; family: FamilyInfo }>(
      '/api/families/join',
      {
        method: 'POST',
        body: JSON.stringify({ invite_code }),
      },
      await token()
    );
  },
};
