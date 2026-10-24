// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AUTH_TOKEN_COOKIE,
  AUTH_USER_COOKIE,
  clearAuthCookies,
  getAuthTokenFromCookie,
  getAuthUserFromCookie,
  setAuthCookies,
} from '../cookies';

describe('auth cookies', () => {
  beforeEach(() => {
    // Clear cookies
    document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0`;
    document.cookie = `${AUTH_USER_COOKIE}=; path=/; max-age=0`;
  });

  afterEach(() => {
    document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0`;
    document.cookie = `${AUTH_USER_COOKIE}=; path=/; max-age=0`;
  });

  it('sets and retrieves auth token and user cookies', () => {
    const mockSession = {
      user: {
        id: 42,
        email: 'analyst@qslate.internal',
        username: 'analyst42',
        created_at: '2026-01-01T00:00:00Z',
        display_name: 'Lead Quant',
        email_verified: true,
      },
      access_token: 'jwt.sample.token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    setAuthCookies(mockSession);

    expect(getAuthTokenFromCookie()).toBe('jwt.sample.token');
    expect(getAuthUserFromCookie()).toEqual(mockSession.user);
  });

  it('clears cookies correctly', () => {
    const mockSession = {
      user: {
        id: 1,
        email: 'test@qslate.internal',
        username: 'test',
        created_at: '2026-01-01T00:00:00Z',
        display_name: 'Test User',
        email_verified: false,
      },
      access_token: 'token.to.clear',
      token_type: 'Bearer',
      expires_in: 900,
    };

    setAuthCookies(mockSession);
    expect(getAuthTokenFromCookie()).toBe('token.to.clear');

    clearAuthCookies();
    expect(getAuthTokenFromCookie()).toBeNull();
  });
});
