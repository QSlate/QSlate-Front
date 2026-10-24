/**
 * API types strictly matching the Go backend contracts in QSlate-Back.
 * Reference: QSlate-Back/docs/auth.openapi.yaml, QSlate-Back/services/auth
 */

export interface User {
  id: number;
  email: string;
  username: string;
  created_at: string;
  display_name: string;
  email_verified: boolean;
}

export interface AuthSession {
  user: User;
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
}

export interface BackendErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export interface UserPreferencesDTO {
  theme: string;
  colorblind_mode: boolean;
}

export interface UserPreferencesPatchDTO {
  theme?: string;
  colorblind_mode?: boolean;
}
