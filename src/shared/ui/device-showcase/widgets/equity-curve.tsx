'use client';

export function EquityCurveWidget() {
  return (
    <div className="flex h-full flex-col justify-between p-4 bg-[#0a0c12]">
      {/* Metrics Row */}
      <div className="flex items-center justify-between text-xs font-mono">
        <div>
          <span className="text-xl font-bold font-sans text-white">+29.2%</span>
          <span className="ml-2 text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
            TOTAL RETURN · OUT-OF-SAMPLE
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-signal" /> Strategy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-zinc-600 border-b border-dashed" />{' '}
            SPX
          </span>
        </div>
      </div>

      {/* SVG Vector Chart Canvas */}
      <div className="relative h-44 w-full mt-2">
        <svg
          viewBox="0 0 500 160"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="eqGradShowcase" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* SPX Benchmark Dashed Line */}
          <path
            d="M0,120 Q80,115 160,118 T300,95 T400,85 T500,75"
            fill="none"
            stroke="#52525b"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          {/* Strategy Area */}
          <path
            d="M0,135 Q70,130 140,110 T260,90 T380,50 T500,20 L500,160 L0,160 Z"
            fill="url(#eqGradShowcase)"
          />
          {/* Strategy Stroke */}
          <path
            d="M0,135 Q70,130 140,110 T260,90 T380,50 T500,20"
            fill="none"
            stroke="#00E5FF"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  );
}
