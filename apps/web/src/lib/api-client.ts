import type { AuthTokens } from '@cps/shared';
import { tokenStorage } from './token-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let refreshingPromise: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      tokenStorage.clear();
      return null;
    }
    const data = (await res.json()) as AuthTokens;
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

function buildHeaders(token: string | null, extra?: HeadersInit): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (extra) {
    Object.assign(headers, extra as Record<string, string>);
  }
  return headers;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let token = tokenStorage.getAccessToken();

  let res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(token, options.headers),
  });

  if (res.status === 401) {
    if (!refreshingPromise) {
      refreshingPromise = doRefresh().finally(() => {
        refreshingPromise = null;
      });
    }
    token = await refreshingPromise;
    if (!token) throw new ApiError(401, 'Session expirée');

    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: buildHeaders(token, options.headers),
    });
  }

  if (res.status === 204) return undefined as T;

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new ApiError(res.status, body.message ?? res.statusText);
  }

  return res.json() as Promise<T>;
}
