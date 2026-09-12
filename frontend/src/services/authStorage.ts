import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Member } from './authService';

const TOKEN_KEY = 'chorehub.authToken';
const USER_KEY = 'chorehub.authUser';
const isWeb = Platform.OS === 'web';

// Expo SecureStore has no browser implementation. Use browser storage only for web previews;
// Android and iOS continue to store credentials in the platform secure store.
async function setValue(key: string, value: string) {
  if (isWeb) { globalThis.localStorage.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

async function getValue(key: string) {
  if (isWeb) return globalThis.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function deleteValue(key: string) {
  if (isWeb) { globalThis.localStorage.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}

export async function saveToken(token: string) { await setValue(TOKEN_KEY, token); }
export async function getToken() { return getValue(TOKEN_KEY); }
export async function removeToken() { await deleteValue(TOKEN_KEY); }
export async function saveUser(user: Member) { await setValue(USER_KEY, JSON.stringify(user)); }
export async function getUser(): Promise<Member | null> {
  const value = await getValue(USER_KEY);
  try { return value ? JSON.parse(value) as Member : null; } catch { await removeUser(); return null; }
}
export async function removeUser() { await deleteValue(USER_KEY); }
export async function clearSession() { await Promise.all([removeToken(), removeUser()]); }
