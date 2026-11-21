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

export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  line: number;
  column: number;
  end_line: number;
  end_column: number;
  severity: DiagnosticSeverity;
  message: string;
}

export interface DiagnosticsResponse {
  valid: boolean;
  diagnostics: Diagnostic[];
}

export interface StrategySummary {
  id: string;
  version_id: string;
  revision: number;
  name: string;
  created_at: string;
  updated_at: string;
  read_only?: boolean;
}

export interface StrategyPage {
  items: StrategySummary[];
  next_cursor?: string;
}

export interface Strategy {
  id: string;
  version_id: string;
  revision: number;
  name: string;
  source: string;
  parameters: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  read_only?: boolean;
}

export interface StrategyVersion {
  version_id: string;
  revision: number;
  name: string;
  source: string;
  parameters: Record<string, unknown>;
  restored_from?: string;
  created_at: string;
}

export interface StrategyVersionsPage {
  items: StrategyVersion[];
  next_cursor?: string;
}

export interface StrategyInput {
  name: string;
  source: string;
  parameters?: Record<string, unknown>;
}

export interface StrategyUpdateInput {
  base_version_id: string;
  source: string;
  name?: string;
  parameters?: Record<string, unknown>;
}

export interface StrategyRestoreInput {
  version_id: string;
  base_version_id: string;
}

// ---------------------------------------------------------------------------
// Marketplace Types & DTOs
// ---------------------------------------------------------------------------

export type MarketplaceItemKind = 'strategy' | 'widget';

export interface MarketplaceItem {
  id: string;
  kind: MarketplaceItemKind;
  version_id: string;
  author_id: number;
  name: string;
  description: string;
  category: string;
  visibility: string;
  revision: number;
  install_count: number;
  review_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface MarketplacePage {
  items: MarketplaceItem[];
  next_cursor?: string;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
}

export interface MarketplaceCategoriesPage {
  items: MarketplaceCategory[];
  next_cursor?: string;
}

export interface MarketplaceReview {
  id: string;
  author_id: number;
  rating: number;
  comment: string;
  created_at: string;
}

export interface MarketplaceReviewInput {
  rating: number;
  comment: string;
}

export interface MarketplaceReviewsPage {
  items: MarketplaceReview[];
  next_cursor?: string;
}

export interface MarketplacePublishInput {
  kind: MarketplaceItemKind;
  resource_id: string;
  version_id: string;
  name: string;
  description: string;
  category: string;
  visibility?: string;
}

export interface MarketplacePatchInput {
  base_revision: number;
  name?: string;
  description?: string;
  category?: string;
  visibility?: string;
  version_id?: string;
}

export interface MarketplaceInstallation {
  item_id: string;
  version_id: string;
  kind: string;
  catalog_id: string;
  installed_at: string;
  name?: string;
  language?: string;
  source?: string;
  configuration?: unknown;
}

export interface MarketplaceFilter {
  q?: string;
  kind?: string;
  category?: string;
  cursor?: string;
  limit?: number;
}
