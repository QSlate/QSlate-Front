import type {
  CandleInterval,
  MarketCandlePoint,
  TechnicalIndicators,
  TickerInfo,
} from './types';

export const MARKET_TICKERS: TickerInfo[] = [
  // Major Indices & ETFs
  {
    symbol: 'SPX',
    name: 'S&P 500 Index',
    category: 'Index',
    exchange: 'S&P',
    basePrice: 5864.67,
    change24h: 31.42,
    change24hPercent: 0.54,
    volume24h: '$38.4B',
    high24h: 5878.2,
    low24h: 5842.1,
    decimals: 2,
  },
  {
    symbol: 'SPCX',
    name: 'S&P/TSX Composite Index',
    category: 'Index',
    exchange: 'TSX',
    basePrice: 24723.1,
    change24h: 112.4,
    change24hPercent: 0.46,
    volume24h: '$4.2B',
    high24h: 24810.0,
    low24h: 24650.0,
    decimals: 2,
  },
  {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
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
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust (Nasdaq-100)',
    category: 'Index',
    exchange: 'NASDAQ',
    basePrice: 494.8,
    change24h: 4.6,
    change24hPercent: 0.94,
    volume24h: '$19.2B',
    high24h: 496.5,
    low24h: 489.2,
    decimals: 2,
  },
  {
    symbol: 'NDX',
    name: 'Nasdaq-100 Index',
    category: 'Index',
    exchange: 'NASDAQ',
    basePrice: 20385.2,
    change24h: 184.6,
    change24hPercent: 0.91,
    volume24h: '$42.1B',
    high24h: 20450.0,
    low24h: 20210.0,
    decimals: 2,
  },
  {
    symbol: 'DJI',
    name: 'Dow Jones Industrial Average',
    category: 'Index',
    exchange: 'DJ',
    basePrice: 42863.8,
    change24h: -120.4,
    change24hPercent: -0.28,
    volume24h: '$12.5B',
    high24h: 43010.0,
    low24h: 42720.0,
    decimals: 2,
  },
  {
    symbol: 'VIX',
    name: 'CBOE Volatility Index',
    category: 'Index',
    exchange: 'CBOE',
    basePrice: 18.24,
    change24h: -0.85,
    change24hPercent: -4.45,
    volume24h: '$2.1B',
    high24h: 19.8,
    low24h: 17.9,
    decimals: 2,
  },
  {
    symbol: 'IWM',
    name: 'iShares Russell 2000 ETF',
    category: 'Index',
    exchange: 'NYSE ARCA',
    basePrice: 224.5,
    change24h: 2.1,
    change24hPercent: 0.94,
    volume24h: '$6.8B',
    high24h: 226.1,
    low24h: 222.4,
    decimals: 2,
  },

  // Big US Tech Giants & Blue Chips (Magnificent 7)
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
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 428.15,
    change24h: 3.85,
    change24hPercent: 0.91,
    volume24h: '$8.2B',
    high24h: 431.2,
    low24h: 424.0,
    decimals: 2,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com Inc.',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 187.9,
    change24h: 2.45,
    change24hPercent: 1.32,
    volume24h: '$6.5B',
    high24h: 189.5,
    low24h: 184.8,
    decimals: 2,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc. (Google)',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 165.4,
    change24h: 1.8,
    change24hPercent: 1.1,
    volume24h: '$5.1B',
    high24h: 167.0,
    low24h: 163.2,
    decimals: 2,
  },
  {
    symbol: 'META',
    name: 'Meta Platforms Inc.',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 591.2,
    change24h: 9.4,
    change24hPercent: 1.62,
    volume24h: '$7.8B',
    high24h: 595.0,
    low24h: 582.0,
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
    symbol: 'AMD',
    name: 'Advanced Micro Devices',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 156.4,
    change24h: 4.2,
    change24hPercent: 2.76,
    volume24h: '$4.9B',
    high24h: 158.5,
    low24h: 151.2,
    decimals: 2,
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    category: 'Equity',
    exchange: 'NYSE',
    basePrice: 44.8,
    change24h: 1.95,
    change24hPercent: 4.55,
    volume24h: '$3.4B',
    high24h: 45.4,
    low24h: 42.6,
    decimals: 2,
  },
  {
    symbol: 'COIN',
    name: 'Coinbase Global Inc.',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 216.5,
    change24h: 8.4,
    change24hPercent: 4.04,
    volume24h: '$2.8B',
    high24h: 221.0,
    low24h: 207.5,
    decimals: 2,
  },
  {
    symbol: 'SMCI',
    name: 'Super Micro Computer',
    category: 'Equity',
    exchange: 'NASDAQ',
    basePrice: 47.9,
    change24h: -1.2,
    change24hPercent: -2.44,
    volume24h: '$1.9B',
    high24h: 49.8,
    low24h: 46.2,
    decimals: 2,
  },
  {
    symbol: 'GME',
    name: 'GameStop Corp.',
    category: 'Equity',
    exchange: 'NYSE',
    basePrice: 22.4,
    change24h: 0.85,
    change24hPercent: 3.94,
    volume24h: '$450M',
    high24h: 23.2,
    low24h: 21.3,
    decimals: 2,
  },

  // Futures
  {
    symbol: 'ES1!',
    name: 'E-mini S&P 500 Futures',
    category: 'Futures',
    exchange: 'CME',
    basePrice: 5882.25,
    change24h: 28.5,
    change24hPercent: 0.49,
    volume24h: '$120B',
    high24h: 5895.0,
    low24h: 5855.0,
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
    volume24h: '$118B',
    high24h: 20510.0,
    low24h: 20280.0,
    decimals: 2,
  },
  {
    symbol: 'GC1!',
    name: 'Gold Futures',
    category: 'Futures',
    exchange: 'COMEX',
    basePrice: 2738.4,
    change24h: 14.8,
    change24hPercent: 0.54,
    volume24h: '$32B',
    high24h: 2748.0,
    low24h: 2720.0,
    decimals: 1,
  },
  {
    symbol: 'CL1!',
    name: 'Crude Oil WTI Futures',
    category: 'Futures',
    exchange: 'NYMEX',
    basePrice: 71.4,
    change24h: -0.95,
    change24hPercent: -1.31,
    volume24h: '$24B',
    high24h: 72.8,
    low24h: 70.8,
    decimals: 2,
  },

  // Crypto Pairs
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
    symbol: 'BNB/USDT',
    name: 'BNB',
    category: 'Crypto',
    exchange: 'BINANCE',
    basePrice: 598.2,
    change24h: 11.4,
    change24hPercent: 1.94,
    volume24h: '$420M',
    high24h: 604.5,
    low24h: 586.0,
    decimals: 1,
  },
  {
    symbol: 'XRP/USDT',
    name: 'Ripple',
    category: 'Crypto',
    exchange: 'BINANCE',
    basePrice: 0.548,
    change24h: 0.012,
    change24hPercent: 2.24,
    volume24h: '$310M',
    high24h: 0.562,
    low24h: 0.534,
    decimals: 4,
  },
];

