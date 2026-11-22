'use client';

import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  GitCompare,
  History,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/entities/user/model';
import { BacktestComparisonModal } from '@/features/compare-backtests';
import { useLabStore } from '@/features/lab-state';
import {
  apiClient,
  type BacktestJob,
  type BacktestStatus,
  type BacktestSummary,
} from '@/shared/api';
import { useAppearance } from '@/shared/theme';

export function BacktestRunsView() {
  const router = useRouter();
  const showToast = useLabStore((state) => state.showToast);
  const setActiveTab = useLabStore((state) => state.setActiveTab);
  const setLoadedBacktestId = useLabStore((state) => state.setLoadedBacktestId);

  const { theme } = useAppearance();
  const isLight = theme === 'light';

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);

  const [runs, setRuns] = useState<BacktestJob[]>([]);
  const [summaries, setSummaries] = useState<Record<string, BacktestSummary>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BacktestStatus>(
    'all'
  );
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(
    undefined
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedRunIds, setSelectedRunIds] = useState<string[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const fetchRuns = useCallback(
    async (cursor?: string) => {
      if (!isAuthenticated) return;
      setIsLoading(true);
      try {
        const params: { limit?: number; cursor?: string } = { limit: 20 };
        if (cursor) params.cursor = cursor;
        const page = await apiClient.getBacktests(
          params,
          accessToken ?? undefined
        );
        setRuns(page.items || []);
        setNextCursor(page.next_cursor);

        // Fetch metrics summaries for completed runs in parallel
        const completedRuns = (page.items || []).filter(
          (j) => j.status === 'completed'
        );
        if (completedRuns.length > 0) {
          Promise.allSettled(
            completedRuns.map((r) =>
              apiClient.getBacktestSummary(
                r.backtest_id || (r as { id?: string }).id || '',
                accessToken ?? undefined
              )
            )
          ).then((results) => {
            const nextSummaries: Record<string, BacktestSummary> = {};
            results.forEach((res) => {
              if (res.status === 'fulfilled' && res.value) {
                nextSummaries[res.value.backtest_id] = res.value;
              }
            });
            setSummaries((prev) => ({ ...prev, ...nextSummaries }));
          });
        }
      } catch {
        showToast('Failed to load backtest runs', 'warning');
      } finally {
        setIsLoading(false);
      }
    },
    [isAuthenticated, accessToken, showToast]
  );

  useEffect(() => {
    fetchRuns(currentCursor);
  }, [fetchRuns, currentCursor]);

  const handleDeleteRun = async (backtestId: string) => {
    setDeletingId(backtestId);
    try {
      await apiClient.deleteBacktest(backtestId, accessToken ?? undefined);
      showToast('Backtest run deleted', 'info');
      setRuns((prev) =>
        prev.filter(
          (r) =>
            r.backtest_id !== backtestId &&
            (r as { id?: string }).id !== backtestId
        )
      );
    } catch {
      showToast('Failed to delete backtest run', 'warning');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadRun = (run: BacktestJob) => {
    const runId = run.backtest_id || (run as { id?: string }).id || '';
    setLoadedBacktestId(runId);
    showToast(`Loaded backtest ${runId} into Lab workspace`, 'success');
    setActiveTab('workspace');
    router.push('/lab');
  };

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorHistory((prev) => [...prev, currentCursor || '']);
      setCurrentCursor(nextCursor);
    }
  };

  const handlePrevPage = () => {
    if (cursorHistory.length > 0) {
      const prev = cursorHistory[cursorHistory.length - 1];
      setCursorHistory((prevList) => prevList.slice(0, -1));
      setCurrentCursor(prev || undefined);
    }
  };

  const handleExportCsv = () => {
    if (runs.length === 0) {
      showToast('No runs to export', 'warning');
      return;
    }
    const headers = [
      'Run ID',
      'Strategy',
      'Dataset',
      'Status',
      'Progress',
      'Created At',
      'Sharpe',
      'Return',
      'Drawdown',
    ];
    const rows = runs.map((r) => {
      const id = r.backtest_id || (r as { id?: string }).id || '';
      const summary = summaries[id]?.metrics;
      return [
        id,
        r.input?.strategy_name || r.input?.strategy_id || 'Default Strategy',
        r.input?.dataset_id || 'Default Dataset',
        r.status,
        `${r.progress}%`,
        r.created_at,
        summary?.sharpe_ratio != null ? summary.sharpe_ratio.toFixed(2) : 'N/A',
        summary?.total_return != null
          ? `${(summary.total_return * 100).toFixed(1)}%`
          : 'N/A',
        summary?.max_drawdown != null
          ? `${(summary.max_drawdown * 100).toFixed(1)}%`
          : 'N/A',
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `qslate-backtest-runs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported backtest runs to CSV', 'success');
  };

  const handleExportParquet = () => {
    showToast('Parquet export request queued with Lab worker', 'info');
  };

  // Filter runs based on search input and status tabs
  const filteredRuns = useMemo(() => {
    return runs.filter((run) => {
      const id = run.backtest_id || (run as { id?: string }).id || '';
      const stratName =
        run.input?.strategy_name || run.input?.strategy_id || '';
      const dataset = run.input?.dataset_id || '';

      const matchesSearch =
        searchQuery.trim() === '' ||
        id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stratName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || run.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [runs, searchQuery, statusFilter]);

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto select-none transition-colors duration-200">
      {/* Header */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b text-xs font-mono transition-colors ${
          isLight ? 'border-zinc-200' : 'border-[#242528]'
        }`}
      >
        <div className="flex items-center gap-3">
          <History size={16} className="text-blue-500" />
          <h2
            className={`font-sans font-semibold text-sm ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            Backtest Execution History
          </h2>
          <span className="text-zinc-500">
            · {filteredRuns.length} runs loaded
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsComparisonModalOpen(true)}
            disabled={selectedRunIds.length < 2 || selectedRunIds.length > 20}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-all ${
              selectedRunIds.length >= 2 && selectedRunIds.length <= 20
                ? 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-2xs cursor-pointer'
                : 'bg-white/[0.04] text-zinc-500 border-white/[0.06] opacity-60 cursor-not-allowed'
            }`}
            title={
              selectedRunIds.length < 2
                ? 'Select at least 2 runs below to compare'
                : `Compare ${selectedRunIds.length} runs`
            }
          >
            <GitCompare size={12} />
            <span>Compare Selected ({selectedRunIds.length})</span>
          </button>
          <button
            type="button"
            onClick={() => fetchRuns(currentCursor)}
            disabled={isLoading}
            className={`p-1.5 rounded border text-xs transition-colors ${
              isLight
                ? 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.06]'
            }`}
            title="Refresh runs"
          >
            <RefreshCw
              size={13}
              className={isLoading ? 'animate-spin text-blue-500' : ''}
            />
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors ${
              isLight
                ? 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-2xs'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.06]'
            }`}
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportParquet}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition-colors ${
              isLight
                ? 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200 shadow-2xs'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.06]'
            }`}
          >
            <FileSpreadsheet size={12} />
            <span>Export Parquet</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 text-xs font-mono">
        {/* Status Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'completed', label: 'Completed' },
              { id: 'running', label: 'Running' },
              { id: 'failed', label: 'Failed' },
              { id: 'cancelled', label: 'Cancelled' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-md border text-xs whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-500 font-medium shadow-xs'
                    : isLight
                      ? 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'
                      : 'bg-white/[0.02] text-zinc-400 border-white/[0.06] hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="text"
            placeholder="Search run, strategy, dataset..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 rounded-md border text-xs outline-hidden ${
              isLight
                ? 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500'
                : 'bg-[#111215] border-[#242528] text-white focus:border-blue-500'
            }`}
          />
        </div>
      </div>

      {/* Table Container */}
      <div
        className={`w-full rounded-xl border overflow-hidden transition-colors ${
          isLight
            ? 'border-zinc-200 bg-white shadow-sm'
            : 'border-[#242528] bg-[#0c0d0e] shadow-lg'
        }`}
      >
        {isLoading && runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-zinc-500 gap-2">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <span className="font-mono text-xs">
              Loading historical backtests from Go Lab service...
            </span>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <History size={28} className="text-zinc-500 mb-2" />
            <p
              className={`font-sans font-semibold text-sm mb-1 ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
            >
              No Backtest Runs Found
            </p>
            <p className="text-zinc-500 font-mono text-xs max-w-sm mb-4">
              {searchQuery || statusFilter !== 'all'
                ? 'No backtest runs match your active search or status filters.'
                : 'You have not executed any backtests yet. Launch your first simulation in the Lab.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('workspace');
                router.push('/lab');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-medium shadow-xs transition-colors"
            >
              <Play size={12} />
              <span>Launch First Backtest</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead
                className={`border-b text-[10px] uppercase tracking-wider ${
                  isLight
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-600'
                    : 'bg-[#08090a] border-[#242528] text-zinc-400'
                }`}
              >
                <tr>
                  <th className="py-2.5 px-3 w-8">
                    <input
                      type="checkbox"
                      aria-label="Select all runs"
                      checked={
                        filteredRuns.length > 0 &&
                        selectedRunIds.length === filteredRuns.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedRunIds(
                            filteredRuns.map(
                              (r) =>
                                r.backtest_id || (r as { id?: string }).id || ''
                            )
                          );
                        } else {
                          setSelectedRunIds([]);
                        }
                      }}
                      className="rounded border-zinc-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-4 font-medium">Run ID</th>
                  <th className="py-2.5 px-4 font-medium">
                    Strategy & Dataset
                  </th>
                  <th className="py-2.5 px-4 font-medium">Timestamp</th>
                  <th className="py-2.5 px-4 font-medium">Sharpe</th>
                  <th className="py-2.5 px-4 font-medium">Return</th>
                  <th className="py-2.5 px-4 font-medium">Max Drawdown</th>
                  <th className="py-2.5 px-4 font-medium">Trades</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                  <th className="py-2.5 px-4 font-medium text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody
                className={`divide-y ${
                  isLight
                    ? 'divide-zinc-100 text-zinc-700'
                    : 'divide-white/[0.04] text-zinc-300'
                }`}
              >
                {filteredRuns.map((run) => {
                  const id =
                    run.backtest_id || (run as { id?: string }).id || '';
                  const stratName =
                    run.input?.strategy_name ||
                    run.input?.strategy_id ||
                    'Strategy';
                  const dataset = run.input?.dataset_id || 'Market Dataset';
                  const summary = summaries[id]?.metrics;
                  const isDeleting = deletingId === id;

                  return (
                    <tr
                      key={id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3 px-3 w-8">
                        <input
                          type="checkbox"
                          aria-label={`Select run ${id}`}
                          checked={selectedRunIds.includes(id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedRunIds((prev) => [...prev, id]);
                            } else {
                              setSelectedRunIds((prev) =>
                                prev.filter((item) => item !== id)
                              );
                            }
                          }}
                          className="rounded border-zinc-500 cursor-pointer"
                        />
                      </td>
                      <td
                        className={`py-3 px-4 font-bold ${
                          isLight ? 'text-zinc-900' : 'text-white'
                        }`}
                      >
                        {id.length > 14 ? `${id.slice(0, 12)}…` : id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-sans font-medium text-blue-500">
                          {stratName}
                        </div>
                        <div className="text-[10px] text-zinc-500">
                          {dataset}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-zinc-500 tabular-nums whitespace-nowrap">
                        {run.created_at
                          ? new Date(run.created_at).toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-500 tabular-nums">
                        {summary?.sharpe_ratio != null
                          ? summary.sharpe_ratio.toFixed(2)
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-500 tabular-nums">
                        {summary?.total_return != null
                          ? `${(summary.total_return * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 font-bold text-rose-500 tabular-nums">
                        {summary?.max_drawdown != null
                          ? `${(summary.max_drawdown * 100).toFixed(1)}%`
                          : '—'}
                      </td>
                      <td className="py-3 px-4 tabular-nums">
                        {summary?.trades_count != null
                          ? summary.trades_count.toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        {run.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 size={10} />
                            Completed
                          </span>
                        ) : run.status === 'running' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border bg-blue-500/10 text-blue-400 border-blue-500/30">
                            <Loader2 size={10} className="animate-spin" />
                            Running ({run.progress}%)
                          </span>
                        ) : run.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border bg-rose-500/10 text-rose-400 border-rose-500/30">
                            <XCircle size={10} />
                            Failed
                          </span>
                        ) : run.status === 'cancelled' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                            <AlertCircle size={10} />
                            Cancelled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border bg-amber-500/10 text-amber-400 border-amber-500/30">
                            <Clock size={10} />
                            Queued
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleLoadRun(run)}
                            className={`px-2 py-1 rounded border text-[11px] transition-colors inline-flex items-center gap-1 ${
                              isLight
                                ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.06]'
                            }`}
                            title="Load into Lab workspace"
                          >
                            <span>Load</span>
                            <ArrowUpRight size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRun(id)}
                            disabled={isDeleting}
                            className={`p-1 rounded border transition-colors ${
                              isLight
                                ? 'bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border-zinc-200 hover:border-rose-300'
                                : 'bg-white/[0.03] hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border-white/[0.06] hover:border-rose-500/30'
                            }`}
                            title="Delete run"
                          >
                            {isDeleting ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div
          className={`flex items-center justify-between p-3 border-t text-xs font-mono ${
            isLight
              ? 'border-zinc-200 bg-zinc-50/50 text-zinc-600'
              : 'border-[#242528] bg-white/[0.01] text-zinc-400'
          }`}
        >
          <span>
            Showing {filteredRuns.length} of {runs.length} runs
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={cursorHistory.length === 0 || isLoading}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors disabled:opacity-40 ${
                isLight
                  ? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-zinc-300'
              }`}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={!nextCursor || isLoading}
              className={`px-2.5 py-1 rounded border text-[11px] transition-colors disabled:opacity-40 ${
                isLight
                  ? 'bg-white hover:bg-zinc-100 border-zinc-300 text-zinc-700'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] text-zinc-300'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      <BacktestComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        selectedRunIds={selectedRunIds}
        onSelectRun={(runId) => {
          const run = runs.find(
            (r) =>
              r.backtest_id === runId || (r as { id?: string }).id === runId
          );
          if (run) handleLoadRun(run);
        }}
      />
    </div>
  );
}
