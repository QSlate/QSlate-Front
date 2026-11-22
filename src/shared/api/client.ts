import type {
  APIKeyInputDto,
  APIKeysPageDto,
  AuthProvidersResponse,
  AuthSession,
  BackendErrorResponse,
  BacktestArtifactPage,
  BacktestComparisonResponse,
  BacktestJob,
  BacktestLogItem,
  BacktestLogsPage,
  BacktestOptimizeInput,
  BacktestRunPayload,
  BacktestRunsPage,
  BacktestSummary,
  CustomDataset,
  CustomDatasetMappingPayload,
  CustomDatasetsPage,
  CustomDatasetValidationJob,
  CustomWidget,
  CustomWidgetInput,
  Dashboard,
  DashboardAddWidgetInput,
  DashboardLayoutUpdatePayload,
  DashboardsPage,
  DiagnosticsResponse,
  InstalledWidgetsPage,
  LoginPayload,
  MarketHistory,
  MarketHistoryParams,
  MarketplaceCategoriesPage,
  MarketplaceFilter,
  MarketplaceInstallation,
  MarketplaceItem,
  MarketplacePage,
  MarketplacePatchInput,
  MarketplacePublishInput,
  MarketplaceReview,
  MarketplaceReviewInput,
  MarketplaceReviewsPage,
  MarketSymbolsPage,
  NewAPIKeyDto,
  OptimizationBatch,
  RegisterPayload,
  Strategy,
  StrategyInput,
  StrategyPage,
  StrategyRestoreInput,
  StrategyUpdateInput,
  StrategyVersionsPage,
  User,
  UserPreferencesDTO,
  UserPreferencesPatchDTO,
} from './types';

