import type { AuthSession, User } from '../model/types';

export const AUTH_TOKEN_COOKIE = 'qslate_auth_token';
export const AUTH_USER_COOKIE = 'qslate_user';

export function setAuthCookies(session: AuthSession): void {
  if (typeof document === 'undefined') return;

  const maxAge = Math.max(session.expires_in, 86400 * 30);
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(
    session.access_token
  )}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;

  try {
    const serializedUser = JSON.stringify(session.user);
    document.cookie = `${AUTH_USER_COOKIE}=${encodeURIComponent(
      serializedUser
    )}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  } catch {
    // Ignore JSON serialization errors
  }
}

export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
  document.cookie = `${AUTH_USER_COOKIE}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
}

export function getCookieValue(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const cookie of cookies) {
    const [cookieName, ...cookieValueParts] = cookie.split('=');
    if (cookieName?.trim() === name) {
      return decodeURIComponent(cookieValueParts.join('='));
    }
  }
  return null;
}

export function getAuthTokenFromCookie(): string | null {
  return getCookieValue(AUTH_TOKEN_COOKIE);
}

export function getAuthUserFromCookie(): User | null {
  const raw = getCookieValue(AUTH_USER_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}
