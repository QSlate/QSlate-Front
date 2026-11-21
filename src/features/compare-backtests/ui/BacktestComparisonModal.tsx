'use client';

import {
  AlertCircle,
  ArrowRight,
  BarChart2,
  GitCompare,
  LineChart,
  Loader2,
  TrendingUp,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuthStore } from '@/entities/user/model';
import { apiClient, type BacktestComparisonItem } from '@/shared/api';
import { useAppearance } from '@/shared/theme';

export interface EquityPoint {
  timestamp?: string | number;
  equity: number;
}

export interface BacktestComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRunIds: string[];
  onSelectRun?: (runId: string) => void;
}

interface RunData {
  id: string;
  summary: BacktestComparisonItem | null;
  equityCurve: EquityPoint[];
}

const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#ec4899', // pink
];

function computeCorrelation(seriesA: number[], seriesB: number[]): number {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 1.0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += seriesA[i] ?? 0;
    sumB += seriesB[i] ?? 0;
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const diffA = (seriesA[i] ?? 0) - meanA;
    const diffB = (seriesB[i] ?? 0) - meanB;
    num += diffA * diffB;
    denA += diffA * diffA;
    denB += diffB * diffB;
  }
  if (denA === 0 || denB === 0) return 0;
  return Number((num / Math.sqrt(denA * denB)).toFixed(2));
}

