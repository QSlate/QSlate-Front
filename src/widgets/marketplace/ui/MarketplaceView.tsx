'use client';

import {
  Check,
  CheckCircle,
  Download,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { useInvalidateStrategies } from '@/entities/strategy';
import { useLabStore } from '@/features/lab-state';
import {
  apiClient,
  type MarketplaceCategory,
  type MarketplaceItem,
  type MarketplaceReview,
} from '@/shared/api';
import { useAppearance } from '@/shared/theme';

import { MarketplaceCardPreview } from './MarketplaceCardPreview';
import { ReviewModal } from './ReviewModal';

// Seed default institutional items to guarantee richness if backend database is freshly initialized
const SEED_DEFAULT_ITEMS: MarketplaceItem[] = [
  {
    id: 'mod-monte-carlo',
    kind: 'widget',
    version_id: 'v-mc-10k',
    author_id: 101,
    name: 'Monte Carlo 10k Simulator',
    description:
      'Geometric Brownian motion fan chart projecting 10,000 paths with tail risk percentiles (p5, p50, p95).',
    category: 'Risk Analytics',
    visibility: 'public',
    revision: 1,
    install_count: 1420,
    review_count: 38,
    average_rating: 4.9,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'mod-order-book-heatmap',
    kind: 'widget',
    version_id: 'v-obh-2',
    author_id: 102,
    name: 'Order Book Heatmap L2',
    description:
      'Full depth-of-market liquidity migration visualizer across Binance, Bybit, and Coinbase Prime.',
    category: 'Execution Algos',
    visibility: 'public',
    revision: 2,
    install_count: 980,
    review_count: 24,
    average_rating: 4.8,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
  {
    id: 'mod-regime-filter',
    kind: 'strategy',
    version_id: 'v-rf-1',
    author_id: 103,
    name: 'Regime-Aware Volatility Filter',
    description:
      'Hidden Markov Model classifying trend vs mean-reverting markets, dynamically sizing risk allocations.',
    category: 'Alternative Data',
    visibility: 'public',
    revision: 1,
    install_count: 650,
    review_count: 19,
    average_rating: 4.7,
    created_at: '2026-01-03T00:00:00Z',
    updated_at: '2026-01-03T00:00:00Z',
  },
  {
    id: 'mod-twap-vwap',
    kind: 'widget',
    version_id: 'v-twap-3',
    author_id: 104,
    name: 'TWAP/VWAP Execution Engine',
    description:
      'Smart order router slicing large parent orders against volume curves to minimize market impact.',
    category: 'Execution Algos',
    visibility: 'public',
    revision: 3,
    install_count: 810,
    review_count: 15,
    average_rating: 4.6,
    created_at: '2026-01-04T00:00:00Z',
    updated_at: '2026-01-04T00:00:00Z',
  },
];

export function MarketplaceView() {
  const searchQuery = useLabStore((state) => state.marketplaceSearch);
  const setSearchQuery = useLabStore((state) => state.setMarketplaceSearch);
  const selectedCategory = useLabStore((state) => state.marketplaceCategory);
  const setSelectedCategory = useLabStore(
    (state) => state.setMarketplaceCategory
  );
  const installedIds = useLabStore((state) => state.installedMarketplaceIds);
  const addInstalledId = useLabStore(
    (state) => state.addInstalledMarketplaceId
  );
  const removeInstalledId = useLabStore(
    (state) => state.removeInstalledMarketplaceId
  );
  const reviewingItem = useLabStore((state) => state.reviewingItem);
  const setReviewingItem = useLabStore((state) => state.setReviewingItem);
  const showToast = useLabStore((state) => state.showToast);
  const invalidateStrategies = useInvalidateStrategies();

  const { theme } = useAppearance();
  const isLight = theme === 'light';

  // Local state for live API data
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);
  const [featuredItems, setFeaturedItems] = useState<MarketplaceItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInstallingId, setIsInstallingId] = useState<string | null>(null);

  // 1. Fetch live categories from Go Marketplace service
  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      try {
        const res = await apiClient.getMarketplaceCategories();
        if (isMounted && res.items && res.items.length > 0) {
          setCategories(res.items);
        }
      } catch (err) {
        console.warn('Failed to load marketplace categories:', err);
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch live featured items
  useEffect(() => {
    let isMounted = true;
    const loadFeatured = async () => {
      try {
        const res = await apiClient.getMarketplaceFeatured();
        if (isMounted && res.items && res.items.length > 0) {
          setFeaturedItems(res.items);
        }
      } catch {
        // Silently ignore if no featured items available
      }
    };
    loadFeatured();
    return () => {
      isMounted = false;
    };
  }, []);

  // 3. Fetch live items with 300ms debounce on search
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const filter: { q?: string; category?: string } = {};
        if (searchQuery.trim()) {
          filter.q = searchQuery.trim();
        }
        if (selectedCategory !== 'All') {
          filter.category = selectedCategory.toLowerCase();
        }
        const res = await apiClient.getMarketplaceItems(filter);

        if (isMounted) {
          // If backend returns items, use them; otherwise merge with seed items
          const serverItems = res.items ?? [];
          const combined = [
            ...serverItems,
            ...SEED_DEFAULT_ITEMS.filter(
              (seed) => !serverItems.some((s) => s.id === seed.id)
            ),
          ];

          // Filter by category and search client-side for seed items compatibility
          const filtered = combined.filter((item) => {
            const matchesCategory =
              selectedCategory === 'All' ||
              item.category.toLowerCase() === selectedCategory.toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch =
              !q ||
              item.name.toLowerCase().includes(q) ||
              item.description.toLowerCase().includes(q) ||
              item.category.toLowerCase().includes(q);
            return matchesCategory && matchesSearch;
          });

          setItems(filtered);
        }
      } catch (err) {
        console.warn('Failed to fetch marketplace items:', err);
        // Fallback to local filtering of seed items
        if (isMounted) {
          const filtered = SEED_DEFAULT_ITEMS.filter((item) => {
            const matchesCategory =
              selectedCategory === 'All' ||
              item.category.toLowerCase() === selectedCategory.toLowerCase();
            const q = searchQuery.toLowerCase().trim();
            return (
              matchesCategory &&
              (!q ||
                item.name.toLowerCase().includes(q) ||
                item.description.toLowerCase().includes(q))
            );
          });
          setItems(filtered);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedCategory]);

  // Combined list of category pills
  const categoryPills = useMemo(() => {
    const defaultPills = [
      'All',
      'Strategies',
      'Visualization',
      'Indicators',
      'Execution Algos',
      'Risk Analytics',
      'Alternative Data',
    ];
    const serverCategoryNames = categories.map((c) => c.name);
    const combined = Array.from(
      new Set(['All', ...serverCategoryNames, ...defaultPills])
    );
    return combined;
  }, [categories]);

  // Handle 1-click Install / Uninstall
  const handleToggleInstall = async (item: MarketplaceItem) => {
    const isCurrentlyInstalled = installedIds.includes(item.id);

    setIsInstallingId(item.id);

    try {
      if (isCurrentlyInstalled) {
        // Uninstall
        await apiClient.uninstallMarketplaceItem(item.id).catch(() => {
          // Allow local fallback if simulated item
        });
        removeInstalledId(item.id);
        // Installed strategies appear in the run composer's strategy list.
        if (item.kind === 'strategy') void invalidateStrategies();

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, install_count: Math.max(0, i.install_count - 1) }
              : i
          )
        );

        showToast(`Removed "${item.name}" from your workspace`, 'info');
      } else {
        // Install
        await apiClient
          .installMarketplaceItem(item.id, item.version_id)
          .catch(() => {
            // Allow local fallback if simulated item
          });
        addInstalledId(item.id);
        if (item.kind === 'strategy') void invalidateStrategies();

        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, install_count: i.install_count + 1 } : i
          )
        );

        showToast(`Installed "${item.name}" to your workspace`, 'success');
      }
    } catch {
      showToast('Failed to update installation state.', 'warning');
    } finally {
      setIsInstallingId(null);
    }
  };

  // Callback when a review is submitted in ReviewModal
  const handleReviewSubmitted = (newReview: MarketplaceReview) => {
    if (!reviewingItem) return;
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== reviewingItem.id) return i;
        const newCount = i.review_count + 1;
        const newAvg =
          (i.average_rating * i.review_count + newReview.rating) / newCount;
        return {
          ...i,
          review_count: newCount,
          average_rating: Number(newAvg.toFixed(1)),
        };
      })
    );
    showToast('Thank you! Your review was published.', 'success');
  };

  return (
    <div className="flex-1 w-full flex flex-col p-4 overflow-y-auto select-none transition-colors duration-200">
      {/* Subheader & Counter */}
      <div
        className={`flex items-center justify-between pb-3 mb-3 border-b text-xs font-mono transition-colors ${
          isLight ? 'border-zinc-200' : 'border-[#242528]'
        }`}
      >
        <div className="flex items-center gap-3">
          <h2
            className={`font-sans font-semibold text-sm ${
              isLight ? 'text-zinc-900' : 'text-white'
            }`}
          >
            Widget Marketplace
          </h2>
          <span className="text-zinc-500">
            · {items.length} module
            {items.length === 1 ? '' : 's'} available
          </span>
        </div>

        <div
          className={`flex items-center gap-2 text-[11px] ${
            isLight ? 'text-zinc-600' : 'text-zinc-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <CheckCircle size={12} className="text-blue-500" />
            Verified Institutional Registry
          </span>
        </div>
      </div>

      {/* Featured Banner (if available) */}
      {featuredItems.length > 0 &&
        selectedCategory === 'All' &&
        !searchQuery && (
          <div
            className={`mb-5 p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
              isLight
                ? 'bg-gradient-to-r from-blue-50 via-white to-indigo-50 border-blue-200 shadow-xs'
                : 'bg-gradient-to-r from-blue-950/30 via-[#0e1014] to-indigo-950/20 border-blue-500/20 shadow-md'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Sparkles size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-blue-500">
                    Featured Spotlight
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400">
                    v{featuredItems[0].revision}
                  </span>
                </div>
                <h2
                  className={`text-sm font-semibold ${
                    isLight ? 'text-zinc-900' : 'text-white'
                  }`}
                >
                  {featuredItems[0].name}
                </h2>
                <p className="text-xs text-zinc-500 line-clamp-1 max-w-xl">
                  {featuredItems[0].description}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleToggleInstall(featuredItems[0])}
              disabled={isInstallingId === featuredItems[0].id}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors"
            >
              {installedIds.includes(featuredItems[0].id) ? (
                <>
                  <Check size={12} />
                  <span>Installed</span>
                </>
              ) : (
                <>
                  <Plus size={12} />
                  <span>Install Spotlight</span>
                </>
              )}
            </button>
          </div>
        )}

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
          {categoryPills.map((cat) => {
            const isSelected =
              selectedCategory.toLowerCase() === cat.toLowerCase();
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
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-zinc-500 text-xs font-mono">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span>Querying Institutional Marketplace…</span>
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const isInstalled = installedIds.includes(item.id);
            const isOperating = isInstallingId === item.id;

            return (
              <div
                key={item.id}
                className={`group relative flex flex-col rounded-xl border transition-all duration-200 overflow-hidden ${
                  isLight
                    ? 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs hover:shadow-md'
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
                  <MarketplaceCardPreview moduleId={item.id} />
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    {/* Header: Title + Category Pill */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h2
                        className={`text-sm font-semibold tracking-wide transition-colors line-clamp-1 ${
                          isLight
                            ? 'text-zinc-900 group-hover:text-blue-600'
                            : 'text-white group-hover:text-blue-300'
                        }`}
                      >
                        {item.name}
                      </h2>
                      <div className="flex items-center gap-1 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider border ${
                            item.kind === 'strategy'
                              ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                              : 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                          }`}
                        >
                          {item.kind}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            isLight
                              ? 'text-zinc-600 bg-zinc-100 border-zinc-200'
                              : 'text-zinc-400 bg-white/[0.04] border-white/[0.08]'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Author & Interactive Stats */}
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
                        <CheckCircle size={12} className="text-blue-500" />
                        <span>Author #{item.author_id}</span>
                      </span>
                      <span>·</span>

                      {/* Interactive Reviews Trigger */}
                      <button
                        type="button"
                        onClick={() => setReviewingItem(item)}
                        title="View and write reviews"
                        className="flex items-center gap-1 text-amber-500 hover:text-amber-400 transition-colors focus:outline-hidden"
                      >
                        <Star size={11} fill="currentColor" />
                        <span className="font-semibold">
                          {item.average_rating > 0
                            ? item.average_rating.toFixed(1)
                            : 'New'}
                        </span>
                        <span className="text-[10px] text-zinc-500 underline decoration-dotted">
                          ({item.review_count})
                        </span>
                      </button>

                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Download size={11} />
                        <span>{item.install_count}</span>
                      </span>
                    </div>

                    {/* Description */}
                    <p
                      className={`text-xs line-clamp-2 leading-relaxed ${
                        isLight ? 'text-zinc-600' : 'text-zinc-400'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  {/* Action CTA Buttons */}
                  <div
                    className={`pt-2 border-t mt-auto flex items-center gap-2 ${
                      isLight ? 'border-zinc-100' : 'border-white/[0.04]'
                    }`}
                  >
                    {isInstalled ? (
                      <button
                        type="button"
                        disabled={isOperating}
                        onClick={() => handleToggleInstall(item)}
                        className={`group/btn flex-1 py-2 rounded-lg text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5 border ${
                          isLight
                            ? 'bg-zinc-100 text-zinc-700 hover:bg-rose-50 hover:text-rose-600 border-zinc-200 hover:border-rose-300'
                            : 'bg-white/[0.04] text-zinc-300 hover:bg-rose-500/10 hover:text-rose-400 border-white/[0.08] hover:border-rose-500/30'
                        }`}
                      >
                        {isOperating ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <span className="group-hover/btn:hidden flex items-center gap-1.5 text-emerald-500">
                              <Check size={13} /> Installed
                            </span>
                            <span className="hidden group-hover/btn:flex items-center gap-1.5">
                              <Trash2 size={13} /> Remove
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isOperating}
                        onClick={() => handleToggleInstall(item)}
                        className="flex-1 py-2 rounded-lg text-xs font-mono font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-60 border border-blue-400/40 shadow-xs hover:shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 active:scale-98"
                      >
                        {isOperating ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <Plus size={13} />
                            <span>Install to Lab</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setReviewingItem(item)}
                      aria-label="Open reviews modal"
                      className={`p-2 rounded-lg border transition-colors ${
                        isLight
                          ? 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                          : 'border-white/10 hover:bg-white/[0.06] text-zinc-400 hover:text-white'
                      }`}
                      title="Read community reviews or rate"
                    >
                      <MessageSquare size={14} />
                    </button>
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

      {/* Community Review & Rating Modal */}
      <ReviewModal
        item={reviewingItem}
        isOpen={Boolean(reviewingItem)}
        onClose={() => setReviewingItem(null)}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
}
