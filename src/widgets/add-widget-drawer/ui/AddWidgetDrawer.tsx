'use client';

import {
  Activity,
  BarChart3,
  CandlestickChart,
  Cpu,
  Layers,
  LineChart,
  ListOrdered,
  Loader2,
  Package,
  Plus,
  Search,
  Sparkles,
  Table2,
  Trash2,
  X,
} from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { useLayoutStore } from '@/entities/layout';
import { LAB_WIDGETS, WIDGET_CATEGORY_LABELS } from '@/entities/widget';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type InstalledWidget } from '@/shared/api';
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

interface CombinedWidgetItem {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  kind: 'core' | 'custom' | 'marketplace';
  icon: ReactNode;
  defaultW?: number | undefined;
  defaultH?: number | undefined;
  minW?: number | undefined;
  minH?: number | undefined;
}

export function AddWidgetDrawer() {
  const isOpen = useLabStore((state) => state.isAddWidgetDrawerOpen);
  const setOpen = useLabStore((state) => state.setAddWidgetDrawerOpen);
  const showToast = useLabStore((state) => state.showToast);

  const { theme } = useAppearance();
  const isLight = theme === 'light';

  const layout = useLayoutStore((state) => state.layout);
  const addWidget = useLayoutStore((state) => state.addWidget);
  const removeWidget = useLayoutStore((state) => state.removeWidget);

  // Local state for dynamic catalogue & filters
  const [installedWidgets, setInstalledWidgets] = useState<InstalledWidget[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Fetch installed catalogue from Go Widgets service whenever drawer opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchInstalledCatalogue = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.getInstalledWidgets();
        if (isMounted) {
          setInstalledWidgets(res.items ?? []);
        }
      } catch (err) {
        console.warn('Failed to load installed widgets catalogue:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInstalledCatalogue();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Handle ESC key to dismiss drawer
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

  // Merge static inventory with dynamically fetched catalogue from backend
  const combinedWidgets = useMemo(() => {
    const list: CombinedWidgetItem[] = [];
    const addedIds = new Set<string>();

    // 1. Add known core widgets from inventory
    for (const core of LAB_WIDGETS) {
      list.push({
        id: core.type,
        title: core.title,
        category: WIDGET_CATEGORY_LABELS[core.category],
        subtitle: core.description,
        kind: 'core',
        icon: WIDGET_ICONS[core.type] ?? (
          <Activity size={15} className="text-blue-500" />
        ),
      });
      addedIds.add(core.type);
    }

    // 2. Append new dynamic custom or marketplace widgets from backend
    for (const backend of installedWidgets) {
      if (!addedIds.has(backend.id)) {
        list.push({
          id: backend.id,
          title: backend.name,
          category:
            backend.category ??
            (backend.kind === 'custom' ? 'Custom' : 'Marketplace'),
          subtitle:
            backend.subtitle ?? `${backend.language} algorithmic module`,
          kind: backend.kind,
          icon:
            backend.kind === 'custom' ? (
              <Cpu size={15} className="text-emerald-500" />
            ) : (
              <Package size={15} className="text-purple-500" />
            ),
          defaultW: backend.default_w,
          defaultH: backend.default_h,
          minW: backend.min_w,
          minH: backend.min_h,
        });
        addedIds.add(backend.id);
      }
    }

    return list;
  }, [installedWidgets]);

  // Compute available categories for filter pills
  const categories = useMemo(() => {
    const set = new Set<string>(['All']);
    for (const w of combinedWidgets) {
      if (w.category) set.add(w.category);
    }
    return Array.from(set);
  }, [combinedWidgets]);

  // Filter widgets by search and category
  const filteredWidgets = useMemo(() => {
    return combinedWidgets.filter((widget) => {
      const matchesCategory =
        selectedCategory === 'All' ||
        widget.category.toLowerCase() === selectedCategory.toLowerCase() ||
        (selectedCategory === 'Custom' && widget.kind === 'custom') ||
        (selectedCategory === 'Marketplace' && widget.kind === 'marketplace');

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        widget.title.toLowerCase().includes(q) ||
        widget.category.toLowerCase().includes(q) ||
        widget.subtitle.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [combinedWidgets, searchQuery, selectedCategory]);

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
              ({filteredWidgets.length} available)
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

        {/* Search Bar */}
        <div
          className={`px-5 py-3 border-b ${
            isLight
              ? 'border-zinc-100 bg-zinc-50'
              : 'border-white/[0.04] bg-white/[0.01]'
          }`}
        >
          <div className="relative mb-2.5">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search modules, indicators, algos..."
              className={`w-full rounded-md pl-8 pr-7 py-1.5 text-xs font-sans focus:outline-hidden transition-all ${
                isLight
                  ? 'bg-white border border-zinc-200 focus:border-blue-500 text-zinc-900 placeholder-zinc-400'
                  : 'bg-[#15171d] border border-white/10 focus:border-blue-500 text-white placeholder-zinc-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                aria-label="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px] font-mono">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600 text-white font-medium shadow-2xs'
                      : isLight
                        ? 'bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                        : 'bg-white/[0.03] text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-white/[0.06]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Widget List */}
        <div
          className={`flex-1 overflow-y-auto px-4 py-3 divide-y ${
            isLight ? 'divide-zinc-100' : 'divide-white/[0.04]'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-zinc-500 text-xs font-mono">
              <Loader2 size={18} className="animate-spin text-blue-500" />
              <span>Fetching dynamic catalogue…</span>
            </div>
          ) : filteredWidgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 font-mono text-xs">
              <Search size={24} className="mb-2 text-zinc-400" />
              <p className="font-semibold text-zinc-400 mb-1">
                No widgets match
              </p>
              <p className="text-[11px] text-zinc-500">
                Try searching for a different keyword or category.
              </p>
            </div>
          ) : (
            filteredWidgets.map((widget) => {
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
                      {widget.icon}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <h3
                          className={`text-xs font-medium truncate transition-colors ${
                            isLight
                              ? 'text-zinc-900 group-hover:text-blue-600'
                              : 'text-white group-hover:text-blue-300'
                          }`}
                        >
                          {widget.title}
                        </h3>
                        <span
                          className={`px-1 py-0.2 rounded text-[9px] font-mono uppercase tracking-wider border shrink-0 ${
                            widget.kind === 'core'
                              ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                              : widget.kind === 'custom'
                                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                : 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                          }`}
                        >
                          {widget.kind}
                        </span>
                      </div>
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
                          const isKnown = LAB_WIDGETS.some(
                            (k) => k.type === widget.id
                          );
                          addWidget(
                            widget.id,
                            isKnown
                              ? undefined
                              : {
                                  w: widget.defaultW ?? 6,
                                  h: widget.defaultH ?? 4,
                                  minW: widget.minW ?? 3,
                                  minH: widget.minH ?? 2,
                                }
                          );
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
            })
          )}
        </div>

        {/* Footer info */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-[10px] text-zinc-500 font-mono ${
            isLight
              ? 'border-zinc-200 bg-zinc-50'
              : 'border-[#242528] bg-white/[0.01]'
          }`}
        >
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-blue-500" />
            Dynamic Catalogue Sync
          </span>
          <span>12-col Liquid Grid</span>
        </div>
      </div>
    </div>
  );
}
