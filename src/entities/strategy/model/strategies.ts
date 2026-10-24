export interface StrategyFile {
  name: string;
  language: 'python' | 'json';
  content: string;
}

export interface StrategyDefinition {
  id: string;
  name: string;
  filename: string;
  version: string;
  author: string;
  timeframe: string;
  asset: string;
  description: string;
  files: Record<string, StrategyFile>;
}

export const MOCK_STRATEGIES: Record<string, StrategyDefinition> = {
  'momentum-eth': {
    id: 'momentum-eth',
    name: 'Momentum ETH 4h',
    filename: 'Momentum_ETH_4h.py',
    version: 'v3.2',
    author: 'Enzo Gallini',
    timeframe: '4h',
    asset: 'ETH/USD',
    description:
      'Dual EMA crossover with ATR dynamic position sizing and trailing volatility stop.',
    files: {
      'strategy.py': {
        name: 'strategy.py',
        language: 'python',
        content: `# Momentum_ETH_4h • v3.2
from qslate import Strategy, Order
from indicators import ema, atr

class MomentumETH(Strategy):
    symbol = "ETH"
    timeframe = "4h"
    risk_per_trade = 0.01

    def on_bar(self, bar):
        fast = ema(self.close, 21)
        slow = ema(self.close, 55)
        vol = atr(self.data, 14)

        if fast[-1] > slow[-1] and not self.position:
            size = self.equity * self.risk_per_trade / vol[-1]
            self.submit(Order.market("BUY", size))

        elif fast[-1] < slow[-1] and self.position:
            self.close_position(reason="cross_down")
`,
      },
      'indicators.py': {
        name: 'indicators.py',
        language: 'python',
        content: `# indicators.py • Vectorized technical indicators
import numpy as np

def ema(series, period: int):
    """Exponential Moving Average calculated using ewm alpha."""
    weights = np.exp(np.linspace(-1.0, 0.0, period))
    weights /= weights.sum()
    a = np.convolve(series, weights, mode='full')[:len(series)]
    a[:period] = a[period]
    return a

def atr(df, period: int = 14):
    """Average True Range for volatility estimation."""
    high = df['high']
    low = df['low']
    close = df['close'].shift(1)
    tr = np.maximum(high - low, np.maximum(np.abs(high - close), np.abs(low - close)))
    return tr.rolling(period).mean().bfill()

def rsi(series, period: int = 14):
    """Relative Strength Index with wilder smoothing."""
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / (loss + 1e-9)
    return 100 - (100 / (1 + rs))

def bollinger_bands(series, period: int = 20, num_std: float = 2.0):
    """Bollinger Bands standard envelope."""
    mid = series.rolling(period).mean()
    std = series.rolling(period).std()
    return mid + (std * num_std), mid, mid - (std * num_std)
`,
      },
      'config.json': {
        name: 'config.json',
        language: 'json',
        content: `{
  "strategy_id": "momentum-eth-4h",
  "version": "3.2.0",
  "engine": "qslate-polars-rust-v1",
  "sandbox": "gVisor-runsc",
  "capital": 100000,
  "currency": "USD",
  "slippage_model": "fixed_basis_points",
  "slippage_bps": 1.5,
  "execution_delay_ms": 12,
  "commission_rate": 0.0004,
  "risk_limits": {
    "max_drawdown_limit": 0.12,
    "max_leverage": 1.5,
    "position_cap": 0.25
  }
}
`,
      },
    },
  },
  'mean-reversion': {
    id: 'mean-reversion',
    name: 'MeanReversion BTC 1h',
    filename: 'MeanReversion_BTC.py',
    version: 'v2.1',
    author: 'Quant Labs',
    timeframe: '1h',
    asset: 'BTC/USDT',
    description:
      'Bollinger Band mean reversion with RSI extreme filter and trailing stop.',
    files: {
      'strategy.py': {
        name: 'strategy.py',
        language: 'python',
        content: `# MeanReversion_BTC • v2.1
from qslate import Strategy, Order
from indicators import bollinger_bands, rsi

class MeanReversionBTC(Strategy):
    symbol = "BTC"
    timeframe = "1h"
    risk_per_trade = 0.015

    def on_bar(self, bar):
        upper, mid, lower = bollinger_bands(self.close, 20, 2.0)
        osc = rsi(self.close, 14)

        if self.close[-1] < lower[-1] and osc[-1] < 30 and not self.position:
            size = (self.equity * self.risk_per_trade) / (self.close[-1] * 0.02)
            self.submit(Order.market("BUY", size))

        elif self.close[-1] >= mid[-1] and self.position:
            self.close_position(reason="mean_reverted")
`,
      },
      'indicators.py': {
        name: 'indicators.py',
        language: 'python',
        content: `# indicators.py • Volatility and momentum helpers
import numpy as np

def bollinger_bands(series, period: int = 20, num_std: float = 2.0):
    mid = series.rolling(period).mean()
    std = series.rolling(period).std()
    return mid + (std * num_std), mid, mid - (std * num_std)

def rsi(series, period: int = 14):
    delta = series.diff()
    gain = (delta.where(delta > 0, 0)).rolling(period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(period).mean()
    rs = gain / (loss + 1e-9)
    return 100 - (100 / (1 + rs))
`,
      },
      'config.json': {
        name: 'config.json',
        language: 'json',
        content: `{
  "strategy_id": "mean-reversion-btc-1h",
  "version": "2.1.0",
  "engine": "qslate-polars-rust-v1",
  "sandbox": "gVisor-runsc",
  "capital": 100000,
  "currency": "USDT",
  "slippage_bps": 2.0,
  "risk_limits": {
    "max_drawdown_limit": 0.10,
    "max_leverage": 2.0
  }
}
`,
      },
    },
  },
  'trend-following': {
    id: 'trend-following',
    name: 'TrendFollowing ES 15m',
    filename: 'TrendFollowing_ES.py',
    version: 'v1.4',
    author: 'Sarah Lin, CFA',
    timeframe: '15m',
    asset: 'ES1!',
    description:
      'Multi-timeframe Donchian channel trend breakout with volatility position sizing.',
    files: {
      'strategy.py': {
        name: 'strategy.py',
        language: 'python',
        content: `# TrendFollowing_ES • v1.4
from qslate import Strategy, Order
from indicators import atr

class TrendFollowingES(Strategy):
    symbol = "ES1!"
    timeframe = "15m"

    def on_bar(self, bar):
        high_20 = self.high.rolling(20).max()
        low_10 = self.low.rolling(10).min()
        vol = atr(self.data, 20)

        if self.close[-1] > high_20[-2] and not self.position:
            size = max(1, int(self.equity * 0.01 / (vol[-1] * 50)))
            self.submit(Order.market("BUY", size))

        elif self.close[-1] < low_10[-2] and self.position:
            self.close_position(reason="channel_exit")
`,
      },
      'indicators.py': {
        name: 'indicators.py',
        language: 'python',
        content: `# indicators.py • Trend helpers
import numpy as np

def atr(df, period: int = 14):
    high = df['high']
    low = df['low']
    close = df['close'].shift(1)
    tr = np.maximum(high - low, np.maximum(np.abs(high - close), np.abs(low - close)))
    return tr.rolling(period).mean().bfill()
`,
      },
      'config.json': {
        name: 'config.json',
        language: 'json',
        content: `{
  "strategy_id": "trend-following-es-15m",
  "version": "1.4.0",
  "engine": "qslate-polars-rust-v1",
  "sandbox": "gVisor-runsc",
  "capital": 250000,
  "currency": "USD",
  "slippage_bps": 0.5,
  "risk_limits": {
    "max_drawdown_limit": 0.08,
    "max_leverage": 3.0
  }
}
`,
      },
    },
  },
};
