import type {
  MarketplaceModule,
  MonteCarloDataPoint,
  OrderBookRow,
  VolatilityHistogramBin,
  WidgetMetadata,
} from './types';

export const LAB_WIDGET_INVENTORY: WidgetMetadata[] = [
  {
    id: 'equity-curve',
    title: 'Portfolio Equity Curve',
    category: 'Core Analytics',
    subtitle: 'Strategy NAV and benchmark performance',
    iconName: 'LineChart',
    isCore: true,
  },
  {
    id: 'drawdown',
    title: 'Drawdown & Regime Waterfall',
    category: 'Risk Analytics',
    subtitle: 'Monthly returns and drawdown duration',
    iconName: 'BarChart3',
    isCore: true,
  },
  {
    id: 'execution-metrics',
    title: 'Executive Quant Metrics',
    category: 'Core Analytics',
    subtitle: 'Risk, returns and execution statistics',
    iconName: 'LayoutGrid',
    isCore: true,
  },
  {
    id: 'trade-log',
    title: 'Trade Execution Log',
    category: 'Execution',
    subtitle: 'Inspect entries, exits and individual trades',
    iconName: 'ListOrdered',
    isCore: true,
  },
  {
    id: 'monte-carlo',
    title: 'Monte Carlo 10k Simulator',
    category: 'Risk Analytics',
    subtitle: '10,000 path confidence interval fan projections',
    iconName: 'Activity',
    isCore: false,
  },
  {
    id: 'order-book',
    title: 'Order Book Heatmap L2',
    category: 'Alternative Data',
    subtitle: 'Market depth liquidity matrix & real-time bid/ask pressure',
    iconName: 'Layers',
    isCore: false,
  },
  {
    id: 'volatility-filter',
    title: 'Regime-Aware Volatility Filter',
    category: 'Machine Learning',
    subtitle: 'Gaussian Mixture Model volatility state classification',
    iconName: 'Cpu',
    isCore: false,
  },
  {
    id: 'tradingview-candles',
    title: 'TradingView Market Terminal',
    category: 'Core Analytics',
    subtitle:
      'Institutional OHLC candlesticks with multi-asset ticker selector',
    iconName: 'CandlestickChart',
    isCore: false,
  },
];

export const MARKETPLACE_MODULES: MarketplaceModule[] = [
  {
    id: 'mod-monte-carlo',
    title: 'Monte Carlo 10k Simulator',
    category: 'Risk Analytics',
    author: '@QSLate Labs',
    rating: 4.9,
    installs: '48.2k',
    isVerified: true,
    isComingSoon: false,
    widgetId: 'monte-carlo',
    description:
      '10,000 geometric Brownian motion paths parameterized by rolling empirical skewness and kurtosis.',
    tags: ['Monte Carlo', 'VaR', 'Risk', 'Polars'],
  },
  {
    id: 'mod-order-book',
    title: 'Order Book Heatmap L2',
    category: 'Alternative Data',
    author: '@DepthCharts',
    rating: 4.8,
    installs: '31.7k',
    isVerified: true,
    isComingSoon: false,
    widgetId: 'order-book',
    description:
      'Ultra-low latency Level-2 order book depth surface with microsecond liquidity queue modeling.',
    tags: ['Order Book', 'L2', 'Microstructure', 'Depth'],
  },
  {
    id: 'mod-volatility-filter',
    title: 'Regime-Aware Volatility Filter',
    category: 'Machine Learning',
    author: '@m.kovacs',
    rating: 4.7,
    installs: '12.9k',
    isVerified: true,
    isComingSoon: false,
    widgetId: 'volatility-filter',
    description:
      'Unsupervised Hidden Markov Model (HMM) volatility regime classifier to filter high-entropy regimes.',
    tags: ['HMM', 'Volatility', 'Regimes', 'ML'],
  },
  {
    id: 'mod-twap-vwap',
    title: 'TWAP/VWAP Execution Engine',
    category: 'Execution Algos',
    author: '@Citadel-ish',
    rating: 4.6,
    installs: '22.4k',
    isVerified: true,
    isComingSoon: true,
    description:
      'Institutional volume-weighted execution slicer with real-time participation rate constraints.',
    tags: ['TWAP', 'VWAP', 'Execution', 'Algos'],
  },
  {
    id: 'mod-satellite',
    title: 'Satellite Foot-Traffic Signals',
    category: 'Alternative Data',
    author: '@OrbitalAlpha',
    rating: 4.4,
    installs: '5.1k',
    isVerified: true,
    isComingSoon: true,
    description:
      'Synthetic aperture radar (SAR) vessel and retail parking index for anticipatory earnings trades.',
    tags: ['Satellite', 'Alternative Data', 'Nowcasting'],
  },
  {
    id: 'mod-tail-risk',
    title: 'Tail-Risk VaR / CVaR Panel',
    category: 'Risk Analytics',
    author: '@QSLate Labs',
    rating: 4.8,
    installs: '27.0k',
    isVerified: true,
    isComingSoon: true,
    description:
      'Extreme Value Theory (EVT) conditional value at risk with multi-asset Copula tail dependence.',
    tags: ['Tail Risk', 'CVaR', 'EVT', 'Extreme Loss'],
  },
];

