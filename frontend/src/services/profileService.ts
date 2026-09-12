import { apiRequest } from './api';
import { authService, toMember } from './authService';
import type { Member } from './authService';
import { saveUser } from './authStorage';

type ApiUser = { id: string; full_name: string; email: string; phone?: string | null; profile_image_url?: string | null; role?: string };
async function token() { const value = await authService.getAuthToken(); if (!value) throw new Error('Your session has ended. Please sign in again.'); return value; }
async function saveProfile(user: ApiUser) { const member = toMember(user); await saveUser(member); return member; }

export const profileService = {
  async getProfile() { const response = await apiRequest<{ user: ApiUser }>('/api/profile', {}, await token()); return saveProfile(response.user); },
  async updateProfile(data: Pick<Member, 'name' | 'phone'>) { const response = await apiRequest<{ user: ApiUser }>('/api/profile', { method: 'PUT', body: JSON.stringify({ full_name: data.name, phone: data.phone }) }, await token()); return saveProfile(response.user); },
  async updateAvatar(profileImageUrl: string) { const response = await apiRequest<{ user: ApiUser }>('/api/profile/image', { method: 'PUT', body: JSON.stringify({ profile_image_url: profileImageUrl }) }, await token()); return saveProfile(response.user); },
  async changePassword(currentPassword: string, newPassword: string) { return apiRequest<{ message: string }>('/api/profile/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }, await token()); },
};