/** Idempotency keys must be 16–128 characters (OpenAPI contract). */
function createIdempotencyKey(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '')}-${Date.now()}`;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RequestOptions extends RequestInit {
  token?: string | null;
  _isRetry?: boolean;
}

export class QslateApiClient {
  private readonly baseUrl: string;
  private tokenProvider: (() => string | null) | null = null;
  private onSessionRefreshed: ((session: AuthSession) => void) | null = null;
  private onUnauthorized: (() => void) | null = null;
  private refreshPromise: Promise<AuthSession> | null = null;

  constructor(baseUrl?: string) {
    this.baseUrl = (
      baseUrl ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:8080'
    ).replace(/\/$/, '');
  }

  public setTokenProvider(provider: () => string | null): void {
    this.tokenProvider = provider;
  }

  public setSessionRefreshedHandler(
    handler: (session: AuthSession) => void
  ): void {
    this.onSessionRefreshed = handler;
  }

  public setUnauthorizedHandler(handler: () => void): void {
    this.onUnauthorized = handler;
  }

  public getToken(): string | null {
    return this.tokenProvider ? this.tokenProvider() : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers = new Headers(options.headers);

    if (
      !headers.has('Content-Type') &&
      options.body &&
      typeof options.body === 'string'
    ) {
      headers.set('Content-Type', 'application/json');
    }

    const token = options.token ?? this.tokenProvider?.() ?? null;
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: options.credentials ?? 'include',
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let code = 'http_error';
      let message = `Request failed with status ${response.status}`;

      if (isJson) {
        try {
          const errorBody = (await response.json()) as BackendErrorResponse;
          if (errorBody.error) {
            code = errorBody.error.code;
            message = errorBody.error.message;
          }
        } catch {
          // fallback to default message
        }
      }

      // If token expired (401), attempt a silent refresh once (except for auth endpoints)
      if (
        response.status === 401 &&
        !options._isRetry &&
        !endpoint.includes('/auth/login') &&
        !endpoint.includes('/auth/register') &&
        !endpoint.includes('/auth/refresh')
      ) {
        try {
          if (!this.refreshPromise) {
            this.refreshPromise = this.refresh().finally(() => {
              this.refreshPromise = null;
            });
          }
          const session = await this.refreshPromise;
          if (session?.access_token) {
            this.onSessionRefreshed?.(session);
            return await this.request<T>(endpoint, {
              ...options,
              _isRetry: true,
              token: session.access_token,
            });
          }
        } catch {
          this.onUnauthorized?.();
        }
      }

      throw new ApiError(response.status, code, message);
    }

    if (isJson) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  }

  /**
   * Authenticate with Go Backend.
   * POST /qslate/v1/auth/login
   */
  public async login(payload: LoginPayload): Promise<AuthSession> {
    return this.request<AuthSession>('/qslate/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: payload.identifier.trim().toLowerCase(),
        password: payload.password,
      }),
    });
  }

  /**
   * Register a new account with Go Backend.
   * POST /qslate/v1/auth/register
   */
  public async register(payload: RegisterPayload): Promise<AuthSession> {
    return this.request<AuthSession>('/qslate/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        username: payload.username.trim().toLowerCase(),
        password: payload.password,
      }),
    });
  }

  /**
   * Terminate user session.
   * POST /qslate/v1/auth/logout
   */
  public async logout(): Promise<void> {
    await this.request<void>('/qslate/v1/auth/logout', {
      method: 'POST',
    });
  }

  /**
   * Rotate access token using the HttpOnly refresh cookie.
   * POST /qslate/v1/auth/refresh
   */
  public async refresh(): Promise<AuthSession> {
    return this.request<AuthSession>('/qslate/v1/auth/refresh', {
      method: 'POST',
    });
  }

  /**
   * Request a password recovery email.
   * POST /qslate/v1/auth/forgot-password
   */
  public async forgotPassword(email: string): Promise<void> {
    await this.request<void>('/qslate/v1/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
  }

  /**
   * Submit a new password with a reset token.
   * POST /qslate/v1/auth/reset-password
   */
  public async resetPassword(token: string, password: string): Promise<void> {
    await this.request<void>('/qslate/v1/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  /**
   * Confirm an email verification token.
   * POST /qslate/v1/auth/verify-email
   */
  public async verifyEmail(token: string): Promise<void> {
    await this.request<void>('/qslate/v1/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Retrieve available OAuth identity providers.
   * GET /qslate/v1/auth/providers
   */
  public async getAuthProviders(): Promise<AuthProvidersResponse> {
    return this.request<AuthProvidersResponse>('/qslate/v1/auth/providers', {
      method: 'GET',
    });
  }

  /**
   * Fetch current authenticated user profile.
   * GET /qslate/v1/users/me
   */
  public async getMe(token?: string | null): Promise<{ user: User }> {
    return this.request<{ user: User }>('/qslate/v1/users/me', {
      method: 'GET',
      ...(token ? { token } : {}),
    });
  }

  /**
   * Fetch user preferences.
   * GET /qslate/v1/users/me/preferences
   */
  public async getPreferences(
    token?: string | null
  ): Promise<UserPreferencesDTO> {
    return this.request<UserPreferencesDTO>('/qslate/v1/users/me/preferences', {
      method: 'GET',
      ...(token ? { token } : {}),
    });
  }

  /**
   * Update user preferences.
   * PATCH /qslate/v1/users/me/preferences
   */
  public async updatePreferences(
    patch: UserPreferencesPatchDTO,
    token?: string | null
  ): Promise<UserPreferencesDTO> {
    return this.request<UserPreferencesDTO>('/qslate/v1/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(patch),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Fetch user preferences (alias for getPreferences).
   * GET /qslate/v1/users/me/preferences
   */
  public async getUserPreferences(
    token?: string | null
  ): Promise<UserPreferencesDTO> {
    return this.getPreferences(token);
  }

  /**
   * Update user preferences (alias for updatePreferences).
   * PATCH /qslate/v1/users/me/preferences
   */
  public async updateUserPreferences(
    patch: UserPreferencesPatchDTO,
    token?: string | null
  ): Promise<UserPreferencesDTO> {
    return this.updatePreferences(patch, token);
  }

  /**
   * Fetch runner API keys.
   * GET /qslate/v1/users/me/api-keys
   */
  public async getApiKeys(token?: string | null): Promise<APIKeysPageDto> {
    return this.request<APIKeysPageDto>('/qslate/v1/users/me/api-keys', {
      method: 'GET',
      ...(token ? { token } : {}),
    });
  }

  /**
   * Create a new runner API key.
   * POST /qslate/v1/users/me/api-keys
   */
  public async createApiKey(
    payload: APIKeyInputDto,
    token?: string | null
  ): Promise<NewAPIKeyDto> {
    return this.request<NewAPIKeyDto>('/qslate/v1/users/me/api-keys', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Revoke an existing runner API key.
   * DELETE /qslate/v1/users/me/api-keys/{keyId}
   */
  public async revokeApiKey(
    keyId: string,
    token?: string | null
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/users/me/api-keys/${encodeURIComponent(keyId)}`,
      {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Run static Python AST syntax diagnostics.
   * POST /qslate/v1/strategies/lint
   */
  public async lintStrategy(
    source: string,
    language: string = 'python',
    token?: string | null
  ): Promise<DiagnosticsResponse> {
    return this.request<DiagnosticsResponse>('/qslate/v1/strategies/lint', {
      method: 'POST',
      body: JSON.stringify({ source, language }),
      ...(token ? { token } : {}),
    });
  }

  /**
   * List owned strategies.
   * GET /qslate/v1/strategies
   */
  public async getStrategies(
    params?: { limit?: number; cursor?: string },
    token?: string | null
  ): Promise<StrategyPage> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);
    const qs = query.toString();
    const endpoint = `/qslate/v1/strategies${qs ? `?${qs}` : ''}`;
    return this.request<StrategyPage>(endpoint, {
      method: 'GET',
      ...(token ? { token } : {}),
    });
  }

  /**
   * Create a new draft strategy.
   * POST /qslate/v1/strategies
   */
  public async createStrategy(
    input: StrategyInput,
    token?: string | null
  ): Promise<Strategy> {
    return this.request<Strategy>('/qslate/v1/strategies', {
      method: 'POST',
      body: JSON.stringify(input),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Read strategy detail and current source.
   * GET /qslate/v1/strategies/{strategyId}
   */
  public async getStrategy(
    strategyId: string,
    token?: string | null
  ): Promise<Strategy> {
    return this.request<Strategy>(
      `/qslate/v1/strategies/${encodeURIComponent(strategyId)}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Commit a new revision of a strategy.
   * PUT /qslate/v1/strategies/{strategyId}
   */
  public async updateStrategy(
    strategyId: string,
    input: StrategyUpdateInput,
    token?: string | null
  ): Promise<Strategy> {
    return this.request<Strategy>(
      `/qslate/v1/strategies/${encodeURIComponent(strategyId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * List strategy revision history.
   * GET /qslate/v1/strategies/{strategyId}/versions
   */
  public async getStrategyVersions(
    strategyId: string,
    params?: { limit?: number; cursor?: string },
    token?: string | null
  ): Promise<StrategyVersionsPage> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);
    const qs = query.toString();
    const endpoint = `/qslate/v1/strategies/${encodeURIComponent(strategyId)}/versions${qs ? `?${qs}` : ''}`;
    return this.request<StrategyVersionsPage>(endpoint, {
      method: 'GET',
      ...(token ? { token } : {}),
    });
  }

  /**
   * Restore a previous strategy version as a new revision.
   * POST /qslate/v1/strategies/{strategyId}/restore
   */
  public async restoreStrategyVersion(
    strategyId: string,
    input: StrategyRestoreInput,
    token?: string | null
  ): Promise<Strategy> {
    return this.request<Strategy>(
      `/qslate/v1/strategies/${encodeURIComponent(strategyId)}/restore`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Import a Python strategy file.
   * POST /qslate/v1/strategies/import
   */
  public async importStrategy(
    file: File | Blob,
    name?: string,
    token?: string | null
  ): Promise<Strategy> {
    const formData = new FormData();
    const filename =
      file instanceof File ? file.name : name ? `${name}.py` : 'strategy.py';
    formData.append(
      'file',
      file,
      filename.endsWith('.py') ? filename : `${filename}.py`
    );
    if (name) {
      formData.append('name', name);
    } else if (file instanceof File) {
      formData.append('name', file.name.replace(/\.py$/, ''));
    }

    return this.request<Strategy>('/qslate/v1/strategies/import', {
      method: 'POST',
      body: formData,
      ...(token ? { token } : {}),
    });
  }

  // -------------------------------------------------------------------------
  // Marketplace Service Methods (/qslate/v1/marketplace/*)
  // -------------------------------------------------------------------------

  /**
   * List community marketplace items with search, category filtering and pagination.
   * GET /qslate/v1/marketplace/items
   */
  public async getMarketplaceItems(
    params?: MarketplaceFilter,
    token?: string | null
  ): Promise<MarketplacePage> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.kind) query.set('kind', params.kind);
    if (params?.category) query.set('category', params.category);
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<MarketplacePage>(
      `/qslate/v1/marketplace/items${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * List featured highlight items.
   * GET /qslate/v1/marketplace/featured
   */
  public async getMarketplaceFeatured(
    token?: string | null
  ): Promise<MarketplacePage> {
    return this.request<MarketplacePage>('/qslate/v1/marketplace/featured', {
      method: 'GET',
      ...(token ? { token } : {}),
    });
  }

  /**
   * List all verified marketplace categories.
   * GET /qslate/v1/marketplace/categories
   */
  public async getMarketplaceCategories(
    params?: { cursor?: string; limit?: number },
    token?: string | null
  ): Promise<MarketplaceCategoriesPage> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<MarketplaceCategoriesPage>(
      `/qslate/v1/marketplace/categories${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetch single marketplace item details.
   * GET /qslate/v1/marketplace/items/{itemId}
   */
  public async getMarketplaceItem(
    itemId: string,
    token?: string | null
  ): Promise<MarketplaceItem> {
    return this.request<MarketplaceItem>(
      `/qslate/v1/marketplace/items/${encodeURIComponent(itemId)}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Publish a strategy or widget into the marketplace catalog.
   * POST /qslate/v1/marketplace/items
   */
  public async publishMarketplaceItem(
    input: MarketplacePublishInput,
    token?: string | null
  ): Promise<MarketplaceItem> {
    return this.request<MarketplaceItem>('/qslate/v1/marketplace/items', {
      method: 'POST',
      body: JSON.stringify(input),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Patch an existing listing metadata.
   * PATCH /qslate/v1/marketplace/items/{itemId}
   */
  public async patchMarketplaceItem(
    itemId: string,
    input: MarketplacePatchInput,
    token?: string | null
  ): Promise<MarketplaceItem> {
    return this.request<MarketplaceItem>(
      `/qslate/v1/marketplace/items/${encodeURIComponent(itemId)}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Delete an existing marketplace listing.
   * DELETE /qslate/v1/marketplace/items/{itemId}
   */
  public async deleteMarketplaceItem(
    itemId: string,
    token?: string | null
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/marketplace/items/${encodeURIComponent(itemId)}`,
      {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Install an item version into the user's workspace catalog.
   * POST /qslate/v1/marketplace/items/{itemId}/install
   */
  public async installMarketplaceItem(
    itemId: string,
    versionId: string,
    token?: string | null
  ): Promise<MarketplaceInstallation> {
    return this.request<MarketplaceInstallation>(
      `/qslate/v1/marketplace/items/${encodeURIComponent(itemId)}/install`,
      {
        method: 'POST',
        body: JSON.stringify({ version_id: versionId }),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Uninstall an item from the user's workspace catalog.
   * DELETE /qslate/v1/marketplace/items/{itemId}/installation
   */
  public async uninstallMarketplaceItem(
    itemId: string,
    token?: string | null
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/marketplace/items/${encodeURIComponent(itemId)}/installation`,
      {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Retrieve community reviews for an item.
   * GET /qslate/v1/marketplace/items/{itemId}/reviews
   */
  public async getMarketplaceReviews(
    itemId: string,
    params?: { cursor?: string; limit?: number },
    token?: string | null
  ): Promise<MarketplaceReviewsPage> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<MarketplaceReviewsPage>(
      `/qslate/v1/marketplace/items/${encodeURIComponent(itemId)}/reviews${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Post a 1-5 star review and comment on an installed item.
   * POST /qslate/v1/marketplace/items/{itemId}/reviews
   */
  public async createMarketplaceReview(
    itemId: string,
    input: MarketplaceReviewInput,
    token?: string | null
  ): Promise<MarketplaceReview> {
    return this.request<MarketplaceReview>(
      `/qslate/v1/marketplace/items/${encodeURIComponent(itemId)}/reviews`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        ...(token ? { token } : {}),
      }
    );
  }

  // -------------------------------------------------------------------------
  // Widgets Service Methods (/qslate/v1/widgets/* & /dashboards/*)
  // -------------------------------------------------------------------------

  /**
   * List installed widgets (core, custom, and marketplace-installed).
   * GET /qslate/v1/widgets/installed
   */
  public async getInstalledWidgets(
    params?: { cursor?: string; limit?: number },
    token?: string | null
  ): Promise<InstalledWidgetsPage> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<InstalledWidgetsPage>(
      `/qslate/v1/widgets/installed${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * List custom widgets created by the user.
   * GET /qslate/v1/widgets/custom
   */
  public async getCustomWidgets(
    params?: { cursor?: string; limit?: number },
    token?: string | null
  ): Promise<InstalledWidgetsPage> {
    const query = new URLSearchParams();
    if (params?.cursor) query.set('cursor', params.cursor);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return this.request<InstalledWidgetsPage>(
      `/qslate/v1/widgets/custom${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Create a new custom widget.
   * POST /qslate/v1/widgets/custom
   */
  public async createCustomWidget(
    input: CustomWidgetInput,
    token?: string | null
  ): Promise<CustomWidget> {
    return this.request<CustomWidget>('/qslate/v1/widgets/custom', {
      method: 'POST',
      body: JSON.stringify(input),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Retrieve a single custom widget definition.
   * GET /qslate/v1/widgets/custom/{widgetId}
   */
  public async getCustomWidget(
    widgetId: string,
    token?: string | null
  ): Promise<CustomWidget> {
    return this.request<CustomWidget>(
      `/qslate/v1/widgets/custom/${encodeURIComponent(widgetId)}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Update an existing custom widget.
   * PUT /qslate/v1/widgets/custom/{widgetId}
   */
  public async updateCustomWidget(
    widgetId: string,
    input: CustomWidgetInput,
    token?: string | null
  ): Promise<CustomWidget> {
    return this.request<CustomWidget>(
      `/qslate/v1/widgets/custom/${encodeURIComponent(widgetId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(input),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Delete a custom widget.
   * DELETE /qslate/v1/widgets/custom/{widgetId}
   */
  public async deleteCustomWidget(
    widgetId: string,
    token?: string | null
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/widgets/custom/${encodeURIComponent(widgetId)}`,
      {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Mount a widget into a backend dashboard.
   * POST /qslate/v1/dashboards/{dashboardId}/widgets
   */
  public async addDashboardWidget(
    dashboardId: string,
    input: DashboardAddWidgetInput,
    token?: string | null
  ): Promise<unknown> {
    return this.request<unknown>(
      `/qslate/v1/dashboards/${encodeURIComponent(dashboardId)}/widgets`,
      {
        method: 'POST',
        body: JSON.stringify(input),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * List historical backtest runs.
   * GET /qslate/v1/backtests
   */
  public async getBacktests(
    params?: { limit?: number; cursor?: string },
    token?: string | null
  ): Promise<BacktestRunsPage> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);
    const qs = query.toString();
    return this.request<BacktestRunsPage>(
      `/qslate/v1/backtests${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetch backtest status and configuration.
   * GET /qslate/v1/backtests/{backtestId}/status
   */
  public async getBacktest(
    backtestId: string,
    token?: string | null
  ): Promise<BacktestJob> {
    return this.request<BacktestJob>(
      `/qslate/v1/backtests/${encodeURIComponent(backtestId)}/status`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetch backtest quantitative summary metrics.
   * GET /qslate/v1/backtests/{backtestId}/summary
   */
  public async getBacktestSummary(
    backtestId: string,
    token?: string | null
  ): Promise<BacktestSummary> {
    return this.request<BacktestSummary>(
      `/qslate/v1/backtests/${encodeURIComponent(backtestId)}/summary`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Compares 2 to 20 completed backtest runs.
   * POST /qslate/v1/backtests/compare
   */
  public async compareBacktests(
    backtestIds: string[],
    token?: string | null
  ): Promise<BacktestComparisonResponse> {
    return this.request<BacktestComparisonResponse>(
      '/qslate/v1/backtests/compare',
      {
        method: 'POST',
        body: JSON.stringify({ backtest_ids: backtestIds }),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Delete a completed, failed, or cancelled backtest run.
   * DELETE /qslate/v1/backtests/{backtestId}
   */
  public async deleteBacktest(
    backtestId: string,
    token?: string | null
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/backtests/${encodeURIComponent(backtestId)}`,
      {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetch backtest artifact pages (trades, equity-curve, logs).
   * GET /qslate/v1/backtests/{backtestId}/{kind}
   */
  public async getBacktestArtifact<T = unknown>(
    backtestId: string,
    kind: 'trades' | 'equity-curve' | 'logs',
    params?: { limit?: number; cursor?: string },
    token?: string | null
  ): Promise<BacktestArtifactPage<T>> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.cursor) query.set('cursor', params.cursor);
    const qs = query.toString();
    return this.request<BacktestArtifactPage<T>>(
      `/qslate/v1/backtests/${encodeURIComponent(backtestId)}/${kind}${
        qs ? `?${qs}` : ''
      }`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetch backtest execution logs.
   * GET /qslate/v1/backtests/{backtestId}/logs
   */
  public async getBacktestLogs(
    backtestId: string,
    params?: { limit?: number; cursor?: string },
    token?: string | null
  ): Promise<BacktestLogsPage> {
    return this.getBacktestArtifact<BacktestLogItem>(
      backtestId,
      'logs',
      params,
      token
    );
  }
  /**
   * Launch a strategy parameter optimization campaign.
   * POST /qslate/v1/backtests/optimize
   */
  public async optimizeBacktest(
    input: BacktestOptimizeInput,
    idempotencyKey?: string,
    token?: string | null
  ): Promise<OptimizationBatch> {
    const key =
      idempotencyKey ||
      `opt-${crypto.randomUUID().replace(/-/g, '')}-${Date.now()}`;
    return this.request<OptimizationBatch>('/qslate/v1/backtests/optimize', {
      method: 'POST',
      headers: {
        'Idempotency-Key': key,
      },
      body: JSON.stringify(input),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Dispatches a live backtest run execution on the Lab service.
   * POST /qslate/v1/backtests/run
   */
  public async runBacktest(
    payload: BacktestRunPayload,
    idempotencyKey?: string,
    token?: string | null
  ): Promise<BacktestJob> {
    const key = idempotencyKey || createIdempotencyKey('run');
    return this.request<BacktestJob>('/qslate/v1/backtests/run', {
      method: 'POST',
      headers: {
        'Idempotency-Key': key,
      },
      body: JSON.stringify(payload),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Cancels an active or pending backtest execution.
   * POST /qslate/v1/backtests/{backtestId}/cancel
   */
  public async cancelBacktest(
    backtestId: string,
    token?: string | null,
    idempotencyKey?: string
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/backtests/${encodeURIComponent(backtestId)}/cancel`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': idempotencyKey || createIdempotencyKey('cancel'),
        },
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Gets the real-time execution status of a backtest run.
   * GET /qslate/v1/backtests/{backtestId}/status
   */
  public async getBacktestStatus(
    backtestId: string,
    token?: string | null
  ): Promise<BacktestJob> {
    return this.request<BacktestJob>(
      `/qslate/v1/backtests/${encodeURIComponent(backtestId)}/status`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetches real trade executions for a completed backtest run.
   * GET /qslate/v1/backtests/{backtestId}/trades
   */
  public async getBacktestTrades<T = unknown>(
    backtestId: string,
    params?: { cursor?: string; limit?: number },
    token?: string | null
  ): Promise<BacktestArtifactPage<T>> {
    return this.getBacktestArtifact<T>(backtestId, 'trades', params, token);
  }

  /**
   * Fetches authentic equity curve points for a completed backtest run.
   * GET /qslate/v1/backtests/{backtestId}/equity-curve
   */
  public async getBacktestEquityCurve<T = unknown>(
    backtestId: string,
    params?: { cursor?: string; limit?: number },
    token?: string | null
  ): Promise<BacktestArtifactPage<T>> {
    return this.getBacktestArtifact<T>(
      backtestId,
      'equity-curve',
      params,
      token
    );
  }

  /**
   * Uploads a custom CSV/Parquet market data dataset.
   * POST /qslate/v1/data/custom/upload
   */
  public async uploadCustomDataset(
    file: File | Blob,
    name: string,
    token?: string | null
  ): Promise<CustomDataset> {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('file', file);

    return this.request<CustomDataset>('/qslate/v1/data/custom/upload', {
      method: 'POST',
      body: formData,
      ...(token ? { token } : {}),
    });
  }

  /**
   * Lists custom datasets owned by the authenticated user.
   * GET /qslate/v1/data/custom
   */
  public async getCustomDatasets(
    params?: { cursor?: string; limit?: number },
    token?: string | null
  ): Promise<CustomDatasetsPage> {
    const searchParams = new URLSearchParams();
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();

    return this.request<CustomDatasetsPage>(
      `/qslate/v1/data/custom${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetches metadata, column schema, and preview rows for a custom dataset.
   * GET /qslate/v1/data/custom/{datasetId}
   */
  public async getCustomDataset(
    datasetId: string,
    token?: string | null
  ): Promise<CustomDataset> {
    return this.request<CustomDataset>(
      `/qslate/v1/data/custom/${encodeURIComponent(datasetId)}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Deletes a custom dataset.
   * DELETE /qslate/v1/data/custom/{datasetId}
   */
  public async deleteCustomDataset(
    datasetId: string,
    token?: string | null
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/data/custom/${encodeURIComponent(datasetId)}`,
      {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Configures timestamp and OHLCV column mappings for a custom dataset.
   * POST /qslate/v1/data/custom/{datasetId}/mapping
   */
  public async mapDatasetColumns(
    datasetId: string,
    payload: CustomDatasetMappingPayload,
    token?: string | null
  ): Promise<CustomDataset> {
    return this.request<CustomDataset>(
      `/qslate/v1/data/custom/${encodeURIComponent(datasetId)}/mapping`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Triggers integrity and format validation on a mapped custom dataset.
   * POST /qslate/v1/data/custom/{datasetId}/validate
   */
  public async validateDataset(
    datasetId: string,
    idempotencyKey?: string,
    token?: string | null
  ): Promise<CustomDatasetValidationJob> {
    const key =
      idempotencyKey ||
      `validate-${crypto.randomUUID().replace(/-/g, '')}-${Date.now()}`;
    return this.request<CustomDatasetValidationJob>(
      `/qslate/v1/data/custom/${encodeURIComponent(datasetId)}/validate`,
      {
        method: 'POST',
        headers: {
          'Idempotency-Key': key,
        },
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetches searchable catalog of tradable and custom dataset symbols.
   * GET /qslate/v1/data/symbols
   */
  public async getMarketSymbols(
    params?: { q?: string; cursor?: string; limit?: number },
    token?: string | null
  ): Promise<MarketSymbolsPage> {
    const searchParams = new URLSearchParams();
    if (params?.q) searchParams.set('q', params.q);
    if (params?.cursor) searchParams.set('cursor', params.cursor);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const qs = searchParams.toString();

    return this.request<MarketSymbolsPage>(
      `/qslate/v1/data/symbols${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Fetches historical OHLCV candlestick series for a symbol and resolution.
   * GET /qslate/v1/data/history
   */
  public async getMarketHistory(
    params: MarketHistoryParams,
    token?: string | null
  ): Promise<MarketHistory> {
    const searchParams = new URLSearchParams();
    searchParams.set('symbol', params.symbol);
    searchParams.set('resolution', params.resolution);
    searchParams.set('start', params.start);
    searchParams.set('end', params.end);
    if (params.cursor) searchParams.set('cursor', params.cursor);
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.version_id) searchParams.set('version_id', params.version_id);
    const qs = searchParams.toString();

    return this.request<MarketHistory>(
      `/qslate/v1/data/history${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Lists all dashboards owned by the authenticated user.
   * GET /qslate/v1/dashboards
   */
  public async getDashboards(
    paramsOrToken?: { cursor?: string; limit?: number } | string | null,
    token?: string | null
  ): Promise<DashboardsPage> {
    let actualParams: { cursor?: string; limit?: number } | undefined;
    let actualToken = token;
    if (typeof paramsOrToken === 'string' || paramsOrToken === null) {
      actualToken = paramsOrToken ?? undefined;
    } else {
      actualParams = paramsOrToken;
    }

    const searchParams = new URLSearchParams();
    if (actualParams?.cursor) searchParams.set('cursor', actualParams.cursor);
    if (actualParams?.limit)
      searchParams.set('limit', String(actualParams.limit));
    const qs = searchParams.toString();

    return this.request<DashboardsPage>(
      `/qslate/v1/dashboards${qs ? `?${qs}` : ''}`,
      {
        method: 'GET',
        ...(actualToken ? { token: actualToken } : {}),
      }
    );
  }

  /**
   * Creates a new dashboard with initial metadata.
   * POST /qslate/v1/dashboards
   */
  public async createDashboard(
    payload: { title: string; description?: string; tags?: string[] },
    token?: string | null
  ): Promise<Dashboard> {
    return this.request<Dashboard>('/qslate/v1/dashboards', {
      method: 'POST',
      body: JSON.stringify(payload),
      ...(token ? { token } : {}),
    });
  }

  /**
   * Fetches full dashboard configuration including widgets and layout items.
   * GET /qslate/v1/dashboards/{dashboardId}
   */
  public async getDashboard(
    dashboardId: string,
    token?: string | null
  ): Promise<Dashboard> {
    return this.request<Dashboard>(
      `/qslate/v1/dashboards/${encodeURIComponent(dashboardId)}`,
      {
        method: 'GET',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Replaces dashboard metadata (title, description, tags).
   * PUT /qslate/v1/dashboards/{dashboardId}
   */
  public async updateDashboard(
    dashboardId: string,
    payload: { title: string; description?: string; tags?: string[] },
    token?: string | null
  ): Promise<Dashboard> {
    return this.request<Dashboard>(
      `/qslate/v1/dashboards/${encodeURIComponent(dashboardId)}`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Deletes a dashboard.
   * DELETE /qslate/v1/dashboards/{dashboardId}
   */
  public async deleteDashboard(
    dashboardId: string,
    token?: string | null
  ): Promise<void> {
    return this.request<void>(
      `/qslate/v1/dashboards/${encodeURIComponent(dashboardId)}`,
      {
        method: 'DELETE',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Duplicates an existing dashboard with all its widgets and layout.
   * POST /qslate/v1/dashboards/{dashboardId}/duplicate
   */
  public async duplicateDashboard(
    dashboardId: string,
    token?: string | null
  ): Promise<Dashboard> {
    return this.request<Dashboard>(
      `/qslate/v1/dashboards/${encodeURIComponent(dashboardId)}/duplicate`,
      {
        method: 'POST',
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Saves updated grid layout coordinates and dimensions to the server.
   * PUT /qslate/v1/dashboards/{dashboardId}/layout
   */
  public async updateDashboardLayout(
    dashboardId: string,
    payload: DashboardLayoutUpdatePayload,
    token?: string | null
  ): Promise<Dashboard> {
    return this.request<Dashboard>(
      `/qslate/v1/dashboards/${encodeURIComponent(dashboardId)}/layout`,
      {
        method: 'PUT',
        body: JSON.stringify(payload),
        ...(token ? { token } : {}),
      }
    );
  }

  /**
   * Resets the dashboard layout to default layout positions.
   * POST /qslate/v1/dashboards/{dashboardId}/layout/reset
   */
  public async resetDashboardLayout(
    dashboardId: string,
    token?: string | null
  ): Promise<Dashboard> {
    return this.request<Dashboard>(
      `/qslate/v1/dashboards/${encodeURIComponent(dashboardId)}/layout/reset`,
      {
        method: 'POST',
        ...(token ? { token } : {}),
      }
    );
  }
}

export const apiClient = new QslateApiClient();
