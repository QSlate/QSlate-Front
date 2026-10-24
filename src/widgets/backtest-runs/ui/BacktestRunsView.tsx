'use client';

import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
} from 'lucide-react';

import { useLabStore } from '@/features/lab-state';
import { useAppearance } from '@/shared/theme';

const MOCK_RUNS = [
  {
    id: 'run-9021',
    strategy: 'Momentum_ETH_4h.py · v3.2',
    date: '2026-06-30 16:04:12',
    sharpe: 2.41,
    returnPct: '+29.2%',
    drawdown: '-8.7%',
    trades: 1284,
    status: 'Optimal',
    hash: '0x992b8d4f',
  },
  {
    id: 'run-9020',
    strategy: 'Momentum_ETH_4h.py · v3.1',
    date: '2026-06-29 11:15:30',
    sharpe: 2.18,
    returnPct: '+24.8%',
    drawdown: '-11.2%',
    trades: 1190,
    status: 'Completed',
    hash: '0x71a2c309',
  },
  {
    id: 'run-9019',
    strategy: 'Vol_Breakout_BTC_1h.py · v2.1',
    date: '2026-06-27 18:32:00',
    sharpe: 1.94,
    returnPct: '+35.1%',
    drawdown: '-14.6%',
    trades: 842,
    status: 'Completed',
    hash: '0x43ffb91a',
  },
  {
    id: 'run-9018',
    strategy: 'StatArb_ES_NQ_15m.py · v4.0',
    date: '2026-06-25 09:20:44',
    sharpe: 2.85,
    returnPct: '+18.4%',
    drawdown: '-4.9%',
    trades: 2450,
    status: 'Optimal',
    hash: '0xfa1209cc',
  },
  {
    id: 'run-9017',
    strategy: 'MeanReversion_ETH_15m.py · test',
    date: '2026-06-22 14:10:19',
    sharpe: 0.82,
    returnPct: '+3.2%',
    drawdown: '-18.9%',
    trades: 410,
    status: 'Completed',
    hash: '0x098bc1ef',
  },
];

export function BacktestRunsView() {
  const showToast = useLabStore((state) => state.showToast);
  const { theme } = useAppearance();
  const isLight = theme === 'light';

  const handleExport = (format: string) => {
    showToast(`Exported runs log to ${format.toUpperCase()}`, 'success');
  };

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto select-none transition-colors duration-200">
      {/* Header */}
      <div
        className={`flex items-center justify-between pb-3 mb-4 border-b text-xs font-mono transition-colors ${
          isLight ? 'border-zinc-200' : 'border-[#242528]'
        }`}
      >
        <div className="flex items-center gap-3">
          <History size={16} className="text-blue-500" />
          <h1
            className={`font-sans font-semibold text-sm ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            Backtest Execution History
          </h1>
          <span className="text-zinc-500">· 5 historical runs logged</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
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
            onClick={() => handleExport('parquet')}
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

      {/* Table */}
      <div
        className={`w-full rounded-xl border overflow-hidden transition-colors ${
          isLight
            ? 'border-zinc-200 bg-white shadow-sm'
            : 'border-[#242528] bg-[#0c0d0e] shadow-lg'
        }`}
      >
        <table className="w-full text-left text-xs font-mono">
          <thead
            className={`border-b text-[10px] uppercase tracking-wider ${
              isLight
                ? 'bg-zinc-50 border-zinc-200 text-zinc-600'
                : 'bg-[#08090a] border-[#242528] text-zinc-400'
            }`}
          >
            <tr>
              <th className="py-2.5 px-4 font-medium">Run ID</th>
              <th className="py-2.5 px-4 font-medium">Strategy</th>
              <th className="py-2.5 px-4 font-medium">Timestamp</th>
              <th className="py-2.5 px-4 font-medium">Sharpe</th>
              <th className="py-2.5 px-4 font-medium">Return</th>
              <th className="py-2.5 px-4 font-medium">Max Drawdown</th>
              <th className="py-2.5 px-4 font-medium">Trades</th>
              <th className="py-2.5 px-4 font-medium">Status</th>
              <th className="py-2.5 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isLight
                ? 'divide-zinc-100 text-zinc-700'
                : 'divide-white/[0.04] text-zinc-300'
            }`}
          >
            {MOCK_RUNS.map((run) => (
              <tr
                key={run.id}
                className={`transition-colors ${
                  isLight ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.02]'
                }`}
              >
                <td
                  className={`py-3 px-4 font-bold ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  {run.id}
                </td>
                <td className="py-3 px-4 text-blue-500 font-sans font-medium">
                  {run.strategy}
                </td>
                <td className="py-3 px-4 text-zinc-500 tabular-nums">
                  {run.date}
                </td>
                <td className="py-3 px-4 font-bold text-emerald-500 tabular-nums">
                  {run.sharpe.toFixed(2)}
                </td>
                <td className="py-3 px-4 font-bold text-emerald-500 tabular-nums">
                  {run.returnPct}
                </td>
                <td className="py-3 px-4 font-bold text-rose-500 tabular-nums">
                  {run.drawdown}
                </td>
                <td className="py-3 px-4 tabular-nums">
                  {run.trades.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${
                      run.status === 'Optimal'
                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                    }`}
                  >
                    <CheckCircle2 size={10} />
                    {run.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    type="button"
                    onClick={() =>
                      showToast(`Loaded artifacts for ${run.id}`, 'info')
                    }
                    className={`px-2 py-1 rounded border text-[11px] transition-colors inline-flex items-center gap-1 ${
                      isLight
                        ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-200'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.06]'
                    }`}
                  >
                    <span>Load</span>
                    <ArrowUpRight size={11} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
