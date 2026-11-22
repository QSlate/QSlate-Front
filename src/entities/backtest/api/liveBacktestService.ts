import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import {
  apiClient,
  ApiError,
  type BacktestJob,
  type BacktestRunPayload,
} from '@/shared/api';

import {
  type BacktestConfig,
  type BacktestResult,
  type BacktestService,
  type EquityPoint,
  type MonthlyReturn,
  type Trade,
} from '../model/types';

const DEFAULT_STRATEGY_ID = '6ABA8SdBPvDUzJS_GlWVp4CgP3NHjqecm5rZLuQaBXE';
const DEFAULT_VERSION_ID = 'Kazk9Z7E-NzcqT9_XM2Nl-8logVhbBsGuVcDeEPufYw';
const DEFAULT_DATASET_ID = 'binance-eth-4h';
const DEFAULT_DATASET_VERSION = 'v1';

const DEFAULT_STRATEGY_SOURCE = `from simulator import Strategy, Context


class RsiTrendStrategy(Strategy):
    """Example modular strategy using indicators, parameters, and stop management."""

    rsi_period: int = 14
    sma_period: int = 50
    rsi_oversold: float = 30.0
    rsi_overbought: float = 70.0
    allocation_usd: float = 1500.0
    stop_loss_pct: float = 2.0
    take_profit_pct: float = 5.0
    timeout_bars: int = 48

    def on_init(self, ctx: Context) -> None:
        pass

    def on_bar(self, ctx: Context) -> None:
        rsi_series = ctx.indicators.rsi(self.rsi_period)
        sma_series = ctx.indicators.sma(self.sma_period)

        if len(rsi_series) < max(self.rsi_period, self.sma_period) + 1:
            return

        current_rsi = rsi_series.iloc[-1]
        current_sma = sma_series.iloc[-1]
        current_price = ctx.price

        ctx.record(rsi_val=float(current_rsi), sma_val=float(current_sma))

        if not ctx.has_position:
            if current_rsi < self.rsi_oversold and current_price > current_sma:
                sl_price = current_price * (1.0 - self.stop_loss_pct / 100.0)
                tp_price = current_price * (1.0 + self.take_profit_pct / 100.0)
                ctx.buy(
                    usd_amount=self.allocation_usd,
                    stop_loss=sl_price,
                    take_profit=tp_price,
                    timeout_bars=self.timeout_bars,
                )
        elif ctx.has_position:
            if current_rsi > self.rsi_overbought:
                ctx.close_all(reason="RSI Overbought")

    def on_stop(self, ctx: Context) -> None:
        pass
`;

export class LiveBacktestService implements BacktestService {
  public async run(
    config: BacktestConfig,
    signal?: AbortSignal
  ): Promise<BacktestResult> {
    const token = useAuthStore.getState().accessToken ?? apiClient.getToken();
    const labState = useLabStore.getState();

    // Strategy parameters and version resolution
    let strategyId = labState.strategyId;
    let versionId = labState.versionId;

    if (token) {
      try {
        const userStrategies = await apiClient.getStrategies(
          { limit: 5 },
          token
        );
        if (userStrategies.items && userStrategies.items.length > 0) {
          const matching = userStrategies.items.find(
            (s) => s.id === strategyId
          );
          if (matching) {
            versionId = matching.version_id;
          } else {
            strategyId = userStrategies.items[0].id;
            versionId = userStrategies.items[0].version_id;
          }
          labState.setStrategyMeta({
            id: strategyId,
            version_id: versionId,
          });
        } else {
          const created = await apiClient.createStrategy(
            {
              name: 'RsiTrendStrategy',
              source: DEFAULT_STRATEGY_SOURCE,
              parameters: {
                rsi_period: 14,
                sma_period: 50,
                rsi_oversold: 30,
                rsi_overbought: 70,
                allocation_usd: 1500,
                stop_loss_pct: 2,
                take_profit_pct: 5,
                timeout_bars: 48,
              },
            },
            token
          );
          strategyId = created.id;
          versionId = created.version_id;
          labState.setStrategyMeta({
            id: strategyId,
            version_id: versionId,
          });
        }
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          useAuthStore.getState().clearAuth();
          throw new Error(
            'Session expirée ou non valide. Veuillez vous reconnecter pour exécuter ce backtest.'
          );
        }
        // fallback to default IDs
      }
    }

