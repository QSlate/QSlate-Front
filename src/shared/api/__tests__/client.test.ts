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

  it('fetches marketplace items, categories, and handles install/uninstall/reviews', async () => {
    // 1. getMarketplaceCategories
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          { id: 'strategies', name: 'Strategies' },
          { id: 'visualization', name: 'Visualization' },
        ],
      }),
    });

    const categories = await client.getMarketplaceCategories();
    expect(categories.items.length).toBe(2);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/marketplace/categories',
      expect.objectContaining({ method: 'GET' })
    );

    // 2. getMarketplaceItems with filters
    const mockItems = {
      items: [
        {
          id: 'item-1',
          kind: 'strategy',
          version_id: 'ver-1',
          author_id: 42,
          name: 'Breakout Pro',
          description: 'High alpha strategy',
          category: 'strategies',
          visibility: 'public',
          revision: 1,
          install_count: 10,
          review_count: 5,
          average_rating: 4.8,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        },
      ],
      next_cursor: 'cursor-2',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockItems,
    });

    const itemsPage = await client.getMarketplaceItems({
      q: 'Breakout',
      category: 'strategies',
      limit: 10,
    });
    expect(itemsPage.items[0].name).toBe('Breakout Pro');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/marketplace/items?q=Breakout&category=strategies&limit=10',
      expect.objectContaining({ method: 'GET' })
    );

    // 3. installMarketplaceItem
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        item_id: 'item-1',
        version_id: 'ver-1',
        kind: 'strategy',
        catalog_id: 'cat-1',
        installed_at: '2026-01-01T00:00:00Z',
      }),
    });

    const installed = await client.installMarketplaceItem('item-1', 'ver-1');
    expect(installed.item_id).toBe('item-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/marketplace/items/item-1/install',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ version_id: 'ver-1' }),
      })
    );

    // 4. uninstallMarketplaceItem
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    await client.uninstallMarketplaceItem('item-1');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/marketplace/items/item-1/installation',
      expect.objectContaining({ method: 'DELETE' })
    );

    // 5. createMarketplaceReview
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        id: 'rev-1',
        author_id: 1,
        rating: 5,
        comment: 'Outstanding alpha!',
        created_at: '2026-01-01T00:00:00Z',
      }),
    });

    const review = await client.createMarketplaceReview('item-1', {
      rating: 5,
      comment: 'Outstanding alpha!',
    });
    expect(review.rating).toBe(5);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/marketplace/items/item-1/reviews',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ rating: 5, comment: 'Outstanding alpha!' }),
      })
    );
  });

  it('fetches installed widgets catalogue, manages custom widgets, and mounts to dashboard', async () => {
    // 1. getInstalledWidgets
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          {
            id: 'custom-widget-1',
            version_id: 'ver-w1',
            kind: 'custom',
            name: 'Order Flow Imbalance',
            language: 'python',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:00:00Z',
          },
        ],
      }),
    });

    const installed = await client.getInstalledWidgets();
    expect(installed.items[0].name).toBe('Order Flow Imbalance');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/widgets/installed',
      expect.objectContaining({ method: 'GET' })
    );

    // 2. createCustomWidget
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        id: 'custom-widget-2',
        version_id: 'ver-w2',
        kind: 'custom',
        name: 'Delta Neutral Monitor',
        language: 'python',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        source: 'def render(): pass',
        configuration: {},
      }),
    });

    const created = await client.createCustomWidget({
      name: 'Delta Neutral Monitor',
      language: 'python',
      source: 'def render(): pass',
    });
    expect(created.id).toBe('custom-widget-2');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/widgets/custom',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Delta Neutral Monitor',
          language: 'python',
          source: 'def render(): pass',
        }),
      })
    );

    // 3. addDashboardWidget
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ instance_id: 'inst-1' }),
    });

    const res = await client.addDashboardWidget('dash-1', {
      widget_id: 'custom-widget-2',
      widget_version_id: 'ver-w2',
      configuration: {},
    });
    expect(res).toEqual({ instance_id: 'inst-1' });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/dashboards/dash-1/widgets',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          widget_id: 'custom-widget-2',
          widget_version_id: 'ver-w2',
          configuration: {},
        }),
      })
    );
  });

  it('supports user display preferences sync endpoints', async () => {
    // 1. getUserPreferences
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        theme: 'light',
        colorblind_mode: true,
      }),
    });

    const prefs = await client.getUserPreferences();
    expect(prefs).toEqual({ theme: 'light', colorblind_mode: true });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/users/me/preferences',
      expect.objectContaining({ method: 'GET' })
    );

    // 2. updateUserPreferences
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        theme: 'dark',
        colorblind_mode: false,
      }),
    });

    const updated = await client.updateUserPreferences({
      theme: 'dark',
      colorblind_mode: false,
    });
    expect(updated).toEqual({ theme: 'dark', colorblind_mode: false });
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/users/me/preferences',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ theme: 'dark', colorblind_mode: false }),
      })
    );
  });

  it('supports runner API key management endpoints', async () => {
    // 1. getApiKeys
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          {
            id: 'key-123',
            name: 'Cluster Runner Alpha',
            scopes: ['runner:results:write'],
            created_at: '2026-01-01T00:00:00Z',
            expires_at: '2026-04-01T00:00:00Z',
          },
        ],
      }),
    });

    const page = await client.getApiKeys();
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.name).toBe('Cluster Runner Alpha');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/users/me/api-keys',
      expect.objectContaining({ method: 'GET' })
    );

    // 2. createApiKey
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        key: {
          id: 'key-456',
          name: 'Dedicated Worker',
          scopes: ['runner:heartbeat'],
          created_at: '2026-01-01T00:00:00Z',
          expires_at: '2026-02-01T00:00:00Z',
        },
        secret: 'qsl_key-456.secrettoken123',
      }),
    });

    const created = await client.createApiKey({
      name: 'Dedicated Worker',
      expires_in_days: 30,
    });
    expect(created.key.id).toBe('key-456');
    expect(created.secret).toBe('qsl_key-456.secrettoken123');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/users/me/api-keys',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'Dedicated Worker',
          expires_in_days: 30,
        }),
      })
    );

    // 3. revokeApiKey
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    await expect(client.revokeApiKey('key-456')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/users/me/api-keys/key-456',
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('supports lab backtests endpoints (list, get, summary, delete, artifact)', async () => {
    // 1. getBacktests
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [
          {
            backtest_id: 'bt-100',
            status: 'completed',
            progress: 100,
            input: {
              strategy_id: 'strat-1',
              dataset_id: 'binance-btc-1h',
            },
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-01-01T00:01:00Z',
          },
        ],
        next_cursor: 'cursor-2',
      }),
    });

    const page = await client.getBacktests({ limit: 10, cursor: 'cursor-1' });
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.backtest_id).toBe('bt-100');
    expect(page.next_cursor).toBe('cursor-2');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/backtests?limit=10&cursor=cursor-1',
      expect.objectContaining({ method: 'GET' })
    );

    // 2. getBacktest status
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        backtest_id: 'bt-100',
        status: 'completed',
        progress: 100,
        input: { strategy_id: 'strat-1', dataset_id: 'binance-btc-1h' },
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:01:00Z',
      }),
    });

    const status = await client.getBacktest('bt-100');
    expect(status.backtest_id).toBe('bt-100');
    expect(status.status).toBe('completed');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/backtests/bt-100/status',
      expect.objectContaining({ method: 'GET' })
    );

    // 3. getBacktestSummary
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        backtest_id: 'bt-100',
        metrics: {
          sharpe_ratio: 2.15,
          total_return: 0.285,
          max_drawdown: 0.082,
          trades_count: 142,
        },
      }),
    });

    const summary = await client.getBacktestSummary('bt-100');
    expect(summary.metrics.sharpe_ratio).toBe(2.15);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/backtests/bt-100/summary',
      expect.objectContaining({ method: 'GET' })
    );

    // 4. deleteBacktest
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    await expect(client.deleteBacktest('bt-100')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/backtests/bt-100',
      expect.objectContaining({ method: 'DELETE' })
    );

    // 5. getBacktestArtifact
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [{ timestamp: '2026-01-01T00:00:00Z', price: 50000 }],
      }),
    });

    const artifact = await client.getBacktestArtifact('bt-100', 'trades');
    expect(artifact.items).toHaveLength(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/backtests/bt-100/trades',
      expect.objectContaining({ method: 'GET' })
    );

    // 6. getBacktestLogs
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({
        items: [{ message: '[INFO] Initializing strategy' }],
      }),
    });

    const logs = await client.getBacktestLogs('bt-100', { limit: 50 });
    expect(logs.items).toHaveLength(1);
    expect(logs.items[0]?.message).toBe('[INFO] Initializing strategy');
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8080/qslate/v1/backtests/bt-100/logs?limit=50',
      expect.objectContaining({ method: 'GET' })
    );
  });
});
