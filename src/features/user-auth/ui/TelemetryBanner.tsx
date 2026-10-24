'use client';

import { Cpu, Server, ShieldCheck } from 'lucide-react';

import { selectColorblindMode, useUserStore } from '@/entities/user/model';
import { useHydratedStore } from '@/shared/lib/store';

export function TelemetryBanner() {
  const colorblindMode = useHydratedStore(
    useUserStore,
    selectColorblindMode,
    'none'
  );
  const isColorblind = colorblindMode === 'orange-blue';

  const dotColor = isColorblind ? 'bg-sky-400' : 'bg-[#00ffb2]';
  const pulseColor = isColorblind ? 'bg-sky-400/40' : 'bg-[#00ffb2]/40';

  return (
    <footer className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col items-center gap-3 text-center">
      <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-3.5 py-2 rounded-xl bg-white/[0.03] light:bg-black/[0.03] border border-white/10 light:border-black/10 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300 light:text-zinc-700">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${pulseColor}`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${dotColor}`}
            />
          </span>
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
          <span>gVisor Sandboxed</span>
        </div>

        <span className="text-zinc-600 light:text-zinc-400 text-xs hidden sm:inline">
          •
        </span>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300 light:text-zinc-700">
          <Cpu className="w-3.5 h-3.5 text-zinc-400" />
          <span>Rust / Polars Engine</span>
        </div>

        <span className="text-zinc-600 light:text-zinc-400 text-xs hidden sm:inline">
          •
        </span>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-300 light:text-zinc-700">
          <Server className="w-3.5 h-3.5 text-zinc-400" />
          <span>European Sovereign Cloud</span>
        </div>
      </div>

      <p className="text-[11px] text-zinc-500 light:text-zinc-400 font-mono tracking-tight">
        Zero proprietary code leakage. Strict memory and compute boundaries
        enforced at kernel level.
      </p>
    </footer>
  );
}
