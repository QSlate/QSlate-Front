'use client';

import { Check, Clock, History, Loader2, RotateCcw, X } from 'lucide-react';
import { useEffect } from 'react';

import type { StrategyVersion } from '@/shared/api';
import { useAppearance } from '@/shared/theme';

interface VersionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  versions: StrategyVersion[];
  currentVersionId: string | null;
  strategyName: string;
  isLoading: boolean;
  onRestore: (version: StrategyVersion) => void;
  isRestoring?: boolean;
}

export function VersionHistoryDrawer({
  isOpen,
  onClose,
  versions,
  currentVersionId,
  strategyName,
  isLoading,
  onRestore,
  isRestoring = false,
}: VersionHistoryDrawerProps) {
  const { theme, colorblindMode } = useAppearance();
  const isLight = theme === 'light';
  const isColorblind = colorblindMode === 'orange-blue';
  const activeColor = isColorblind ? '#38BDF8' : '#10B981';

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm flex flex-col shadow-2xl transition-all duration-300 animate-in slide-in-from-right font-mono">
      {/* Backdrop for closing */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs -z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Drawer Panel */}
      <div
        className={`flex-1 flex flex-col h-full border-l transition-colors select-none ${
          isLight
            ? 'bg-[#ffffff] border-zinc-200 text-zinc-900'
            : 'bg-[#0a0b0d] border-[#242528] text-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isLight
              ? 'border-zinc-200 bg-zinc-50/60'
              : 'border-[#242528] bg-[#0e1014]'
          }`}
        >
          <div className="flex items-center gap-2">
            <History size={16} className="text-blue-500" />
            <div>
              <h2 className="text-xs font-semibold font-sans tracking-tight">
                Revision History
              </h2>
              <p className="text-[10px] text-zinc-500 truncate max-w-[200px]">
                {strategyName || 'Current Strategy'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close revision history drawer"
            className={`p-1.5 rounded-md transition-colors ${
              isLight
                ? 'hover:bg-zinc-200 text-zinc-500'
                : 'hover:bg-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            <X size={15} />
          </button>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-zinc-500 text-xs">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span>Fetching immutable revisions…</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-xs text-zinc-500">
              <History size={24} className="mb-2 text-zinc-400 opacity-60" />
              <p className="font-semibold text-zinc-400 mb-1">
                No past revisions
              </p>
              <p className="text-[11px] text-zinc-500">
                Commit changes with the &quot;Save Version&quot; button to
                create an immutable audit history.
              </p>
            </div>
          ) : (
            versions.map((ver) => {
              const isCurrent = ver.version_id === currentVersionId;
              const dateStr = new Date(ver.created_at).toLocaleString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              });

              return (
                <div
                  key={ver.version_id}
                  className={`p-3 rounded-lg border transition-all ${
                    isCurrent
                      ? isLight
                        ? 'border-blue-400 bg-blue-50/50 shadow-xs ring-1 ring-blue-300'
                        : 'border-blue-500/60 bg-blue-950/20 shadow-md ring-1 ring-blue-500/30'
                      : isLight
                        ? 'border-zinc-200 bg-white hover:border-zinc-300'
                        : 'border-[#1e2025] bg-[#0f1115] hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
                        v{ver.revision}
                      </span>
                      {isCurrent && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-medium"
                          style={{ color: activeColor }}
                        >
                          <Check size={11} />
                          Active
                        </span>
                      )}
                    </div>

                    {!isCurrent && (
                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={() => onRestore(ver)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                          isLight
                            ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                            : 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white'
                        }`}
                      >
                        <RotateCcw size={11} />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                    <Clock size={11} />
                    <span>{dateStr}</span>
                  </div>

                  {ver.restored_from && (
                    <div className="mt-1 text-[10px] text-amber-500/90 italic">
                      Restored from {ver.restored_from.slice(0, 12)}…
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className={`p-3 border-t text-[10px] text-zinc-500 flex items-center justify-between ${
            isLight
              ? 'bg-zinc-50 border-zinc-200'
              : 'bg-[#090a0c] border-[#1f2126]'
          }`}
        >
          <span>Auditable gVisor Sandbox</span>
          <span>{versions.length} total versions</span>
        </div>
      </div>
    </div>
  );
}
