import type {
  CandleInterval,
  MarketCandlePoint,
  TechnicalIndicators,
  TickerInfo,
} from './types';

export const MARKET_TICKERS: TickerInfo[] = [
  {
    symbol: 'ETH/USDT',
    name: 'Ethereum',
    category: 'Crypto',
    exchange: 'BINANCE',
    basePrice: 3482.4,
    change24h: 128.5,
    change24hPercent: 3.82,
    volume24h: '$1.48B',
    high24h: 3512.0,
    low24h: 3354.2,
    decimals: 2,
  },
  {
    symbol: 'BTC/USDT',
    name: 'Bitcoin',
    category: 'Crypto',
    exchange: 'COINBASE',
    basePrice: 67420.0,
    change24h: 1420.0,
    change24hPercent: 2.15,
    volume24h: '$4.21B',
    high24h: 68150.0,
    low24h: 65980.0,
    decimals: 1,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 138.25,
    change24h: 6.15,
    change24hPercent: 4.65,
    volume24h: '$14.2B',
    high24h: 139.5,
    low24h: 132.8,
    decimals: 2,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF',
    category: 'Index',
    exchange: 'NYSE ARCA',
    basePrice: 582.1,
    change24h: 4.3,
    change24hPercent: 0.74,
    volume24h: '$28.6B',
    high24h: 584.2,
    low24h: 579.5,
    decimals: 2,
  },
  {
    symbol: 'SOL/USDT',
    name: 'Solana',
    category: 'Crypto',
    exchange: 'BINANCE',
    basePrice: 184.6,
    change24h: 9.1,
    change24hPercent: 5.2,
    volume24h: '$980M',
    high24h: 188.4,
    low24h: 173.2,
    decimals: 2,
  },
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 231.5,
    change24h: -0.98,
    change24hPercent: -0.42,
    volume24h: '$7.4B',
    high24h: 233.8,
    low24h: 230.1,
    decimals: 2,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 218.8,
    change24h: 4.12,
    change24hPercent: 1.92,
    volume24h: '$8.9B',
    high24h: 221.4,
    low24h: 214.0,
    decimals: 2,
  },
  {
    symbol: 'NQ1!',
    name: 'E-mini Nasdaq 100 Futures',
    category: 'Futures',
    exchange: 'CME',
    basePrice: 20435.5,
    change24h: 215.5,
    change24hPercent: 1.07,
    volume24h: '$18.1B',
    high24h: 20510.0,
    low24h: 20280.0,
    decimals: 2,
  },
];

const INTERVAL_SECONDS: Record<CandleInterval, number> = {
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
  '1W': 604800,
};

/**
 * Generate synthetic, realistic OHLC candlestick series for a chosen symbol and interval.
 * Uses pseudo-random walk with momentum, mean-reversion, and realistic shadows.
 */
export function generateMockCandles(
  symbol: string,
  interval: CandleInterval = '1D',
  count = 90
): MarketCandlePoint[] {
  const ticker =
    MARKET_TICKERS.find((t) => t.symbol === symbol) ?? MARKET_TICKERS[0];
  const stepSeconds = INTERVAL_SECONDS[interval] ?? 86400;
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - count * stepSeconds;

  const volatility = ticker.category === 'Crypto' ? 0.024 : 0.012;
  const seedMultiplier =
    symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 17;

  let currentClose = ticker.basePrice * (1 - volatility * (count * 0.15));
  const candles: MarketCandlePoint[] = [];

  for (let i = 0; i < count; i++) {
    const time = startTime + i * stepSeconds;
    const progress = i / count;

    // Macro drift towards current basePrice
    const drift =
      (ticker.basePrice - currentClose) * 0.04 +
      Math.sin(i * 0.22 + seedMultiplier) *
        (ticker.basePrice * volatility * 0.6);

    const open = Number(
      (
        currentClose +
        Math.sin(i * 1.7) * ticker.basePrice * volatility * 0.1
      ).toFixed(ticker.decimals)
    );

    const shock = (Math.sin(i * 0.95 + progress * 8) + Math.cos(i * 2.3)) * 0.5;
    const closeDelta = open * volatility * shock + drift * 0.3;
    const close = Number(
      Math.max(ticker.basePrice * 0.4, open + closeDelta).toFixed(
        ticker.decimals
      )
    );

    const higher = Math.max(open, close);
    const lower = Math.min(open, close);

    const upperWick = Math.abs(Math.sin(i * 3.4)) * (open * volatility * 0.8);
    const lowerWick = Math.abs(Math.cos(i * 2.7)) * (open * volatility * 0.8);

    const high = Number((higher + upperWick).toFixed(ticker.decimals));
    const low = Number(
      Math.max(ticker.basePrice * 0.35, lower - lowerWick).toFixed(
        ticker.decimals
      )
    );

    // Volume surges with volatility
    const volumeBase = ticker.category === 'Crypto' ? 12000 : 85000;
    const volume = Math.round(
      volumeBase * (1 + Math.abs(shock) * 2.5 + Math.sin(i * 0.8) * 0.5)
    );

    candles.push({
      time,
      open,
      high,
      low,
      close,
      volume,
    });

    currentClose = close;
  }

  // Ensure last candle matches ticker.basePrice closely
  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = ticker.basePrice;
    last.high = Math.max(last.high, ticker.basePrice * 1.002);
    last.low = Math.min(last.low, ticker.basePrice * 0.998);
  }

  return candles;
}

/**
 * Calculate Exponential Moving Average (EMA) for a series of candles.
 */
export function calculateEMA(
  candles: MarketCandlePoint[],
  period: number
): { time: number; value: number }[] {
  if (candles.length < period) return [];

  const k = 2 / (period + 1);
  const result: { time: number; value: number }[] = [];

  // Simple moving average for the first period elements
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEMA = sum / period;
  result.push({
    time: candles[period - 1].time,
    value: Number(prevEMA.toFixed(2)),
  });

  for (let i = period; i < candles.length; i++) {
    const ema = candles[i].close * k + prevEMA * (1 - k);
    result.push({ time: candles[i].time, value: Number(ema.toFixed(2)) });
    prevEMA = ema;
  }

  return result;
}

/**
 * Generate technical indicators (EMA 21, EMA 55, Volume) for candles.
 */
export function getTechnicalIndicators(
  candles: MarketCandlePoint[]
): TechnicalIndicators {
  return {
    ema21: calculateEMA(candles, 21),
    ema55: calculateEMA(candles, 55),
    volume: candles.map((c) => ({
      time: c.time,
      value: c.volume,
      color:
        c.close >= c.open
          ? 'rgba(16, 185, 129, 0.4)'
          : 'rgba(244, 63, 94, 0.4)',
    })),
  };
}
