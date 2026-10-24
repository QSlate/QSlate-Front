'use client';

import {
  Activity,
  BarChart3,
  Cpu,
  Layers,
  LineChart,
  ListOrdered,
  Plus,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect } from 'react';

import { useLayoutStore } from '@/entities/layout';
import { LAB_WIDGET_INVENTORY } from '@/entities/widget';
import { useLabStore } from '@/features/lab-state';

const WIDGET_ICONS: Record<string, ReactNode> = {
  'equity-curve': <LineChart size={15} className="text-blue-400" />,
  drawdown: <BarChart3 size={15} className="text-emerald-400" />,
  'execution-metrics': <Table2 size={15} className="text-purple-400" />,
  'trade-log': <ListOrdered size={15} className="text-amber-400" />,
  'monte-carlo': <Activity size={15} className="text-cyan-400" />,
  'order-book': <Layers size={15} className="text-orange-400" />,
  'volatility-filter': <Cpu size={15} className="text-pink-400" />,
};

export function AddWidgetDrawer() {
  const isOpen = useLabStore((state) => state.isAddWidgetDrawerOpen);
  const setOpen = useLabStore((state) => state.setAddWidgetDrawerOpen);
  const showToast = useLabStore((state) => state.showToast);

  const layout = useLayoutStore((state) => state.layout);
  const addWidget = useLayoutStore((state) => state.addWidget);
  const removeWidget = useLayoutStore((state) => state.removeWidget);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-md transition-opacity duration-200"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Add Widget Drawer"
    >
      <div
        className="relative w-full max-w-sm sm:max-w-md h-full bg-[#0c0d0e] border-l border-[#242528] flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#242528]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Add Widget
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              ({LAB_WIDGET_INVENTORY.length} available)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] border border-white/[0.08] text-zinc-400 font-mono">
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              aria-label="Close drawer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Drawer Subtitle */}
        <div className="px-5 py-3 border-b border-white/[0.04] bg-white/[0.01]">
          <p className="text-xs text-zinc-400 leading-relaxed">
            Mount quantitative analytics modules directly onto your Lab
            Workspace dynamic grid.
          </p>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-white/[0.04]">
          {LAB_WIDGET_INVENTORY.map((widget) => {
            const isActive = layout.some((item) => item.i === widget.id);

            return (
              <div
                key={widget.id}
                className="group flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors">
                    {WIDGET_ICONS[widget.id] ?? <Activity size={15} />}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-xs font-medium text-white truncate group-hover:text-blue-300 transition-colors">
                      {widget.title}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-mono truncate">
                      {widget.category} · {widget.subtitle}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {isActive ? (
                    <button
                      type="button"
                      onClick={() => {
                        removeWidget(widget.id);
                        showToast(
                          `Removed ${widget.title} from workspace`,
                          'info'
                        );
                      }}
                      className="group/btn flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono text-zinc-400 bg-white/[0.03] hover:bg-rose-500/10 hover:text-rose-400 border border-white/[0.06] hover:border-rose-500/30 transition-all"
                      title="Click to remove from workspace"
                    >
                      <span className="group-hover/btn:hidden">Active</span>
                      <span className="hidden group-hover/btn:inline flex items-center gap-1">
                        <Trash2 size={11} /> Remove
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        addWidget(widget.id);
                        showToast(
                          `Added ${widget.title} to workspace`,
                          'success'
                        );
                      }}
                      className="flex items-center gap-1 px-3 py-1 rounded text-xs font-mono font-medium text-white bg-blue-600/80 hover:bg-blue-600 border border-blue-500/40 shadow-xs hover:shadow-blue-500/20 transition-all active:scale-95"
                    >
                      <Plus size={12} />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-[#242528] bg-white/[0.01] flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>Desktop Grid: 12-col Liquid</span>
          <span>Auto-persisted to browser</span>
        </div>
      </div>
    </div>
  );
}
