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

  it('performs lintStrategy and returns diagnostics', async () => {
    const mockDiagnostics = {
      valid: false,
      diagnostics: [
        {
          line: 12,
          column: 5,
          end_line: 12,
          end_column: 15,
          severity: 'error' as const,
          message: 'SyntaxError: invalid syntax',
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockDiagnostics,
    });

    const res = await client.lintStrategy('def broken_syntax(:');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/strategies/lint',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          source: 'def broken_syntax(:',
          language: 'python',
        }),
      })
    );
    expect(res.valid).toBe(false);
    expect(res.diagnostics).toHaveLength(1);
    expect(res.diagnostics[0].line).toBe(12);
  });

  it('fetches strategies page with pagination params', async () => {
    const mockPage = {
      items: [
        {
          id: 'strat-1234567890123456789012345678901234567890123',
          version_id: 'vers-1234567890123456789012345678901234567890123',
          revision: 1,
          name: 'Momentum SMA Cross',
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      next_cursor: 'cursor-xyz',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockPage,
    });

    const page = await client.getStrategies({
      limit: 10,
      cursor: 'cursor-abc',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/strategies?limit=10&cursor=cursor-abc',
      expect.objectContaining({ method: 'GET' })
    );
    expect(page.items).toHaveLength(1);
    expect(page.items[0].name).toBe('Momentum SMA Cross');
  });

  it('creates and updates a strategy', async () => {
    const mockStrategy = {
      id: 'strat-id-1',
      version_id: 'vers-id-1',
      revision: 1,
      name: 'RSI Strategy',
      source: 'def on_candle(): pass',
      parameters: { rsi_period: 14 },
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockStrategy,
    });

    const created = await client.createStrategy({
      name: 'RSI Strategy',
      source: 'def on_candle(): pass',
      parameters: { rsi_period: 14 },
    });
    expect(created.id).toBe('strat-id-1');

    // Update strategy
    const updatedStrategy = {
      ...mockStrategy,
      revision: 2,
      version_id: 'vers-id-2',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => updatedStrategy,
    });

    const updated = await client.updateStrategy('strat-id-1', {
      base_version_id: 'vers-id-1',
      source: 'def on_candle(): buy()',
    });
    expect(updated.revision).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/strategies/strat-id-1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({
          base_version_id: 'vers-id-1',
          source: 'def on_candle(): buy()',
        }),
      })
    );
  });

  it('restores strategy revision and imports py file via multipart', async () => {
    const restoredStrategy = {
      id: 'strat-id-1',
      version_id: 'vers-id-3',
      revision: 3,
      name: 'RSI Strategy',
      source: 'def on_candle(): pass',
      parameters: {},
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => restoredStrategy,
    });

    const restored = await client.restoreStrategyVersion('strat-id-1', {
      version_id: 'vers-id-1',
      base_version_id: 'vers-id-2',
    });
    expect(restored.revision).toBe(3);

    // Import file
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => restoredStrategy,
    });

    const blob = new Blob(['print("hello")'], { type: 'text/x-python' });
    const imported = await client.importStrategy(blob, 'ImportedStrat');
    expect(imported.name).toBe('RSI Strategy');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/strategies/import',
      expect.objectContaining({ method: 'POST' })
    );
  });
});
