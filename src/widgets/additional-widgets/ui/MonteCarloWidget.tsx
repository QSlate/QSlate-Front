'use client';

import { Activity } from 'lucide-react';
import { useMemo, useState } from 'react';

import { useUserStore } from '@/entities/user/model';
import { MOCK_MONTE_CARLO_SERIES } from '@/entities/widget';
import { useHydratedStore } from '@/shared/lib/store';

export function MonteCarloWidget() {
  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const isColorblind = colorblind === 'orange-blue';

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activePoint =
    hoverIndex !== null
      ? MOCK_MONTE_CARLO_SERIES[hoverIndex]
      : MOCK_MONTE_CARLO_SERIES[MOCK_MONTE_CARLO_SERIES.length - 1];

  const upColor = isColorblind ? '#38BDF8' : '#10B981';
  const downColor = isColorblind ? '#F59E0B' : '#F43F5E';

  const { p95Path, p75Path, p50Path, p25Path, p5Path } = useMemo(() => {
    const w = 500;
    const h = 200;
    const minVal = 80000;
    const maxVal = 180000;
    const scaleY = (v: number) => h - ((v - minVal) / (maxVal - minVal)) * h;
    const scaleX = (i: number) =>
      (i / (MOCK_MONTE_CARLO_SERIES.length - 1)) * w;

    const makePath = (key: 'p95' | 'p75' | 'median' | 'p25' | 'p5') =>
      MOCK_MONTE_CARLO_SERIES.map(
        (pt, i) =>
          `${i === 0 ? 'M' : 'L'} ${scaleX(i).toFixed(1)} ${scaleY(pt[key]).toFixed(1)}`
      ).join(' ');

    return {
      p95Path: makePath('p95'),
      p75Path: makePath('p75'),
      p50Path: makePath('median'),
      p25Path: makePath('p25'),
      p5Path: makePath('p5'),
    };
  }, []);

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 select-none">
      {/* Top Meta Header */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/[0.06] text-xs font-mono">
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-zinc-400" />
          <span className="text-white font-medium">10,000 Iterations</span>
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-mono border"
            style={{
              borderColor: `${downColor}40`,
              color: downColor,
              backgroundColor: `${downColor}15`,
            }}
          >
            VaR 99%: -12.4%
          </span>
        </div>
        <div className="text-[11px] text-zinc-400 tabular-nums">
          Median:{' '}
          <span className="text-white font-bold">
            ${activePoint?.median.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Fan Chart SVG */}
      <div className="relative flex-1 min-h-[140px] w-full overflow-hidden">
        <svg
          viewBox="0 0 500 200"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
          role="img"
          aria-label="Monte Carlo 10,000 simulations fan chart"
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="mcUpGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={upColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={upColor} stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="mcDownGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={downColor} stopOpacity="0.05" />
              <stop offset="100%" stopColor={downColor} stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1="0"
            y1="50"
            x2="500"
            y2="50"
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1="100"
            x2="500"
            y2="100"
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="4 4"
          />
          <line
            x1="0"
            y1="150"
            x2="500"
            y2="150"
            stroke="rgba(255,255,255,0.05)"
            strokeDasharray="4 4"
          />

          {/* Upper confidence band (p75 to p95) */}
          <path
            d={`${p95Path} L 500 200 L 0 200 Z`}
            fill="url(#mcUpGrad)"
            opacity="0.8"
          />
          {/* Lower confidence band (p5 to p25) */}
          <path
            d={`${p5Path} L 500 200 L 0 200 Z`}
            fill="url(#mcDownGrad)"
            opacity="0.6"
          />

          {/* P95 Line */}
          <path
            d={p95Path}
            fill="none"
            stroke={upColor}
            strokeWidth="1.2"
            strokeDasharray="3 3"
            opacity="0.7"
          />
          {/* P75 Line */}
          <path
            d={p75Path}
            fill="none"
            stroke={upColor}
            strokeWidth="1"
            opacity="0.5"
          />
          {/* Median P50 Line (Solid) */}
          <path
            d={p50Path}
            fill="none"
            stroke={upColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* P25 Line */}
          <path
            d={p25Path}
            fill="none"
            stroke={downColor}
            strokeWidth="1"
            opacity="0.5"
          />
          {/* P5 Line */}
          <path
            d={p5Path}
            fill="none"
            stroke={downColor}
            strokeWidth="1.4"
            strokeDasharray="4 3"
            opacity="0.8"
          />

          {/* Invisible interactive hover hit areas */}
          {MOCK_MONTE_CARLO_SERIES.map((_, i) => (
            <rect
              key={i}
              x={(i / (MOCK_MONTE_CARLO_SERIES.length - 1)) * 500 - 8}
              y="0"
              width="16"
              height="200"
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              className="cursor-crosshair"
            />
          ))}
        </svg>

        {/* Legend */}
        <div className="absolute bottom-1 right-1 flex items-center gap-3 text-[10px] font-mono bg-black/70 px-2 py-0.5 rounded border border-white/10 backdrop-blur-sm">
          <span className="flex items-center gap-1">
            <span className="w-2 h-0.5" style={{ backgroundColor: upColor }} />
            <span className="text-zinc-300">P95 / Median</span>
          </span>
          <span className="flex items-center gap-1">
            <span
              className="w-2 h-0.5 border-b border-dashed"
              style={{ borderColor: downColor }}
            />
            <span className="text-zinc-300">P5 Tail Risk</span>
          </span>
        </div>
      </div>

      {/* Screen reader table fallback */}
      <div
        className="sr-only"
        role="region"
        aria-label="Monte Carlo simulation percentiles"
      >
        <table>
          <caption>Monte Carlo Simulation 10,000 Iterations</caption>
          <thead>
            <tr>
              <th scope="col">Step</th>
              <th scope="col">P5</th>
              <th scope="col">P25</th>
              <th scope="col">Median</th>
              <th scope="col">P75</th>
              <th scope="col">P95</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_MONTE_CARLO_SERIES.map((row) => (
              <tr key={row.step}>
                <td>{row.step}</td>
                <td>{row.p5}</td>
                <td>{row.p25}</td>
                <td>{row.median}</td>
                <td>{row.p75}</td>
                <td>{row.p95}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
