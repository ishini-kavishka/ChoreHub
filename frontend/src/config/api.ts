// Physical devices must use the development machine's LAN address, never localhost.
// Override this per machine with EXPO_PUBLIC_API_BASE_URL (for example, in frontend/.env).
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://172.20.10.2:5000';
