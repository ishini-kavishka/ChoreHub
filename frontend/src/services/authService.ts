import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiRequest } from './api';
import { clearSession, getToken, getUser, saveToken, saveUser, notifySessionChanged } from './authStorage';

WebBrowser.maybeCompleteAuthSession();

export type Member = { id: string; name: string; email: string; phone?: string; avatarUri?: string; role?: string };
type ApiUser = { id: string; full_name: string; email: string; phone?: string | null; profile_image_url?: string | null; role?: string };
type AuthResponse = { user: ApiUser; token: string };

export function toMember(user: ApiUser): Member { return { id: user.id, name: user.full_name, email: user.email, phone: user.phone ?? '', avatarUri: user.profile_image_url ?? undefined, role: user.role }; }
async function saveAuth(response: AuthResponse) { const member = toMember(response.user); await Promise.all([saveToken(response.token), saveUser(member)]); notifySessionChanged(); return member; }

export const authService = {
  async signIn(email: string, password: string) { return saveAuth(await apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })); },
  async signUp(name: string, email: string, password: string, phone = '') { return saveAuth(await apiRequest<AuthResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify({ full_name: name, email, password, phone }) })); },
  async requestPasswordReset(email: string) { return apiRequest<{ message: string }>('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); },
  async signInWithGoogle() {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = Linking.createURL('/auth/login');

    const googleUrl = clientId
      ? `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          clientId
        )}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=token%20id_token&scope=openid%20profile%20email&prompt=select_account`
      : 'https://accounts.google.com/AccountChooser?prompt=select_account';

    try {
      if (Platform.OS === 'web') {
        return await WebBrowser.openBrowserAsync(googleUrl);
      }
      return await WebBrowser.openAuthSessionAsync(googleUrl, redirectUri, {
        preferEphemeralSession: false,
      });
    } catch {
      const canOpen = await Linking.canOpenURL(googleUrl);
      if (canOpen) {
        await Linking.openURL(googleUrl);
      }
    }
  },
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