export function BacktestComparisonModal({
  isOpen,
  onClose,
  selectedRunIds,
  onSelectRun,
}: BacktestComparisonModalProps) {
  const { theme } = useAppearance();
  const isLight = theme === 'light';
  const accessToken = useAuthStore((state) => state.accessToken);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runsData, setRunsData] = useState<RunData[]>([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // ESC to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const fetchComparison = useCallback(async () => {
    if (!isOpen || selectedRunIds.length < 2) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch backend comparative summaries via POST /qslate/v1/backtests/compare
      const compRes = await apiClient.compareBacktests(
        selectedRunIds,
        accessToken ?? undefined
      );

      const summaryMap = new Map<string, BacktestComparisonItem>();
      (compRes.summaries || []).forEach((item) => {
        summaryMap.set(item.backtest_id, item);
      });

      // 2. In parallel fetch real equity curves
      const curves = await Promise.allSettled(
        selectedRunIds.map(async (id) => {
          try {
            const page = await apiClient.getBacktestEquityCurve<EquityPoint>(
              id,
              undefined,
              accessToken ?? undefined
            );
            return { id, pts: page.items || [] };
          } catch {
            return { id, pts: [] };
          }
        })
      );

      const curveMap = new Map<string, EquityPoint[]>();
      curves.forEach((res) => {
        if (res.status === 'fulfilled') {
          curveMap.set(res.value.id, res.value.pts);
        }
      });

      const assembled: RunData[] = selectedRunIds.map((id) => ({
        id,
        summary: summaryMap.get(id) || null,
        equityCurve: curveMap.get(id) || [],
      }));

      if (isMounted.current) {
        setRunsData(assembled);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(
          err instanceof Error ? err.message : 'Failed to load comparison data'
        );
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isOpen, selectedRunIds, accessToken]);

  useEffect(() => {
    if (isOpen) {
      void fetchComparison();
    }
  }, [isOpen, fetchComparison]);

  // Compute normalized returns series for each run
  const normalizedCurves = useMemo(() => {
    return runsData.map((rd, idx) => {
      const pts = rd.equityCurve;
      if (!pts || pts.length === 0) {
        return {
          id: rd.id,
          color: PALETTE[idx % PALETTE.length],
          normalized: [] as { x: number; y: number }[],
        };
      }
      const initial = pts[0]?.equity || 100000;
      const normalized = pts.map((pt, pIdx) => ({
        x: pIdx,
        y: ((pt.equity - initial) / initial) * 100,
      }));
      return {
        id: rd.id,
        color: PALETTE[idx % PALETTE.length],
        normalized,
      };
    });
  }, [runsData]);

  // Compute SVG chart viewBox bounds
  const chartBounds = useMemo(() => {
    let minY = 0;
    let maxY = 1;
    let maxX = 1;

    normalizedCurves.forEach((c) => {
      c.normalized.forEach((pt) => {
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
        if (pt.x > maxX) maxX = pt.x;
      });
    });

    const paddingY = Math.max((maxY - minY) * 0.1, 2);
    return {
      minY: minY - paddingY,
      maxY: maxY + paddingY,
      maxX: Math.max(maxX, 1),
    };
  }, [normalizedCurves]);

  // Compute correlation matrix between runs
  const correlationMatrix = useMemo(() => {
    const matrix: { runA: string; runB: string; value: number }[] = [];
    runsData.forEach((a) => {
      const returnsA = a.equityCurve.map((pt, i, arr) =>
        i === 0
          ? 0
          : (pt.equity - (arr[i - 1]?.equity ?? pt.equity)) /
            (arr[i - 1]?.equity || 1)
      );
      runsData.forEach((b) => {
        const returnsB = b.equityCurve.map((pt, i, arr) =>
          i === 0
            ? 0
            : (pt.equity - (arr[i - 1]?.equity ?? pt.equity)) /
              (arr[i - 1]?.equity || 1)
        );
        matrix.push({
          runA: a.id,
          runB: b.id,
          value: a.id === b.id ? 1.0 : computeCorrelation(returnsA, returnsB),
        });
      });
    });
    return matrix;
  }, [runsData]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-zinc-200 text-zinc-900'
            : 'bg-[#0f1115] border-[#242528] text-zinc-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b font-mono text-xs ${
            isLight
              ? 'border-zinc-200 bg-zinc-50'
              : 'border-[#242528] bg-[#0c0d10]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-600/10 text-blue-500">
              <GitCompare size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-semibold text-base">
                  Backtest Run Comparison
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {selectedRunIds.length} RUNS ALIGNED
                </span>
              </div>
              <p className="text-zinc-500 text-xs font-sans">
                Side-by-side performance analytics, synchronized equity curves,
                and risk differentials.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg border transition-colors ${
              isLight
                ? 'border-zinc-200 hover:bg-zinc-200 text-zinc-600'
                : 'border-white/10 hover:bg-white/10 text-zinc-400'
            }`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-500">
              <Loader2 size={28} className="animate-spin text-blue-500" />
              <span className="font-mono text-xs">
                Querying comparative analytics from Go Lab microservice...
              </span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-xs font-mono">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <>
              {/* Section 1: Normalized Multi-Curve Equity Chart */}
              <div
                className={`p-4 rounded-xl border transition-colors ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200'
                    : 'bg-[#14161b] border-[#242528]'
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <LineChart size={14} className="text-blue-500" />
                    <span className="font-semibold font-sans text-sm">
                      Normalized Cumulative Return Overlay
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {runsData.map((rd, i) => (
                      <div
                        key={rd.id}
                        className="flex items-center gap-1.5 text-[11px]"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: PALETTE[i % PALETTE.length],
                          }}
                        />
                        <span className="text-zinc-400">
                          {rd.id.length > 8 ? `${rd.id.slice(0, 8)}…` : rd.id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SVG Line Chart */}
                <div className="w-full h-56 relative border-t border-b border-zinc-500/10 py-2">
                  <svg
                    className="w-full h-full overflow-visible"
                    viewBox={`0 0 800 200`}
                    preserveAspectRatio="none"
                  >
                    {/* Horizontal 0% Reference Line */}
                    {chartBounds.minY < 0 && chartBounds.maxY > 0 && (
                      <line
                        x1="0"
                        x2="800"
                        y1={
                          200 -
                          ((0 - chartBounds.minY) /
                            (chartBounds.maxY - chartBounds.minY)) *
                            200
                        }
                        y2={
                          200 -
                          ((0 - chartBounds.minY) /
                            (chartBounds.maxY - chartBounds.minY)) *
                            200
                        }
                        stroke="rgba(255,255,255,0.15)"
                        strokeDasharray="4 4"
                      />
                    )}

                    {/* Polyline per run */}
                    {normalizedCurves.map((curve) => {
                      if (curve.normalized.length < 2) return null;
                      const points = curve.normalized
                        .map((pt) => {
                          const x = (pt.x / chartBounds.maxX) * 800;
                          const y =
                            200 -
                            ((pt.y - chartBounds.minY) /
                              (chartBounds.maxY - chartBounds.minY)) *
                              200;
                          return `${x},${y}`;
                        })
                        .join(' ');

                      return (
                        <polyline
                          key={curve.id}
                          fill="none"
                          stroke={curve.color}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                      );
                    })}
                  </svg>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-zinc-500 mt-2">
                  <span>Start (T=0)</span>
                  <span>Normalized Base = 0%</span>
                  <span>End (T=Max)</span>
                </div>
              </div>

              {/* Section 2: Executive Risk Differentials Table */}
              <div
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isLight
                    ? 'border-zinc-200 bg-white'
                    : 'border-[#242528] bg-[#14161b]'
                }`}
              >
                <div
                  className={`px-4 py-3 border-b flex items-center justify-between text-xs font-mono ${
                    isLight
                      ? 'bg-zinc-50 border-zinc-200'
                      : 'bg-[#0f1115] border-[#242528]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 size={14} className="text-emerald-500" />
                    <span className="font-semibold font-sans text-sm">
                      Risk & Return Differentials Matrix
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Highest Sharpe / Return highlighted
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead
                      className={`border-b text-[10px] uppercase tracking-wider ${
                        isLight
                          ? 'bg-zinc-100/60 border-zinc-200 text-zinc-600'
                          : 'bg-[#0a0b0d] border-[#242528] text-zinc-400'
                      }`}
                    >
                      <tr>
                        <th className="py-2.5 px-4 font-medium">Metric</th>
                        {runsData.map((rd, i) => (
                          <th key={rd.id} className="py-2.5 px-4 font-medium">
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1.5"
                              style={{
                                backgroundColor: PALETTE[i % PALETTE.length],
                              }}
                            />
                            {rd.id.length > 10
                              ? `${rd.id.slice(0, 8)}…`
                              : rd.id}
                          </th>
                        ))}
                        <th className="py-2.5 px-4 font-medium text-right">
                          Spread (Delta)
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isLight
                          ? 'divide-zinc-200 text-zinc-700'
                          : 'divide-white/[0.04] text-zinc-300'
                      }`}
                    >
                      {/* Total Return */}
                      <tr>
                        <td className="py-3 px-4 font-semibold text-zinc-400">
                          Total Return
                        </td>
                        {runsData.map((rd) => {
                          const val = rd.summary?.metrics.total_return;
                          return (
                            <td key={rd.id} className="py-3 px-4 tabular-nums">
                              {val != null ? (
                                <span
                                  className={
                                    val >= 0
                                      ? 'text-emerald-400 font-semibold'
                                      : 'text-red-400 font-semibold'
                                  }
                                >
                                  {(val * 100).toFixed(2)}%
                                </span>
                              ) : (
                                'N/A'
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {(() => {
                            const vals = runsData
                              .map((r) => r.summary?.metrics.total_return)
                              .filter((v): v is number => v != null);
                            if (vals.length < 2) return '—';
                            const spread =
                              (Math.max(...vals) - Math.min(...vals)) * 100;
                            return `+${spread.toFixed(2)}%`;
                          })()}
                        </td>
                      </tr>

                      {/* Sharpe Ratio */}
                      <tr>
                        <td className="py-3 px-4 font-semibold text-zinc-400">
                          Sharpe Ratio
                        </td>
                        {runsData.map((rd) => {
                          const val = rd.summary?.metrics.sharpe_ratio;
                          return (
                            <td key={rd.id} className="py-3 px-4 tabular-nums">
                              {val != null ? (
                                <span
                                  className={
                                    val >= 1.5
                                      ? 'text-emerald-400 font-bold'
                                      : val > 0
                                        ? 'text-blue-400'
                                        : 'text-red-400'
                                  }
                                >
                                  {val.toFixed(2)}
                                </span>
                              ) : (
                                'N/A'
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {(() => {
                            const vals = runsData
                              .map((r) => r.summary?.metrics.sharpe_ratio)
                              .filter((v): v is number => v != null);
                            if (vals.length < 2) return '—';
                            return (
                              Math.max(...vals) - Math.min(...vals)
                            ).toFixed(2);
                          })()}
                        </td>
                      </tr>

                      {/* Max Drawdown */}
                      <tr>
                        <td className="py-3 px-4 font-semibold text-zinc-400">
                          Max Drawdown
                        </td>
                        {runsData.map((rd) => {
                          const val = rd.summary?.metrics.max_drawdown;
                          return (
                            <td key={rd.id} className="py-3 px-4 tabular-nums">
                              {val != null ? (
                                <span className="text-red-400">
                                  {(val * 100).toFixed(2)}%
                                </span>
                              ) : (
                                'N/A'
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {(() => {
                            const vals = runsData
                              .map((r) => r.summary?.metrics.max_drawdown)
                              .filter((v): v is number => v != null);
                            if (vals.length < 2) return '—';
                            const spread =
                              (Math.max(...vals) - Math.min(...vals)) * 100;
                            return `${spread.toFixed(2)}%`;
                          })()}
                        </td>
                      </tr>

                      {/* Win Rate */}
                      <tr>
                        <td className="py-3 px-4 font-semibold text-zinc-400">
                          Win Rate
                        </td>
                        {runsData.map((rd) => {
                          const val = rd.summary?.metrics.win_rate;
                          return (
                            <td key={rd.id} className="py-3 px-4 tabular-nums">
                              {val != null
                                ? `${(val * 100).toFixed(1)}%`
                                : 'N/A'}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {(() => {
                            const vals = runsData
                              .map((r) => r.summary?.metrics.win_rate)
                              .filter((v): v is number => v != null);
                            if (vals.length < 2) return '—';
                            const spread =
                              (Math.max(...vals) - Math.min(...vals)) * 100;
                            return `±${spread.toFixed(1)}%`;
                          })()}
                        </td>
                      </tr>

                      {/* Profit Factor */}
                      <tr>
                        <td className="py-3 px-4 font-semibold text-zinc-400">
                          Profit Factor
                        </td>
                        {runsData.map((rd) => {
                          const val = rd.summary?.metrics.profit_factor;
                          return (
                            <td key={rd.id} className="py-3 px-4 tabular-nums">
                              {val != null ? val.toFixed(2) : 'N/A'}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {(() => {
                            const vals = runsData
                              .map((r) => r.summary?.metrics.profit_factor)
                              .filter((v): v is number => v != null);
                            if (vals.length < 2) return '—';
                            return (
                              Math.max(...vals) - Math.min(...vals)
                            ).toFixed(2);
                          })()}
                        </td>
                      </tr>

                      {/* Total Trades */}
                      <tr>
                        <td className="py-3 px-4 font-semibold text-zinc-400">
                          Total Trades
                        </td>
                        {runsData.map((rd) => {
                          const val = rd.summary?.metrics.total_trades;
                          return (
                            <td key={rd.id} className="py-3 px-4 tabular-nums">
                              {val != null ? val : 'N/A'}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right tabular-nums text-zinc-400">
                          {(() => {
                            const vals = runsData
                              .map((r) => r.summary?.metrics.total_trades)
                              .filter((v): v is number => v != null);
                            if (vals.length < 2) return '—';
                            return Math.abs(
                              Math.max(...vals) - Math.min(...vals)
                            );
                          })()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 3: Return Correlation Coefficient Matrix */}
              <div
                className={`p-4 rounded-xl border transition-colors ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200'
                    : 'bg-[#14161b] border-[#242528]'
                }`}
              >
                <div className="flex items-center justify-between mb-3 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-purple-400" />
                    <span className="font-semibold font-sans text-sm">
                      Strategy Return Correlation Matrix
                    </span>
                  </div>
                  <span className="text-[11px] text-zinc-500">
                    Pearson r ∈ [-1.0, +1.0]
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {correlationMatrix.map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs font-mono flex flex-col justify-between ${
                        isLight
                          ? 'bg-white border-zinc-200'
                          : 'bg-[#0c0d10] border-[#242528]'
                      }`}
                    >
                      <div className="text-[10px] text-zinc-500 flex items-center justify-between">
                        <span>{item.runA.slice(0, 6)}</span>
                        <span>↔</span>
                        <span>{item.runB.slice(0, 6)}</span>
                      </div>
                      <div className="mt-2 text-base font-bold tabular-nums">
                        <span
                          className={
                            item.value >= 0.7
                              ? 'text-blue-400'
                              : item.value >= 0.3
                                ? 'text-emerald-400'
                                : item.value < 0
                                  ? 'text-amber-400'
                                  : 'text-zinc-300'
                          }
                        >
                          {item.value >= 0 ? `+${item.value}` : item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-t font-mono text-xs ${
            isLight
              ? 'border-zinc-200 bg-zinc-50'
              : 'border-[#242528] bg-[#0c0d10]'
          }`}
        >
          <span className="text-zinc-500">
            {selectedRunIds.length} simulations selected · Aligned with Go Lab
            engine
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg border font-medium transition-colors ${
                isLight
                  ? 'border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                  : 'border-white/10 hover:bg-white/10 text-zinc-300'
              }`}
            >
              Close
            </button>
            {onSelectRun && runsData.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onSelectRun(runsData[0]?.id ?? '');
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors shadow-sm"
              >
                <span>Load Run 1 in Lab</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
