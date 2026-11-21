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

// ---------------------------------------------------------------------------
// Widgets Service Types & DTOs (/qslate/v1/widgets/*)
// ---------------------------------------------------------------------------

export type InstalledWidgetKind = 'core' | 'custom' | 'marketplace';

export interface InstalledWidget {
  id: string;
  version_id: string;
  kind: InstalledWidgetKind;
  name: string;
  language: string;
  created_at: string;
  updated_at: string;
  category?: string;
  subtitle?: string;
  min_w?: number;
  min_h?: number;
  default_w?: number;
  default_h?: number;
}

export interface InstalledWidgetsPage {
  items: InstalledWidget[];
  next_cursor?: string;
}

export interface CustomWidgetInput {
  name: string;
  language: string;
  source: string;
  configuration?: Record<string, unknown>;
}

export interface CustomWidget extends InstalledWidget {
  source: string;
  configuration: Record<string, unknown>;
}

export interface DashboardAddWidgetInput {
  widget_id: string;
  widget_version_id?: string;
  configuration?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Auth Service User Preferences & Runner API Keys (/qslate/v1/users/me/*)
// ---------------------------------------------------------------------------

export type UserPreferences = UserPreferencesDTO;
export type UserPreferencesPatch = UserPreferencesPatchDTO;

export interface APIKeyDto {
  id: string;
  name: string;
  scopes: string[];
  created_at: string;
  expires_at: string;
  revoked_at?: string | null;
}

export interface APIKeyInputDto {
  name: string;
  scopes?: string[];
  expires_in_days?: number;
}

export interface NewAPIKeyDto {
  key: APIKeyDto;
  secret: string;
}

export interface APIKeysPageDto {
  items: APIKeyDto[];
}

// ---------------------------------------------------------------------------
// Lab Service Backtest Runs & Telemetry (/qslate/v1/backtests/*)
// ---------------------------------------------------------------------------

export type BacktestStatus =
  'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface BacktestRunInput {
  strategy_id: string;
  strategy_version_id?: string;
  dataset_id: string;
  dataset_version_id?: string;
  start_date?: string;
  end_date?: string;
  initial_capital?: string | number;
  initial_cash?: number;
  parameters?: Record<string, unknown>;
  execution_target?: string;
  window?: number;
  strategy_name?: string;
}

export interface BacktestJob {
  backtest_id: string;
  status: BacktestStatus;
  progress: number;
  input: BacktestRunInput;
  optimization_id?: string;
  created_at: string;
  updated_at: string;
  error?: string;
}

export interface BacktestRunsPage {
  items: BacktestJob[];
  next_cursor?: string;
}

export interface BacktestSummaryMetrics {
  sharpe_ratio?: number;
  total_return?: number;
  max_drawdown?: number;
  win_rate?: number;
  trades_count?: number;
  profit_factor?: number;
  volatility?: number;
  [key: string]: unknown;
}

export interface BacktestSummary {
  backtest_id: string;
  metrics: BacktestSummaryMetrics;
  strategy_version_id?: string;
  dataset_version_id?: string;
}

export interface BacktestArtifactPage<T = unknown> {
  items: T[];
  next_cursor?: string;
}

export interface BacktestLogItem {
  message: string;
}

export interface BacktestLogsPage {
  items: BacktestLogItem[];
  next_cursor?: string;
}

// ---------------------------------------------------------------------------
// Lab Service Parameter Optimization (/qslate/v1/backtests/optimize)
// ---------------------------------------------------------------------------

export type OptimizationMethod = 'grid_search' | 'monte_carlo';

export interface BacktestOptimizeInput {
  run: {
    strategy_id: string;
    strategy_version_id: string;
    dataset_id: string;
    dataset_version_id: string;
    initial_capital: string;
    parameters?: Record<string, unknown>;
    execution_target?: string;
  };
  method: OptimizationMethod;
  search_space: Record<string, number[]>;
  max_runs: number;
  seed?: number;
}

export interface OptimizationBatch {
  optimization_id: string;
  seed?: number;
  backtests: BacktestJob[];
}
