import type { OHLCData } from '@/shared/ui/charts/types';

export type MarketCategory = 'Crypto' | 'Equity' | 'Futures' | 'Index';

export type CandleInterval = '15m' | '1h' | '4h' | '1D' | '1W';

export interface TickerInfo {
  symbol: string;
  name: string;
  category: MarketCategory;
  exchange: string;
  basePrice: number;
  change24h: number;
  change24hPercent: number;
  volume24h: string;
  high24h: number;
  low24h: number;
  decimals: number;
}

export interface MarketCandlePoint extends OHLCData {
  time: number;
  volume: number;
}

export interface TechnicalIndicators {
  ema21: { time: number; value: number }[];
  ema55: { time: number; value: number }[];
  volume: { time: number; value: number; color?: string }[];
}
