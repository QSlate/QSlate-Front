import type {
  AuthSession,
  BackendErrorResponse,
  LoginPayload,
  RegisterPayload,
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
}

export const apiClient = new QslateApiClient();
