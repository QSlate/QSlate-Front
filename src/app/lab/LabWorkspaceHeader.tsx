'use client';

import { RotateCcw } from 'lucide-react';

import { useLayoutStore } from '@/entities/layout';

export function LabWorkspaceHeader() {
  const resetLayout = useLayoutStore((state) => state.resetLayout);

  return (
    <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.06] text-xs font-mono select-none">
      <div className="flex items-center gap-3">
        <span className="font-sans font-semibold text-sm text-white">
          Lab Workspace
        </span>
        <span className="text-zinc-500">
          · 3 widgets (TradingView Engine active)
        </span>
      </div>

      <button
        type="button"
        onClick={() => resetLayout('default')}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors border border-white/[0.06]"
        title="Reset grid layout to defaults"
      >
        <RotateCcw className="h-3 w-3 text-zinc-400" />
        <span>Reset Layout</span>
      </button>
    </div>
  );
}
