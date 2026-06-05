const ACCESS_KEY = 'cps_at';
const REFRESH_KEY = 'cps_rt';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(ACCESS_KEY);
  },
  setAccessToken(token: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_KEY, token);
  },
  getRefreshToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(REFRESH_KEY);
  },
  setRefreshToken(token: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(REFRESH_KEY, token);
  },
  setTokens(accessToken: string, refreshToken: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(ACCESS_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);
  },
  clear(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