    strategyId = strategyId || DEFAULT_STRATEGY_ID;
    versionId = versionId || DEFAULT_VERSION_ID;
    const parameters = labState.activeStrategyParameters || {};

    const customDs = labState.selectedCustomDataset;
    const datasetId = customDs ? customDs.id : DEFAULT_DATASET_ID;
    const datasetVersionId = customDs
      ? customDs.version_id
      : DEFAULT_DATASET_VERSION;

    const payload: BacktestRunPayload = {
      strategy_id: strategyId,
      strategy_version_id: versionId,
      dataset_id: datasetId,
      dataset_version_id: datasetVersionId,
      initial_capital: String(config.capital),
      parameters,
      window: 20,
    };

    let job: BacktestJob;
    try {
      job = await apiClient.runBacktest(payload, undefined, token);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        useAuthStore.getState().clearAuth();
        throw new Error(
          'Session expirée ou non valide. Veuillez vous reconnecter pour exécuter ce backtest.'
        );
      }
      const message =
        err instanceof Error
          ? err.message
          : 'Erreur lors du lancement du backtest sur le serveur';
      throw new Error(message);
    }

    if (signal?.aborted) {
      await apiClient.cancelBacktest(job.backtest_id, token).catch(() => {});
      throw new DOMException('Backtest was cancelled by user', 'AbortError');
    }

    // Set active backtest ID in store for live logs streaming
    labState.setLoadedBacktestId(job.backtest_id);

    // Poll status until completion or failure
    const startTime = Date.now();
    const TIMEOUT_MS = 60_000;

    while (Date.now() - startTime < TIMEOUT_MS) {
      if (signal?.aborted) {
        await apiClient.cancelBacktest(job.backtest_id, token).catch(() => {});
        throw new DOMException('Backtest was cancelled by user', 'AbortError');
      }

      await new Promise((resolve) => setTimeout(resolve, 400));

      try {
        job = await apiClient.getBacktestStatus(job.backtest_id, token);
      } catch {
        // If status poll fails, continue next cycle
        continue;
      }

      if (job.status === 'completed') {
        break;
      }

      if (job.status === 'failed' || job.status === 'cancelled') {
        throw new Error(
          job.error || `Backtest failed with status ${job.status}`
        );
      }
    }

    if (job.status !== 'completed') {
      throw new Error('Backtest execution timed out');
    }

    return await fetchBacktestArtifacts(job.backtest_id, config, token);
  }
}

