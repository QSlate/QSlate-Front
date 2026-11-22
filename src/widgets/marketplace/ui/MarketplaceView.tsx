'use client';

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { Search, Store } from 'lucide-react';
import { useDeferredValue, useState } from 'react';

import { useInvalidateStrategies, useStrategies } from '@/entities/strategy';
import { useAuthStore } from '@/entities/user';
import { useLabStore } from '@/features/lab-state';
import { apiClient, type MarketplaceItem } from '@/shared/api';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { Button, EmptyState, SegmentedControl, Skeleton } from '@/shared/ui';

import { authorLabel, categoryLabel } from '../model/labels';
import { ItemDetailDialog } from './item-detail-dialog';
import { MarketplaceCard } from './marketplace-card';

const ALL = 'all';
const PAGE_SIZE = 24;
const FIRST_PAGE: string | undefined = undefined;

const marketplaceKeys = {
  all: ['marketplace'] as const,
  items: (q: string, category: string) =>
    [...marketplaceKeys.all, 'items', q, category] as const,
  categories: () => [...marketplaceKeys.all, 'categories'] as const,
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
  const [category, setCategory] = useState<string>(ALL);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [openedId, setOpenedId] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const query = useDeferredValue(search.trim());

  const items = useInfiniteQuery({
    queryKey: marketplaceKeys.items(query, category),
    initialPageParam: FIRST_PAGE,
    queryFn: ({ pageParam }) =>
      apiClient.getMarketplaceItems({
        limit: PAGE_SIZE,
        ...(query ? { q: query } : {}),
        ...(category !== ALL ? { category } : {}),
        ...(pageParam ? { cursor: pageParam } : {}),
      }),
    getNextPageParam: (page) => page.next_cursor || undefined,
  });
  const categories = useQuery({
    queryKey: marketplaceKeys.categories(),
    queryFn: async () =>
      (await apiClient.getMarketplaceCategories({ limit: 50 })).items ?? [],
    staleTime: Infinity,
  });
  const installedWidgets = useQuery({
    queryKey: marketplaceKeys.installedWidgets(),
    queryFn: async () => (await apiClient.getInstalledWidgets()).items ?? [],
  });

  const list = items.data?.pages.flatMap((page) => page.items ?? []) ?? [];
  const opened = list.find((item) => item.id === openedId) ?? null;
  const filtered = query !== '' || category !== ALL;

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

  const cardProps = (item: MarketplaceItem) => ({
    item,
    author: authorLabel(item.author_id, currentUserId),
    installed: isInstalled(item),
    busy: busyId === item.id,
    canReview: isAuthenticated,
    onInstall: () => void toggle(item),
    onUninstall: () => void toggle(item),
  });

  return (
    <section
      aria-labelledby="marketplace-title"
      className="mx-auto flex w-full max-w-[1280px] flex-col gap-5 px-[22px] py-6"
    >
      <header className="flex flex-col gap-1.5">
        <h2
          id="marketplace-title"
          className="m-0 text-[20px] font-semibold tracking-[-0.02em] text-fg"
        >
          Stratégies et widgets de la communauté
        </h2>
        <p className="m-0 max-w-[640px] text-[13px] leading-relaxed text-fg-3">
          Stratégies et widgets publiés par la communauté. Installe-les en un
          clic : les stratégies rejoignent ta liste dans le Lab, les widgets ton
          catalogue.
        </p>
      </header>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex min-w-0 flex-1 items-center lg:max-w-[420px]">
          <span className="sr-only">Rechercher dans la marketplace</span>
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
        {categories.data && categories.data.length > 0 ? (
          <SegmentedControl
            label="Catégorie"
            className="max-w-full self-start lg:self-auto"
            options={[
              { value: ALL, label: 'Toutes' },
              ...categories.data.map((entry) => ({
                value: entry.id,
                label: categoryLabel(entry.id, entry.name),
              })),
            ]}
            value={category}
            onValueChange={setCategory}
          />
        ) : null}
      </div>

      {items.isPending ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          <Skeleton className="h-[230px]" />
          <Skeleton className="h-[230px]" />
          <Skeleton className="h-[230px]" />
        </div>
      ) : items.isError ? (
        <p role="alert" className="m-0 text-xs text-loss">
          Impossible de charger la marketplace.
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Store />}
          title={filtered ? 'Aucun résultat' : 'La marketplace est vide'}
          description={
            filtered
              ? 'Essaie un autre mot-clé ou une autre catégorie.'
              : 'Les stratégies et widgets publiés par la communauté apparaîtront ici.'
          }
          action={
            filtered ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setCategory(ALL);
                }}
              >
                Effacer les filtres
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4 p-0">
          {list.map((item) => (
            <li key={item.id} className="min-w-0">
              <MarketplaceCard
                {...cardProps(item)}
                onOpen={() => setOpenedId(item.id)}
                onReview={() => setOpenedId(item.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {items.hasNextPage ? (
        <Button
          variant="secondary"
          className="self-center"
          disabled={items.isFetchingNextPage}
          onClick={() => void items.fetchNextPage()}
        >
          {items.isFetchingNextPage ? 'Chargement…' : 'Afficher plus'}
        </Button>
      ) : null}
      {opened ? (
        <ItemDetailDialog
          {...cardProps(opened)}
          onClose={() => setOpenedId(null)}
        />
      ) : null}
    </section>
  );
}
