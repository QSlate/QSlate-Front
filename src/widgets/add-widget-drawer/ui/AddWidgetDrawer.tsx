'use client';

import {
  Activity,
  BarChart3,
  CandlestickChart,
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
import { useAppearance } from '@/shared/theme';

const WIDGET_ICONS: Record<string, ReactNode> = {
  'equity-curve': <LineChart size={15} className="text-blue-500" />,
  drawdown: <BarChart3 size={15} className="text-emerald-500" />,
  'execution-metrics': <Table2 size={15} className="text-purple-500" />,
  'trade-log': <ListOrdered size={15} className="text-amber-500" />,
  'monte-carlo': <Activity size={15} className="text-cyan-500" />,
  'order-book': <Layers size={15} className="text-orange-500" />,
  'volatility-filter': <Cpu size={15} className="text-pink-500" />,
  'tradingview-candles': (
    <CandlestickChart size={15} className="text-emerald-500" />
  ),
};

export function AddWidgetDrawer() {
  const isOpen = useLabStore((state) => state.isAddWidgetDrawerOpen);
  const setOpen = useLabStore((state) => state.setAddWidgetDrawerOpen);
  const showToast = useLabStore((state) => state.showToast);

  const { theme } = useAppearance();
  const isLight = theme === 'light';

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
        className={`relative w-full max-w-sm sm:max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200 select-none ${
          isLight
            ? 'bg-white border-l border-zinc-200'
            : 'bg-[#0c0d0e] border-l border-[#242528]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b ${
            isLight ? 'border-zinc-200' : 'border-[#242528]'
          }`}
        >
          <div className="flex items-center gap-2">
            <h2
              className={`text-sm font-semibold tracking-wide ${
                isLight ? 'text-zinc-900' : 'text-white'
              }`}
            >
              Add Widget
            </h2>
            <span className="text-[11px] text-zinc-500 font-mono">
              ({LAB_WIDGET_INVENTORY.length} available)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <kbd
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                isLight
                  ? 'bg-zinc-100 border-zinc-200 text-zinc-600'
                  : 'bg-white/[0.04] border-white/[0.08] text-zinc-400'
              }`}
            >
              ESC
            </kbd>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className={`p-1 rounded transition-colors ${
                isLight
                  ? 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              aria-label="Close drawer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Drawer Subtitle */}
        <div
          className={`px-5 py-3 border-b ${
            isLight
              ? 'border-zinc-100 bg-zinc-50'
              : 'border-white/[0.04] bg-white/[0.01]'
          }`}
        >
          <p
            className={`text-xs leading-relaxed ${
              isLight ? 'text-zinc-600' : 'text-zinc-400'
            }`}
          >
            Mount quantitative analytics modules directly onto your Lab
            Workspace dynamic grid.
          </p>
        </div>

        {/* Widget List */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-3 divide-y ${
            isLight ? 'divide-zinc-100' : 'divide-white/[0.04]'
          }`}
        >
          {LAB_WIDGET_INVENTORY.map((widget) => {
            const isActive = layout.some((item) => item.i === widget.id);

            return (
              <div
                key={widget.id}
                className={`group flex items-center justify-between py-3 px-2 rounded-lg transition-colors ${
                  isLight ? 'hover:bg-zinc-50' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-3">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                      isLight
                        ? 'bg-zinc-100 border-zinc-200 group-hover:border-zinc-300'
                        : 'bg-white/[0.04] border-white/[0.08] group-hover:border-white/20'
                    }`}
                  >
                    {WIDGET_ICONS[widget.id] ?? <Activity size={15} />}
                  </div>

                  <div className="min-w-0">
                    <h3
                      className={`text-xs font-medium truncate transition-colors ${
                        isLight
                          ? 'text-zinc-900 group-hover:text-blue-600'
                          : 'text-white group-hover:text-blue-300'
                      }`}
                    >
                      {widget.title}
                    </h3>
                    <p
                      className={`text-[10px] font-mono truncate ${
                        isLight ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    >
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
                      className={`group/btn flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono border transition-all ${
                        isLight
                          ? 'bg-zinc-100 text-zinc-600 hover:bg-rose-50 hover:text-rose-600 border-zinc-200 hover:border-rose-300'
                          : 'bg-white/[0.03] text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 border-white/[0.06] hover:border-rose-500/30'
                      }`}
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
                      className="flex items-center gap-1 px-3 py-1 rounded text-xs font-mono font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/40 shadow-xs hover:shadow-blue-500/20 transition-all active:scale-95"
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
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-[10px] text-zinc-500 font-mono ${
            isLight
              ? 'border-zinc-200 bg-zinc-50'
              : 'border-[#242528] bg-white/[0.01]'
          }`}
        >
          <span>Desktop Grid: 12-col Liquid</span>
          <span>Auto-persisted to browser</span>
        </div>
      </div>
    </div>
  );
}
