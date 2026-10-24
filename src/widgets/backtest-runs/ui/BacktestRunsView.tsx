'use client';

import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  History,
} from 'lucide-react';

import { useLabStore } from '@/features/lab-state';

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

  const handleExport = (format: string) => {
    showToast(`Exported runs log to ${format.toUpperCase()}`, 'success');
  };

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#242528] text-xs font-mono">
        <div className="flex items-center gap-3">
          <History size={16} className="text-blue-400" />
          <h1 className="font-sans font-semibold text-sm text-white">
            Backtest Execution History
          </h1>
          <span className="text-zinc-500">· 5 historical runs logged</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] text-xs transition-colors"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('parquet')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.06] text-xs transition-colors"
          >
            <FileSpreadsheet size={12} />
            <span>Export Parquet</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full rounded-xl border border-[#242528] bg-[#0c0d0e] overflow-hidden shadow-lg">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#08090a] border-b border-[#242528] text-zinc-400 text-[10px] uppercase tracking-wider">
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
          <tbody className="divide-y divide-white/[0.04] text-zinc-300">
            {MOCK_RUNS.map((run) => (
              <tr
                key={run.id}
                className="hover:bg-white/[0.02] transition-colors"
              >
                <td className="py-3 px-4 font-bold text-white">{run.id}</td>
                <td className="py-3 px-4 text-blue-400 font-sans font-medium">
                  {run.strategy}
                </td>
                <td className="py-3 px-4 text-zinc-500 tabular-nums">
                  {run.date}
                </td>
                <td className="py-3 px-4 font-bold text-emerald-400 tabular-nums">
                  {run.sharpe.toFixed(2)}
                </td>
                <td className="py-3 px-4 font-bold text-emerald-400 tabular-nums">
                  {run.returnPct}
                </td>
                <td className="py-3 px-4 font-bold text-rose-400 tabular-nums">
                  {run.drawdown}
                </td>
                <td className="py-3 px-4 tabular-nums">
                  {run.trades.toLocaleString()}
                </td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] border ${
                      run.status === 'Optimal'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
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
                    className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.06] text-[11px] transition-colors inline-flex items-center gap-1"
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