export async function fetchBacktestArtifacts(
  backtestId: string,
  config: BacktestConfig,
  token?: string | null
): Promise<BacktestResult> {
  // Fetch summary metrics, trades and equity curve
  const [summaryRes, tradesRes, equityRes] = await Promise.allSettled([
    apiClient.getBacktestSummary(backtestId, token),
    apiClient.getBacktestTrades(backtestId, { limit: 100 }, token),
    apiClient.getBacktestEquityCurve(backtestId, undefined, token),
  ]);

  const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
  const tradesPage = tradesRes.status === 'fulfilled' ? tradesRes.value : null;
  const equityPage = equityRes.status === 'fulfilled' ? equityRes.value : null;

  const metrics = summary?.metrics || {};

  // Transform backend trades to frontend Trade schema
  const rawTrades = Array.isArray(tradesPage?.items)
    ? (tradesPage.items as Record<string, unknown>[])
    : [];
  const trades: Trade[] = rawTrades.map((t, index) => ({
    id: String(t.id || `trade-${index + 1}`),
    timestamp: t.timestamp
      ? new Date(String(t.timestamp)).getTime() / 1000
      : Date.now() / 1000 - (rawTrades.length - index) * 3600,
    ticker: String(t.symbol || 'ETH'),
    side: (String(t.side || 'BUY').toUpperCase() === 'SELL'
      ? 'SELL'
      : 'BUY') as 'BUY' | 'SELL',
    quantity: Number(t.quantity || t.amount || 1),
    entry: Number(t.entry_price || t.price || 2200),
    exit: Number(t.exit_price || t.entry_price || 2250),
    pnl: Number(t.pnl_usd || t.pnl || 0),
    pnlPercent: Number(t.pnl_pct || t.pnl_percent || 0),
    slippageMs: Number(t.slippage_ms || 0.4),
    executionHash: String(
      t.execution_hash || `0x${(index * 7919).toString(16).padStart(8, '0')}`
    ),
  }));

  // Transform backend equity points or synthesize from start to end
  const rawEquity = Array.isArray(equityPage?.items)
    ? (equityPage.items as Record<string, unknown>[])
    : [];
  const parsedEquity: EquityPoint[] =
    rawEquity.length > 0
      ? rawEquity
          .map((p) => {
            const parsedTime =
              typeof p.time === 'number'
                ? p.time
                : Math.floor(
                    new Date(String(p.timestamp || p.time)).getTime() / 1000
                  );
            const nav = Number(p.nav || p.equity || config.capital);
            const benchmark = Number(p.benchmark || config.capital);
            return {
              time: Number.isFinite(parsedTime) ? parsedTime : 0,
              nav: Number.isFinite(nav) ? nav : config.capital,
              benchmark: Number.isFinite(benchmark)
                ? benchmark
                : config.capital,
            };
          })
          .filter((p) => p.time > 0)
      : [];

  const equity: EquityPoint[] = parsedEquity;

  return {
    id: backtestId,
    source: 'backend',
    config,
    equity,
    monthlyReturns: computeMonthlyReturns(equity),
    trades,
    metrics: {
      sharpe: Number(metrics.sharpe_ratio ?? 0),
      sortino: Number(metrics.sortino_ratio ?? 0),
      maxDrawdown: Number(metrics.max_drawdown_pct ?? 0),
      winRate: Number(metrics.win_rate_pct ?? 0),
      profitFactor:
        metrics.profit_factor !== undefined
          ? Number(metrics.profit_factor)
          : null,
      calmar:
        metrics.calmar_ratio !== undefined
          ? Number(metrics.calmar_ratio)
          : null,
      volatility: Number(metrics.volatility ?? 0),
      beta: Number(metrics.beta ?? 0),
      alpha: Number(metrics.alpha ?? 0),
      trades: Number(metrics.total_trades ?? trades.length),
    },
    oosReturn: Number(metrics.return_pct ?? 0),
    longestDrawdownDays: Number(metrics.max_drawdown_days ?? 0),
  };
}

export function computeMonthlyReturns(equity: EquityPoint[]): MonthlyReturn[] {
  if (!equity || equity.length < 2) return [];
  const monthlyBuckets = new Map<
    string,
    { firstNav: number; lastNav: number }
  >();
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  for (const pt of equity) {
    if (!pt || !Number.isFinite(pt.time) || !Number.isFinite(pt.nav)) continue;
    const date = new Date(pt.time * 1000);
    const key = `${monthNames[date.getUTCMonth()]} ${String(date.getUTCFullYear()).slice(-2)}`;
    const existing = monthlyBuckets.get(key);
    if (!existing) {
      monthlyBuckets.set(key, { firstNav: pt.nav, lastNav: pt.nav });
    } else {
      existing.lastNav = pt.nav;
    }
  }
  const results: MonthlyReturn[] = [];
  for (const [month, { firstNav, lastNav }] of monthlyBuckets.entries()) {
    const retPct = firstNav > 0 ? ((lastNav - firstNav) / firstNav) * 100 : 0;
    results.push({ month, value: Number(retPct.toFixed(2)) });
  }
  return results;
}

export const liveBacktestService = new LiveBacktestService();
