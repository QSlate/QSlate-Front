'use client';

import { Cpu } from 'lucide-react';

import { useUserStore } from '@/entities/user/model';
import { MOCK_VOLATILITY_BINS } from '@/entities/widget';
import { useHydratedStore } from '@/shared/lib/store';

export function VolatilityFilterWidget() {
  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const isColorblind = colorblind === 'orange-blue';

  const normalColor = isColorblind ? '#38BDF8' : '#10B981';
  const spikeColor = isColorblind ? '#F59E0B' : '#F43F5E';

  const maxCount = Math.max(...MOCK_VOLATILITY_BINS.map((b) => b.count));

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 select-none font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-zinc-400" />
          <span className="text-white font-medium">
            Regime Volatility Classifier
          </span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
            style={{
              borderColor: `${normalColor}40`,
              color: normalColor,
              backgroundColor: `${normalColor}15`,
            }}
          >
            State: Calm / Expansion
          </span>
        </div>
        <div className="text-[11px] text-zinc-400">
          Entropy Score:{' '}
          <span className="text-white font-bold tabular-nums">0.24 bits</span>
        </div>
      </div>

      {/* Histogram Bars */}
      <div className="flex items-end justify-between flex-1 min-h-[100px] gap-2 pt-2 pb-1 px-2">
        {MOCK_VOLATILITY_BINS.map((bin) => {
          const heightPct = Math.round((bin.count / maxCount) * 100);
          const barColor = bin.isRegimeSpike ? spikeColor : normalColor;

          return (
            <div
              key={bin.bin}
              className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 px-1.5 py-0.5 rounded text-[9px] border border-white/20 whitespace-nowrap pointer-events-none z-20">
                {bin.bin}: {bin.count} bars {bin.isRegimeSpike ? '(Spike)' : ''}
              </div>

              {/* Bar */}
              <div
                style={{
                  height: `${heightPct}%`,
                  backgroundColor: barColor,
                  opacity: bin.isRegimeSpike ? 0.95 : 0.6,
                }}
                className="w-full rounded-xs transition-all duration-200 group-hover:scale-105"
              />

              {/* Label */}
              <span className="text-[9px] text-zinc-500 mt-1 select-none font-mono truncate w-full text-center">
                {bin.bin}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend & Thresholds */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-[10px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-xs"
              style={{ backgroundColor: normalColor }}
            />
            <span>Normal Market Flow (HMM State 0)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-xs"
              style={{ backgroundColor: spikeColor }}
            />
            <span>Entropy Outlier Spike (HMM State 1)</span>
          </span>
        </div>
        <span className="text-zinc-500 font-mono">
          Cutoff: &gt;2.5σ Volatility
        </span>
      </div>

      {/* Screen reader table fallback */}
      <div
        className="sr-only"
        role="region"
        aria-label="Regime volatility classification histogram"
      >
        <table>
          <caption>Volatility Distribution and Regime Classifications</caption>
          <thead>
            <tr>
              <th scope="col">Bin</th>
              <th scope="col">Count</th>
              <th scope="col">Regime</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_VOLATILITY_BINS.map((row) => (
              <tr key={row.bin}>
                <td>{row.bin}</td>
                <td>{row.count}</td>
                <td>{row.isRegimeSpike ? 'Spike' : 'Normal'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
