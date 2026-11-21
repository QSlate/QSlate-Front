import type {
  AuthSession,
  BackendErrorResponse,
  CustomWidget,
  CustomWidgetInput,
  DashboardAddWidgetInput,
  DiagnosticsResponse,
  InstalledWidgetsPage,
  LoginPayload,
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
}

export class QslateApiClient {
  private readonly baseUrl: string;
  private tokenProvider: (() => string | null) | null = null;

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
}

export const apiClient = new QslateApiClient();