/**
 * Maps standard platform ticker symbols to TradingView embeddable format.
 * Allows instant live charting for SPX, SPCX, NVDA, AAPL, Crypto, Futures etc.
 */
export function toTradingViewSymbol(symbol: string): string {
  const s = symbol.trim().toUpperCase();
  if (s.includes(':')) return s;

  const map: Record<string, string> = {
    SPX: 'SP:SPX',
    SPCX: 'TSX:SPCX',
    SPY: 'AMEX:SPY',
    QQQ: 'NASDAQ:QQQ',
    NDX: 'NASDAQ:NDX',
    DJI: 'DJ:DJI',
    VIX: 'CBOE:VIX',
    IWM: 'AMEX:IWM',
    NVDA: 'NASDAQ:NVDA',
    AAPL: 'NASDAQ:AAPL',
    MSFT: 'NASDAQ:MSFT',
    AMZN: 'NASDAQ:AMZN',
    GOOGL: 'NASDAQ:GOOGL',
    META: 'NASDAQ:META',
    TSLA: 'NASDAQ:TSLA',
    AMD: 'NASDAQ:AMD',
    PLTR: 'NYSE:PLTR',
    'BRK.B': 'NYSE:BRK.B',
    JPM: 'NYSE:JPM',
    COIN: 'NASDAQ:COIN',
    NFLX: 'NASDAQ:NFLX',
    AVGO: 'NASDAQ:AVGO',
    DIS: 'NYSE:DIS',
    BA: 'NYSE:BA',
    SMCI: 'NASDAQ:SMCI',
    GME: 'NYSE:GME',
    'ES1!': 'CME_MINI:ES1!',
    'NQ1!': 'CME_MINI:NQ1!',
    'GC1!': 'COMEX:GC1!',
    'CL1!': 'NYMEX:CL1!',
    'BTC/USDT': 'BINANCE:BTCUSDT',
    'ETH/USDT': 'BINANCE:ETHUSDT',
    'SOL/USDT': 'BINANCE:SOLUSDT',
    'BNB/USDT': 'BINANCE:BNBUSDT',
    'XRP/USDT': 'BINANCE:XRPUSDT',
  };

  if (map[s]) return map[s];
  if (s.endsWith('/USDT')) return `BINANCE:${s.replace('/', '')}`;
  if (s.endsWith('USDT')) return `BINANCE:${s}`;

  // Default to standard US ticker
  return s;
}

const INTERVAL_SECONDS: Record<CandleInterval, number> = {
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
  '1W': 604800,
};

/**
 * Generate synthetic, realistic OHLC candlestick series for fallback when offline or in tests.
 */
export function generateMockCandles(
  symbol: string,
  interval: CandleInterval = '1D',
  count = 90
): MarketCandlePoint[] {
  const ticker = MARKET_TICKERS.find(
    (t) => t.symbol.toUpperCase() === symbol.toUpperCase()
  ) ?? {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Asset`,
    category: 'Equity' as const,
    exchange: 'GLOBAL',
    basePrice: 150.0,
    change24h: 2.5,
    change24hPercent: 1.68,
    volume24h: '$1.2B',
    high24h: 153.0,
    low24h: 147.5,
    decimals: 2,
  };

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

  if (candles.length > 0) {
    const last = candles[candles.length - 1];
    last.close = ticker.basePrice;
    last.high = Math.max(last.high, ticker.basePrice * 1.002);
    last.low = Math.min(last.low, ticker.basePrice * 0.998);
  }

  return candles;
}

export function calculateEMA(
  candles: MarketCandlePoint[],
  period: number
): { time: number; value: number }[] {
  if (candles.length < period) return [];

  const k = 2 / (period + 1);
  const result: { time: number; value: number }[] = [];

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
