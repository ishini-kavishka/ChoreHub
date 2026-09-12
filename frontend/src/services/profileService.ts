import { Member } from './authService';
const delay = () => new Promise((resolve) => setTimeout(resolve, 450));
let profile: Member = { id: 'member-demo', name: 'ChoreHub Member', email: 'member@chorehub.app', phone: '' };
export const profileService = {
  initializeProfile(member: Member) { profile = { ...profile, ...member }; },
  async getProfile() { await delay(); return profile; },
  async updateProfile(data: Pick<Member, 'name' | 'email' | 'phone'>) { await delay(); profile = { ...profile, ...data }; return profile; },
  async updateAvatar(avatarUri: string) { await delay(); profile = { ...profile, avatarUri }; return profile; },
  async changePassword(_currentPassword: string, _newPassword: string) { await delay(); return true; },
};
