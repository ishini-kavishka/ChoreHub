import { API_BASE_URL } from '@/config/api';

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
    });
  } catch {
    throw new ApiError(`Unable to reach ChoreHub at ${API_BASE_URL}. Configure EXPO_PUBLIC_API_URL; physical Expo Go devices need this PC's LAN IP.`);
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.message || 'Something went wrong. Please try again.', response.status);
  return body as T;
}
