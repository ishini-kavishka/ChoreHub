import { apiRequest } from './api';
import { clearSession, getToken, getUser, saveToken, saveUser } from './authStorage';

export type Member = { id: string; name: string; email: string; phone?: string; avatarUri?: string; role?: string };
type ApiUser = { id: string; full_name: string; email: string; phone?: string | null; profile_image_url?: string | null; role?: string };
type AuthResponse = { user: ApiUser; token: string };

export function toMember(user: ApiUser): Member { return { id: user.id, name: user.full_name, email: user.email, phone: user.phone ?? '', avatarUri: user.profile_image_url ?? undefined, role: user.role }; }
async function saveAuth(response: AuthResponse) { const member = toMember(response.user); await Promise.all([saveToken(response.token), saveUser(member)]); return member; }

export const authService = {
  async signIn(email: string, password: string) { return saveAuth(await apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })); },
  async signUp(name: string, email: string, password: string, phone = '') { return saveAuth(await apiRequest<AuthResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify({ full_name: name, email, password, phone }) })); },
  async requestPasswordReset(email: string) { return apiRequest<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); },
  async signOut() {
    const token = await getToken();
    try {
      // The API is stateless, but this gives the backend a logout audit point when it is reachable.
      if (token) await apiRequest<{ message: string }>('/api/auth/logout', { method: 'POST' }, token);
    } catch {
      // A network failure must never prevent a user from logging out locally.
    } finally {
      await clearSession();
    }
  },
  async getCurrentMember() {
    const [token, user] = await Promise.all([getToken(), getUser()]);
    return token && user ? user : null;
  },
  async getAuthToken() { return getToken(); },
};
