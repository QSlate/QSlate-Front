'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Check, Download, LayoutGrid, Search, Star, Store } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import { useInvalidateStrategies, useStrategies } from '@/entities/strategy';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type MarketplaceItem } from '@/shared/api';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import {
  Badge,
  Button,
  EmptyState,
  IconTile,
  SegmentedControl,
  Skeleton,
} from '@/shared/ui';

type KindFilter = 'all' | 'strategy' | 'widget';

const KIND_OPTIONS = [
  { value: 'all', label: 'Tout' },
  { value: 'strategy', label: 'Stratégies' },
  { value: 'widget', label: 'Widgets' },
] as const;

const PAGE_SIZE = 24;
const FIRST_PAGE: string | undefined = undefined;
const RATING = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 });
const COUNT = new Intl.NumberFormat('fr-FR');

function isKind(value: string): value is KindFilter {
  return KIND_OPTIONS.some((option) => option.value === value);
}

const marketplaceKeys = {
  all: ['marketplace'] as const,
  items: (q: string, kind: KindFilter) =>
    [...marketplaceKeys.all, 'items', q, kind] as const,
  installedWidgets: () =>
    [...marketplaceKeys.all, 'installed-widgets'] as const,
};

/** "Market": published strategies and widgets with real install state. */
export function MarketplaceView() {
  const queryClient = useQueryClient();
  const showToast = useLabStore((state) => state.showToast);
  const strategies = useStrategies();
  const invalidateStrategies = useInvalidateStrategies();
  const [search, setSearch] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const query = useDeferredValue(search.trim());

  const items = useInfiniteQuery({
    queryKey: marketplaceKeys.items(query, kind),
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam }) =>
      apiClient.getMarketplaceItems({
        limit: PAGE_SIZE,
        ...(query ? { q: query } : {}),
        ...(kind !== 'all' ? { kind } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (page) => page.next_cursor || undefined,
  });
  const installedWidgets = useQuery({
    queryKey: marketplaceKeys.installedWidgets(),
    queryFn: async () => (await apiClient.getInstalledWidgets()).items ?? [],
  });

  const list = items.data?.pages.flatMap((page) => page.items ?? []) ?? [];

  const isInstalled = (item: MarketplaceItem) =>
    item.kind === 'strategy'
      ? (strategies.data ?? []).some(
          (strategy) => strategy.id === `market-${item.id}`
        )
      : (installedWidgets.data ?? []).some((widget) => widget.id === item.id);

  const toggle = async (item: MarketplaceItem) => {
    const installed = isInstalled(item);
    setBusyId(item.id);
    try {
      if (installed) await apiClient.uninstallMarketplaceItem(item.id);
      else await apiClient.installMarketplaceItem(item.id, item.version_id);
      await Promise.all([
        invalidateStrategies(),
        queryClient.invalidateQueries({ queryKey: marketplaceKeys.all }),
      ]);
      showToast(
        installed
          ? `« ${item.name} » désinstallé`
          : `« ${item.name} » installé`,
        'success'
      );
    } catch {
      showToast(
        installed
          ? 'Impossible de désinstaller cet élément.'
          : "Impossible d'installer cet élément.",
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      aria-label="Marketplace"
      className="flex flex-col gap-4 px-[22px] py-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-[240px] flex-1 items-center">
          <span className="sr-only">Rechercher</span>
          <Search
            size={14}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 text-fg-3"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher une stratégie ou un widget…"
            className={cn(
              FOCUS_RING,
              'h-9 w-full rounded-[10px] border border-line bg-surface pl-8 pr-3 text-[12.5px] text-fg placeholder:text-fg-3'
            )}
          />
        </label>
        <SegmentedControl
          label="Type"
          options={KIND_OPTIONS}
          value={kind}
          onValueChange={(value) => {
            if (isKind(value)) setKind(value);
          }}
        />
      </div>

      {items.isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : items.isError ? (
        <p role="alert" className="m-0 text-xs text-loss">
          Impossible de charger la marketplace.
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Store />}
          title={
            query || kind !== 'all'
              ? 'Aucun résultat'
              : 'La marketplace est vide'
          }
          description={
            query || kind !== 'all'
              ? 'Essaie un autre mot-clé ou un autre type.'
              : 'Les stratégies et widgets publiés par la communauté apparaîtront ici.'
          }
        />
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3 p-0">
          {list.map((item) => {
            const installed = isInstalled(item);
            const busy = busyId === item.id;
            return (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-[var(--card-hl),var(--surface)] p-4 shadow-card"
              >
                <div className="flex items-start gap-3">
                  <IconTile
                    icon={item.kind === 'strategy' ? <Store /> : <LayoutGrid />}
                    tone={item.kind === 'strategy' ? 'vio' : 'brand'}
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <h2 className="m-0 truncate text-[13.5px] font-semibold text-fg">
                      {item.name}
                    </h2>
                    <span className="text-[11.5px] text-fg-3">
                      {item.kind === 'strategy' ? 'Stratégie' : 'Widget'}
                      {item.category ? ` · ${item.category}` : ''}
                    </span>
                  </div>
                  {installed ? (
                    <Badge tone="gain" dot>
                      Installé
                    </Badge>
                  ) : null}
                </div>
                <p className="m-0 line-clamp-3 flex-1 text-[12.5px] text-fg-2">
                  {item.description || 'Pas de description.'}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-3 font-mono text-[11.5px] text-fg-3">
                    <span
                      className="flex items-center gap-1"
                      title="Installations"
                    >
                      <Download size={12} aria-hidden="true" />
                      <span className="sr-only">Installations : </span>
                      {COUNT.format(item.install_count)}
                    </span>
                    {item.review_count > 0 ? (
                      <span
                        className="flex items-center gap-1"
                        title="Note moyenne"
                      >
                        <Star size={12} aria-hidden="true" />
                        <span className="sr-only">Note moyenne : </span>
                        {RATING.format(item.average_rating)} (
                        {COUNT.format(item.review_count)})
                      </span>
                    ) : (
                      <span>Pas encore d&apos;avis</span>
                    )}
                  </span>
                  <Button
                    size="sm"
                    variant={installed ? 'secondary' : 'primary'}
                    leadingIcon={
                      installed ? <Check size={13} /> : <Download size={13} />
                    }
                    disabled={busy}
                    onClick={() => void toggle(item)}
                    aria-label={
                      installed
                        ? `Désinstaller ${item.name}`
                        : `Installer ${item.name}`
                    }
                  >
                    {busy ? '…' : installed ? 'Désinstaller' : 'Installer'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {items.hasNextPage ? (
        <Button
          variant="quiet"
          className="self-center"
          disabled={items.isFetchingNextPage}
          onClick={() => void items.fetchNextPage()}
        >
          {items.isFetchingNextPage ? 'Chargement…' : 'Afficher plus'}
        </Button>
      ) : null}
    </section>
  );
}
