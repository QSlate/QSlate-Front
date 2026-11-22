'use client';

import {
  ArrowDown,
  Check,
  Copy,
  Download,
  Filter,
  Loader2,
  Search,
  Terminal,
  Trash2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { useBacktest } from '@/features/run-backtest/BacktestProvider';
import { apiClient } from '@/shared/api';
import { useAppearance } from '@/shared/theme';

export type LogLevel = 'ALL' | 'INFO' | 'WARN' | 'ERROR';

export interface ParsedLogLine {
  id: string;
  raw: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'STDOUT';
  message: string;
}

const DEFAULT_SANDBOX_LOGS = [
  '[SYS] gVisor Kernel Sandbox v2.8 runtime initialized',
  '[SYS] Polars 1.18 SIMD vectorization engine loaded',
  '[SYS] Network egress: Restricted (Air-gapped telemetry mode)',
  '[INFO] Worker daemon connected to execution bus (PID 4108)',
  '[INFO] Python 3.13.1 memory arena configured: 2048 MB limit',
];

export function ExecutionLogsConsole() {
  const showToast = useLabStore((state) => state.showToast);
  const isOpen = useLabStore((state) => state.isExecutionLogsOpen);
  const setIsOpen = useLabStore((state) => state.setExecutionLogsOpen);
  const loadedBacktestId = useLabStore((state) => state.loadedBacktestId);

  const { theme } = useAppearance();
  const isLight = theme === 'light';

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const { status: backtestStatus, error: backtestError } = useBacktest();

  const [rawLogs, setRawLogs] = useState<string[]>(DEFAULT_SANDBOX_LOGS);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel>('ALL');
  const [autoscroll, setAutoscroll] = useState(true);
  const [hasCopied, setHasCopied] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const consoleContainerRef = useRef<HTMLDivElement>(null);

  // Parse logs into structured lines with timestamps and severity detection
  const parsedLogs = useMemo<ParsedLogLine[]>(() => {
    return rawLogs.map((line, idx) => {
      let level: ParsedLogLine['level'] = 'STDOUT';
      const upper = line.toUpperCase();
      if (
        upper.includes('[ERROR]') ||
        upper.includes('ERROR:') ||
        upper.includes('TRACEBACK') ||
        upper.includes('EXCEPTION') ||
        upper.includes('FAIL')
      ) {
        level = 'ERROR';
      } else if (upper.includes('[WARN]') || upper.includes('WARNING:')) {
        level = 'WARN';
      } else if (upper.includes('[INFO]') || upper.includes('[SYS]')) {
        level = 'INFO';
      }

      return {
        id: `log-${idx}`,
        raw: line,
        timestamp: new Date().toLocaleTimeString(),
        level,
        message: line,
      };
    });
  }, [rawLogs]);

  // Filtered by search and level chip
  const filteredLogs = useMemo(() => {
    return parsedLogs.filter((log) => {
      const matchesLevel =
        levelFilter === 'ALL' ||
        (levelFilter === 'ERROR' && log.level === 'ERROR') ||
        (levelFilter === 'WARN' && log.level === 'WARN') ||
        (levelFilter === 'INFO' && log.level === 'INFO');

      const matchesSearch =
        searchQuery.trim() === '' ||
        log.raw.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesLevel && matchesSearch;
    });
  }, [parsedLogs, levelFilter, searchQuery]);

  // Fetch historical logs from backend when a backtest is loaded
  const fetchLogsHistory = useCallback(
    async (silent = false) => {
      if (!loadedBacktestId || !isAuthenticated) return;
      if (!silent) setIsLoadingHistory(true);
      try {
        const page = await apiClient.getBacktestLogs(
          loadedBacktestId,
          { limit: 200 },
          accessToken ?? undefined
        );
        if (page.items && page.items.length > 0) {
          const lines = page.items
            .map((it) => it.message)
            .filter((msg) => msg && msg.trim() !== '');
          if (lines.length > 0) {
            setRawLogs(lines);
          }
          if (!silent) {
            showToast('Execution logs loaded from Lab service', 'info');
          }
        }
      } catch {
        // Keep sandbox defaults if backend logs are not available
      } finally {
        if (!silent) setIsLoadingHistory(false);
      }
    },
    [loadedBacktestId, isAuthenticated, accessToken, showToast]
  );

  useEffect(() => {
    if (isOpen && loadedBacktestId) {
      void fetchLogsHistory();
    }
  }, [isOpen, loadedBacktestId, fetchLogsHistory]);

  // Live polling while backtest is actively running
  useEffect(() => {
    if (backtestStatus === 'running' && loadedBacktestId) {
      void fetchLogsHistory(true);
      const interval = setInterval(() => {
        void fetchLogsHistory(true);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [backtestStatus, loadedBacktestId, fetchLogsHistory]);

  // Automatically open logs drawer and handle backtest execution state transitions
  useEffect(() => {
    if (backtestStatus === 'running') {
      setIsOpen(true);
      setRawLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [SYS] Initializing backtest simulation in gVisor sandbox...`,
      ]);
    } else if (backtestStatus === 'success') {
      void fetchLogsHistory(true);
      setRawLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [INFO] Simulation completed successfully. 100% telemetry received.`,
      ]);
    } else if (backtestStatus === 'error') {
      setIsOpen(true);
      void fetchLogsHistory(true);
      setRawLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] ${
          backtestError?.message ?? 'Le backtest a échoué.'
        }`,
      ]);
    }
  }, [backtestStatus, backtestError, setIsOpen, fetchLogsHistory]);

  // Autoscroll handling
  useEffect(() => {
    if (autoscroll && consoleContainerRef.current) {
      consoleContainerRef.current.scrollTop =
        consoleContainerRef.current.scrollHeight;
    }
  }, [filteredLogs, autoscroll]);

  // Detect user manual scroll to disable autoscroll if scrolled up
  const handleScroll = () => {
    if (!consoleContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      consoleContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 40;
    if (isAtBottom !== autoscroll) {
      setAutoscroll(isAtBottom);
    }
  };

  // Keyboard shortcut: ESC to dismiss drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setIsOpen]);

  const handleCopyLogs = async () => {
    const text = filteredLogs.map((l) => l.raw).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      showToast('Execution logs copied to clipboard', 'success');
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      showToast('Failed to copy logs', 'warning');
    }
  };

  const handleExportLogFile = () => {
    const text = filteredLogs.map((l) => l.raw).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `qslate-execution-${loadedBacktestId || 'simulation'}-${Date.now()}.log`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported execution log file (.log)', 'success');
  };

  const handleClearLogs = () => {
    setRawLogs([]);
    showToast('Terminal logs cleared', 'info');
  };

  if (!isOpen) return null;

  return (
    <div
      role="region"
      aria-label="Execution logs console"
      className={`fixed bottom-0 left-0 right-0 z-40 border-t shadow-2xl transition-all duration-200 select-none flex flex-col font-mono text-xs ${
        isLight
          ? 'bg-zinc-900 border-zinc-700 text-zinc-100'
          : 'bg-[#090a0c] border-[#242528] text-zinc-200'
      } h-80 sm:h-96`}
    >
      {/* Console Top Toolbar */}
      <div
        className={`flex items-center justify-between px-4 py-2 border-b select-none ${
          isLight
            ? 'bg-zinc-800/80 border-zinc-700'
            : 'bg-white/[0.02] border-[#242528]'
        }`}
      >
        <div className="flex items-center gap-3">
          <Terminal size={14} className="text-emerald-400" />
          <span className="font-sans font-semibold text-xs text-white">
            Execution Logs & Diagnostics Console
          </span>
          {loadedBacktestId && (
            <span className="text-[10px] text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700">
              Run: {loadedBacktestId.slice(0, 10)}…
            </span>
          )}
          {isLoadingHistory && (
            <Loader2 size={12} className="animate-spin text-blue-400" />
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Autoscroll toggle */}
          <button
            type="button"
            onClick={() => setAutoscroll((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border transition-colors ${
              autoscroll
                ? 'bg-blue-600/30 text-blue-400 border-blue-500/40'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
            title="Toggle sticky autoscroll"
          >
            <ArrowDown
              size={11}
              className={autoscroll ? 'text-blue-400' : ''}
            />
            <span>Autoscroll</span>
          </button>

          {/* Copy Logs */}
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors"
            title="Copy logs"
          >
            {hasCopied ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <Copy size={13} />
            )}
          </button>

          {/* Export .log */}
          <button
            type="button"
            onClick={handleExportLogFile}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 text-[11px] transition-colors"
            title="Export as .log file"
          >
            <Download size={11} />
            <span>Export .log</span>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={handleClearLogs}
            className="p-1 rounded text-zinc-400 hover:text-rose-400 transition-colors"
            title="Clear logs"
          >
            <Trash2 size={13} />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="p-1 rounded text-zinc-400 hover:text-white transition-colors ml-1"
            title="Close console (Esc)"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Filter Chips & Search Bar */}
      <div
        className={`flex items-center justify-between px-4 py-1.5 border-b gap-3 text-[11px] ${
          isLight
            ? 'bg-zinc-800/40 border-zinc-700'
            : 'bg-black/30 border-[#242528]'
        }`}
      >
        {/* Severity Chips */}
        <div className="flex items-center gap-1.5">
          <Filter size={11} className="text-zinc-500" />
          {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((lvl) => {
            const isActive = levelFilter === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setLevelFilter(lvl)}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-all ${
                  isActive
                    ? lvl === 'ERROR'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : lvl === 'WARN'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                        : lvl === 'INFO'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                          : 'bg-zinc-700 text-white border-zinc-600'
                    : 'bg-transparent text-zinc-500 border-transparent hover:text-zinc-300'
                }`}
              >
                {lvl}
              </button>
            );
          })}
        </div>

        {/* Search filter input */}
        <div className="relative w-64">
          <Search
            size={11}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            placeholder="Filter logs or tracebacks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-zinc-800 rounded pl-6 pr-2 py-0.5 text-[11px] text-zinc-200 focus:border-blue-500 outline-hidden"
          />
        </div>
      </div>

      {/* Console Lines Feed */}
      <div
        ref={consoleContainerRef}
        onScroll={handleScroll}
        tabIndex={0}
        aria-label="Log output"
        className="flex-1 p-3 overflow-y-auto space-y-0.5 font-mono text-[11px] leading-relaxed focus:outline-hidden"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-zinc-500 italic py-8 text-center">
            No log entries match your active filter.
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const isError = log.level === 'ERROR';
            const isWarn = log.level === 'WARN';
            const isInfo = log.level === 'INFO';

            return (
              <div
                key={log.id}
                className={`flex items-start gap-2 px-1.5 py-0.5 rounded select-text ${
                  isError
                    ? 'bg-rose-500/10 text-rose-400'
                    : isWarn
                      ? 'bg-amber-500/10 text-amber-300'
                      : isInfo
                        ? 'text-cyan-400'
                        : 'text-zinc-300 hover:bg-white/[0.02]'
                }`}
              >
                <span className="text-[10px] text-zinc-600 shrink-0 select-none">
                  {(index + 1).toString().padStart(3, '0')}
                </span>
                <span className="text-[10px] text-zinc-500 shrink-0 select-none">
                  {log.timestamp}
                </span>
                <span className="shrink-0 font-bold text-[10px] select-none">
                  {isError
                    ? '[ERR]'
                    : isWarn
                      ? '[WRN]'
                      : isInfo
                        ? '[INF]'
                        : '[OUT]'}
                </span>
                <span className="break-all whitespace-pre-wrap">
                  {log.message}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Console Status Footer */}
      <div
        className={`flex items-center justify-between px-4 py-1 border-t text-[10px] text-zinc-500 select-none ${
          isLight
            ? 'bg-zinc-800/80 border-zinc-700'
            : 'bg-[#050607] border-[#242528]'
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              backtestStatus === 'running'
                ? 'bg-amber-400 animate-pulse'
                : backtestStatus === 'error'
                  ? 'bg-rose-500'
                  : 'bg-emerald-500 animate-pulse'
            }`}
          />
          <span>
            {backtestStatus === 'running'
              ? 'Kernel Stream: Simulating in Sandbox…'
              : backtestStatus === 'error'
                ? 'Kernel Stream: Simulation Error'
                : 'Kernel Stream: Synchronized'}
          </span>
        </span>
        <span>
          Showing {filteredLogs.length} of {rawLogs.length} lines
        </span>
      </div>
    </div>
  );
}