export const MOCK_MONTE_CARLO_SERIES: MonteCarloDataPoint[] = Array.from({
  length: 30,
}).map((_, i) => {
  const t = i / 30;
  const drift = t * 34000;
  return {
    step: i,
    p5: Math.round(100000 - t * 12000),
    p25: Math.round(100000 + drift * 0.4 - t * 3000),
    median: Math.round(100000 + drift * 0.9),
    p75: Math.round(100000 + drift * 1.45),
    p95: Math.round(100000 + drift * 2.1),
  };
});

export const MOCK_ORDER_BOOK_ROWS: OrderBookRow[] = [
  { price: 5434.5, size: 284, cumulative: 1240, intensity: 0.95, side: 'ask' },
  { price: 5433.75, size: 210, cumulative: 956, intensity: 0.85, side: 'ask' },
  { price: 5433.0, size: 175, cumulative: 746, intensity: 0.72, side: 'ask' },
  { price: 5432.25, size: 140, cumulative: 571, intensity: 0.6, side: 'ask' },
  { price: 5431.5, size: 112, cumulative: 431, intensity: 0.48, side: 'ask' },
  { price: 5430.75, size: 85, cumulative: 319, intensity: 0.35, side: 'ask' },
  { price: 5430.0, size: 44, cumulative: 234, intensity: 0.2, side: 'ask' },
  { price: 5429.25, size: 52, cumulative: 52, intensity: 0.22, side: 'bid' },
  { price: 5428.5, size: 98, cumulative: 150, intensity: 0.38, side: 'bid' },
  { price: 5427.75, size: 135, cumulative: 285, intensity: 0.52, side: 'bid' },
  { price: 5427.0, size: 165, cumulative: 450, intensity: 0.65, side: 'bid' },
  { price: 5426.25, size: 220, cumulative: 670, intensity: 0.78, side: 'bid' },
  { price: 5425.5, size: 275, cumulative: 945, intensity: 0.88, side: 'bid' },
  { price: 5424.75, size: 340, cumulative: 1285, intensity: 1.0, side: 'bid' },
];

export const MOCK_VOLATILITY_BINS: VolatilityHistogramBin[] = [
  { bin: '0-5%', count: 8, isRegimeSpike: false, regime: 'low' },
  { bin: '5-10%', count: 18, isRegimeSpike: false, regime: 'low' },
  { bin: '10-15%', count: 24, isRegimeSpike: false, regime: 'normal' },
  { bin: '15-20%', count: 32, isRegimeSpike: true, regime: 'high' },
  { bin: '20-25%', count: 19, isRegimeSpike: false, regime: 'normal' },
  { bin: '25-30%', count: 14, isRegimeSpike: false, regime: 'normal' },
  { bin: '30-35%', count: 28, isRegimeSpike: true, regime: 'high' },
  { bin: '35-40%', count: 16, isRegimeSpike: false, regime: 'normal' },
  { bin: '40-45%', count: 9, isRegimeSpike: false, regime: 'normal' },
  { bin: '45-50%', count: 22, isRegimeSpike: true, regime: 'crisis' },
  { bin: '50-55%', count: 7, isRegimeSpike: false, regime: 'crisis' },
  { bin: '55-60%', count: 3, isRegimeSpike: false, regime: 'crisis' },
];
