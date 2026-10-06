import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import { authService } from '@/services/authService';

export function useGoogleSignIn() {
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const [request, , promptAsync] = useIdTokenAuthRequest({
    webClientId: webClientId || 'google-client-id-not-configured',
    iosClientId,
    androidClientId,
    selectAccount: true,
    scopes: ['openid', 'profile', 'email'],
  });

  return useCallback(async () => {
    const expectedClientId =
      Platform.OS === 'web'
        ? webClientId
        : Platform.OS === 'ios'
          ? iosClientId
          : androidClientId;

    if (!expectedClientId) {
      throw new Error(
        `Google sign-in is not configured for ${Platform.OS}. Add the matching Google OAuth client ID to frontend/.env.`
      );
    }
    if (!request) {
      throw new Error('Google sign-in is still loading. Please try again.');
    }

    const result = await promptAsync();
    if (result.type === 'cancel' || result.type === 'dismiss') return null;
    if (result.type === 'error') {
      throw new Error(result.params.error_description || 'Google sign-in failed. Please try again.');
    }
    if (result.type !== 'success') return null;

    const idToken = result.params.id_token;
    if (!idToken) {
      throw new Error('Google did not return an identity token. Check your OAuth client configuration.');
    }

    return authService.signInWithGoogle(idToken);
  }, [
    androidClientId,
    iosClientId,
    promptAsync,
    request,
    webClientId,
  ]);
}
