// Same-PC web uses localhost; physical Expo Go devices need this PC's current LAN IP.
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/$/, '');
