import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, QslateApiClient } from '../client';

describe('QslateApiClient', () => {
  let client: QslateApiClient;
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    client = new QslateApiClient('http://localhost:8080');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs login successfully and attaches JSON content type', async () => {
    const mockSession = {
      user: {
        id: 1,
        email: 'trader@qslate.com',
        username: 'trader',
        created_at: '2026-01-01T00:00:00Z',
        display_name: 'Lead Trader',
        email_verified: true,
      },
      access_token: 'valid.jwt.token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockSession,
    });

    const session = await client.login({
      identifier: ' Trader@Qslate.com ',
      password: 'mypassword123',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          identifier: 'trader@qslate.com',
          password: 'mypassword123',
        }),
      })
    );
    expect(session).toEqual(mockSession);
  });

  it('handles backend 401 error with code and message parsing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        error: {
          code: 'invalid_credentials',
          message: 'invalid credentials or revoked session',
        },
      }),
    });

    await expect(
      client.login({ identifier: 'unknown', password: 'bad' })
    ).rejects.toThrow(ApiError);

    try {
      await client.login({ identifier: 'unknown', password: 'bad' });
    } catch (err) {
      if (err instanceof ApiError) {
        expect(err.statusCode).toBe(401);
        expect(err.code).toBe('invalid_credentials');
        expect(err.message).toBe('invalid credentials or revoked session');
      }
    }
  });

  it('performs register successfully', async () => {
    const mockSession = {
      user: {
        id: 2,
        email: 'new@qslate.com',
        username: 'newtrader',
        created_at: '2026-01-01T00:00:00Z',
        display_name: '',
        email_verified: false,
      },
      access_token: 'new.jwt.token',
      token_type: 'Bearer',
      expires_in: 900,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockSession,
    });

    const session = await client.register({
      email: 'New@Qslate.com',
      username: 'NewTrader',
      password: 'securePassword123!',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/auth/register',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          email: 'new@qslate.com',
          username: 'newtrader',
          password: 'securePassword123!',
        }),
      })
    );
    expect(session.user.username).toBe('newtrader');
  });

  it('handles 204 No Content for logout without parsing error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    await expect(client.logout()).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/auth/logout',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('attaches token to authenticated requests', async () => {
    client.setTokenProvider(() => 'dynamic.token.value');

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        user: { id: 1, email: 'a@b.com', username: 'ab' },
      }),
    });

    await client.getMe();

    const lastCall = mockFetch.mock.calls[0];
    const headers = lastCall[1].headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer dynamic.token.value');
  });
});
