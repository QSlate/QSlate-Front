export type WidgetCategory =
  | 'Core Analytics'
  | 'Risk Analytics'
  | 'Execution Algos'
  | 'Alternative Data'
  | 'Machine Learning'
  | 'Execution';

export interface WidgetMetadata {
  id: string;
  title: string;
  category: WidgetCategory;
  subtitle: string;
  iconName: string;
  isCore: boolean;
}

export interface MarketplaceModule {
  id: string;
  title: string;
  category: WidgetCategory;
  author: string;
  rating: number;
  installs: string;
  isVerified: boolean;
  isComingSoon: boolean;
  widgetId?: string;
  description: string;
  tags: string[];
}

export interface MonteCarloDataPoint {
  step: number;
  p5: number;
  p25: number;
  median: number;
  p75: number;
  p95: number;
}

export interface OrderBookRow {
  price: number;
  size: number;
  cumulative: number;
  intensity: number;
  side: 'bid' | 'ask';
}

export interface VolatilityHistogramBin {
  bin: string;
  count: number;
  isRegimeSpike: boolean;
  regime: 'low' | 'normal' | 'high' | 'crisis';
}
