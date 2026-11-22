/** Built-in result widgets of the Lab dashboard. */
export type LabWidgetType =
  | 'net-return'
  | 'max-drawdown'
  | 'sharpe'
  | 'win-rate'
  | 'capital-chart'
  | 'price-chart'
  | 'drawdowns'
  | 'monthly-returns'
  | 'trade-distribution'
  | 'trades';

export type WidgetCategory = 'performance' | 'risk' | 'trades' | 'market';

export type WidgetTone = 'brand' | 'gain' | 'loss' | 'vio' | 'amber';

/** Everything the dashboard needs to place and describe a widget. */
export interface LabWidgetDefinition {
  readonly type: LabWidgetType;
  readonly title: string;
  /** One-sentence explanation (drawer card and header tooltip). */
  readonly description: string;
  readonly category: WidgetCategory;
  readonly tone: WidgetTone;
  /** Grid size in columns (of 12) and rows. */
  readonly defaultSize: { readonly w: number; readonly h: number };
  readonly minSize: { readonly w: number; readonly h: number };
}
