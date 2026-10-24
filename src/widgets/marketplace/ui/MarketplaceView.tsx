'use client';

import {
  Check,
  CheckCircle,
  Download,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useMemo } from 'react';

import { useLayoutStore } from '@/entities/layout';
import { MARKETPLACE_MODULES, type WidgetCategory } from '@/entities/widget';
import { useLabStore } from '@/features/lab-state';
import { useAppearance } from '@/shared/theme';

import { MarketplaceCardPreview } from './MarketplaceCardPreview';

const CATEGORIES: ('All' | WidgetCategory)[] = [
  'All',
  'Risk Analytics',
  'Execution Algos',
  'Alternative Data',
  'Machine Learning',
];

export function MarketplaceView() {
  const searchQuery = useLabStore((state) => state.marketplaceSearch);
  const setSearchQuery = useLabStore((state) => state.setMarketplaceSearch);
  const selectedCategory = useLabStore((state) => state.marketplaceCategory);
  const setSelectedCategory = useLabStore(
    (state) => state.setMarketplaceCategory
  );
  const showToast = useLabStore((state) => state.showToast);

  const { theme } = useAppearance();
  const isLight = theme === 'light';

  const layout = useLayoutStore((state) => state.layout);
  const addWidget = useLayoutStore((state) => state.addWidget);
  const removeWidget = useLayoutStore((state) => state.removeWidget);

  const filteredModules = useMemo(() => {
    return MARKETPLACE_MODULES.filter((module) => {
      const matchesCategory =
        selectedCategory === 'All' || module.category === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        module.title.toLowerCase().includes(q) ||
        module.author.toLowerCase().includes(q) ||
        module.category.toLowerCase().includes(q) ||
        module.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto select-none transition-colors duration-200">
      {/* Subheader & Counter */}
      <div
        className={`flex items-center justify-between pb-3 mb-3 border-b text-xs font-mono transition-colors ${
          isLight ? 'border-zinc-200' : 'border-[#242528]'
        }`}
      >
        <div className="flex items-center gap-3">
          <h1
            className={`font-sans font-semibold text-sm ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            Widget Marketplace
          </h1>
          <span className="text-zinc-500">
            · {filteredModules.length} module
            {filteredModules.length === 1 ? '' : 's'} available
          </span>
        </div>

        <div
          className={`flex items-center gap-2 text-[11px] ${
            isLight ? 'text-zinc-600' : 'text-zinc-400'
          }`}
        >
          <span>Verified Institutional Registry</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules, authors, signals..."
            className={`w-full rounded-lg pl-9 pr-8 py-2 text-xs font-sans focus:outline-hidden transition-all ${
              isLight
                ? 'bg-white hover:bg-zinc-50 focus:bg-white border border-zinc-300 focus:border-blue-500 text-zinc-900 placeholder-zinc-400 shadow-xs'
                : 'bg-[#0c0d0e] hover:bg-[#111215] focus:bg-[#111215] border border-[#242528] focus:border-blue-500/80 text-white placeholder-zinc-500 shadow-inner'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-700 dark:hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-mono">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap text-[11px] ${
                  isSelected
                    ? 'bg-blue-600 text-white font-medium shadow-xs shadow-blue-500/20'
                    : isLight
                      ? 'bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-zinc-200'
                      : 'bg-[#0c0d0e] text-zinc-400 hover:text-white hover:bg-white/[0.04] border border-[#242528]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Modules Grid */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredModules.map((module) => {
            const isInstalled = Boolean(
              module.widgetId &&
              layout.some((item) => item.i === module.widgetId)
            );

            return (
              <div
                key={module.id}
                className={`group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
                  isLight
                    ? 'border-zinc-200 bg-white hover:border-zinc-300 shadow-sm hover:shadow-md'
                    : 'border-[#242528] bg-[#0c0d0e]/90 hover:border-white/20 shadow-lg hover:shadow-black/50'
                }`}
              >
                {/* Visual Preview Header */}
                <div
                  className={`h-32 w-full border-b relative overflow-hidden flex items-center justify-center ${
                    isLight
                      ? 'border-zinc-200 bg-zinc-50'
                      : 'border-[#1f2024] bg-[#07080a]'
                  }`}
                >
                  <MarketplaceCardPreview moduleId={module.id} />
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    {/* Header: Title + Category Pill */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h2
                        className={`text-sm font-semibold tracking-wide transition-colors ${
                          isLight
                            ? 'text-zinc-900 group-hover:text-blue-600'
                            : 'text-white group-hover:text-blue-300'
                        }`}
                      >
                        {module.title}
                      </h2>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border shrink-0 ${
                          isLight
                            ? 'text-zinc-600 bg-zinc-100 border-zinc-200'
                            : 'text-zinc-400 bg-white/[0.04] border-white/[0.08]'
                        }`}
                      >
                        {module.category}
                      </span>
                    </div>

                    {/* Author & Stats */}
                    <div
                      className={`flex items-center gap-3 text-xs font-mono mb-2 ${
                        isLight ? 'text-zinc-500' : 'text-zinc-400'
                      }`}
                    >
                      <span
                        className={`flex items-center gap-1 ${
                          isLight ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        {module.isVerified && (
                          <CheckCircle size={12} className="text-blue-500" />
                        )}
                        <span>{module.author}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-amber-500">
                        <Star size={11} fill="currentColor" />
                        <span>{module.rating.toFixed(1)}</span>
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Download size={11} />
                        <span>{module.installs}</span>
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      className={`text-xs line-clamp-2 leading-relaxed ${
                        isLight ? 'text-zinc-600' : 'text-zinc-400'
                      }`}
                    >
                      {module.description}
                    </p>
                  </div>

                  {/* Action CTA Button */}
                  <div
                    className={`pt-2 border-t mt-auto ${
                      isLight ? 'border-zinc-100' : 'border-white/[0.04]'
                    }`}
                  >
                    {module.isComingSoon ? (
                      <button
                        type="button"
                        disabled
                        className={`w-full py-2 rounded-lg text-xs font-mono font-medium cursor-not-allowed text-center border ${
                          isLight
                            ? 'text-zinc-400 bg-zinc-100 border-zinc-200'
                            : 'text-zinc-500 bg-white/[0.02] border-white/[0.04]'
                        }`}
                      >
                        Coming soon
                      </button>
                    ) : isInstalled ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (module.widgetId) {
                            removeWidget(module.widgetId);
                            showToast(
                              `Removed ${module.title} from Lab Workspace`,
                              'info'
                            );
                          }
                        }}
                        className={`group/btn w-full py-2 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 border ${
                          isLight
                            ? 'bg-zinc-100 text-zinc-700 hover:bg-rose-50 hover:text-rose-600 border-zinc-200 hover:border-rose-300'
                            : 'bg-white/[0.04] text-zinc-300 hover:bg-rose-500/10 hover:text-rose-400 border-white/[0.08] hover:border-rose-500/30'
                        }`}
                      >
                        <span className="group-hover/btn:hidden flex items-center gap-1.5 text-emerald-500">
                          <Check size={13} /> Installed
                        </span>
                        <span className="hidden group-hover/btn:flex items-center gap-1.5">
                          <Trash2 size={13} /> Remove from Lab
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (module.widgetId) {
                            addWidget(module.widgetId);
                            showToast(
                              `Installed ${module.title} to Lab Workspace`,
                              'success'
                            );
                          }
                        }}
                        className="w-full py-2 rounded-lg text-xs font-mono font-medium text-white bg-blue-600 hover:bg-blue-500 border border-blue-400/40 shadow-xs hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        <Plus size={13} />
                        <span>Install to Lab</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 font-mono text-xs">
          <Search size={28} className="mb-3 text-zinc-400" />
          <p
            className={`text-sm font-sans mb-1 ${
              isLight ? 'text-zinc-800' : 'text-zinc-300'
            }`}
          >
            No modules match your query
          </p>
          <p className="text-zinc-500">
            Try adjusting your search terms or category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className={`mt-4 px-3 py-1.5 rounded-md border transition-colors ${
              isLight
                ? 'bg-white hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border-white/[0.08]'
            }`}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
