import type { AuthTokens } from '@cps/shared';
import { tokenStorage } from '../token-storage';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface LoginPayload {
  email: string;
  password: string;
  organizationId?: string;
}

export async function login(payload: LoginPayload): Promise<AuthTokens> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Identifiants invalides');
  }
  const tokens = (await res.json()) as AuthTokens;
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  return tokens;
}

export async function logout(accessToken: string, refreshToken: string): Promise<void> {
  tokenStorage.clear();
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ refreshToken }),
  }).catch(() => {});
}
