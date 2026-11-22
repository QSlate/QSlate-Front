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
  const { colorblindMode } = useAppearance();
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
        className={`flex-1 flex flex-col h-full border-l transition-colors select-none ${'bg-surface border-line text-white'}`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b ${'border-line bg-surface'}`}
        >
          <div className="flex items-center gap-2">
            <History size={16} className="text-brand" />
            <div>
              <h2 className="text-xs font-semibold font-sans tracking-tight">
                Revision History
              </h2>
              <p className="text-[10px] text-fg-3 truncate max-w-[200px]">
                {strategyName || 'Current Strategy'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close revision history drawer"
            className={`p-1.5 rounded-md transition-colors ${'hover:bg-[var(--line-2)] text-fg-2 hover:text-fg'}`}
          >
            <X size={15} />
          </button>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-2 text-fg-3 text-xs">
              <Loader2 size={18} className="animate-spin text-brand" />
              <span>Fetching immutable revisions…</span>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4 text-xs text-fg-3">
              <History size={24} className="mb-2 text-fg-2 opacity-60" />
              <p className="font-semibold text-fg-2 mb-1">No past revisions</p>
              <p className="text-[11px] text-fg-3">
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
                      ? 'border-brand-line bg-blue-950/20 shadow-md ring-1 ring-blue-500/30'
                      : 'border-line bg-surface hover:border-line'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand/20 text-brand border border-brand-line">
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
                        className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors ${'bg-[var(--line-2)] hover:bg-white/[0.1] text-fg hover:text-fg'}`}
                      >
                        <RotateCcw size={11} />
                        <span>Restore</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-fg-3">
                    <Clock size={11} />
                    <span>{dateStr}</span>
                  </div>

                  {ver.restored_from && (
                    <div className="mt-1 text-[10px] text-warn/90 italic">
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
          className={`p-3 border-t text-[10px] text-fg-3 flex items-center justify-between ${'bg-surface border-line'}`}
        >
          <span>Auditable gVisor Sandbox</span>
          <span>{versions.length} total versions</span>
        </div>
      </div>
    </div>
  );
}
