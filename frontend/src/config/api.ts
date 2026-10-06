// Same-PC web uses localhost. Physical Expo Go devices must use this PC's LAN IP.
// Keep the env value as a full URL (for example http://192.168.1.50:5000).
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:5000').replace(/\/$/, '');
