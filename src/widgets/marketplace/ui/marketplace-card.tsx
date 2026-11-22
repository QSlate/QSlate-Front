'use client';

import {
  Check,
  Download,
  Ellipsis,
  LayoutGrid,
  MessageSquare,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  type FocusEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import type { MarketplaceItem } from '@/shared/api';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { Button, IconButton } from '@/shared/ui';

import { categoryLabel, isKindCategory, kindLabel } from '../model/labels';
import { RatingSummary } from './rating-stars';

const COUNT = new Intl.NumberFormat('fr-FR');

/** Large icon tile of an item kind. */
export function ItemIcon({ kind }: { readonly kind: MarketplaceItem['kind'] }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid size-10 flex-none place-items-center rounded-xl [&_svg]:size-[18px]',
        kind === 'strategy'
          ? 'bg-vio-soft text-vio'
          : 'bg-brand-soft text-brand'
      )}
    >
      {kind === 'strategy' ? <TrendingUp /> : <LayoutGrid />}
    </span>
  );
}

interface ItemMenuProps {
  readonly itemName: string;
  readonly disabled: boolean;
  readonly onUninstall: () => void;
}

/** "…" menu of an installed item (Désinstaller). */
function ItemMenu({ itemName, disabled, onUninstall }: ItemMenuProps) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    itemRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !containerRef.current?.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next))
      setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur}>
      <IconButton
        ref={triggerRef}
        icon={<Ellipsis size={16} />}
        label={`Plus d'actions pour ${itemName}`}
        variant="quiet"
        size="sm"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      />
      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label={`Actions pour ${itemName}`}
          className="absolute bottom-full right-0 z-10 mb-1 min-w-[170px] rounded-xl border border-line-strong bg-raised p-1 shadow-[var(--shadow-2)]"
        >
          <button
            ref={itemRef}
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onUninstall();
            }}
            className={cn(
              FOCUS_RING,
              'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-loss hover:bg-loss-soft'
            )}
          >
            <Trash2 size={14} aria-hidden="true" />
            Désinstaller
          </button>
        </div>
      ) : null}
    </div>
  );
}

interface MarketplaceCardProps {
  readonly item: MarketplaceItem;
  readonly author: string;
  readonly installed: boolean;
  readonly busy: boolean;
  readonly canReview: boolean;
  readonly onOpen: () => void;
  readonly onReview: () => void;
  readonly onInstall: () => void;
  readonly onUninstall: () => void;
}

function Meta({ children }: { readonly children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11.5px] text-fg-3">
      {children}
    </span>
  );
}

/**
 * Catalogue card. The title opens the detail dialog and stretches over the
 * card; the actions sit above that link layer.
 */
export function MarketplaceCard({
  item,
  author,
  installed,
  busy,
  canReview,
  onOpen,
  onReview,
  onInstall,
  onUninstall,
}: MarketplaceCardProps) {
  return (
    <article className="group relative flex h-full flex-col gap-3 rounded-2xl border border-line bg-surface p-4 shadow-card transition-colors hover:border-line-strong">
      <header className="flex items-start gap-3">
        <ItemIcon kind={item.kind} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="m-0 text-[14px] font-semibold leading-snug text-fg">
            <button
              type="button"
              onClick={onOpen}
              aria-label={`Voir le détail de ${item.name}`}
              className={cn(
                FOCUS_RING,
                'line-clamp-2 rounded text-left after:absolute after:inset-0 after:rounded-2xl after:content-[""]'
              )}
            >
              {item.name}
            </button>
          </h2>
          <span className="truncate text-[11.5px] text-fg-3">
            par <span className="text-fg-2">{author}</span>
          </span>
        </div>
      </header>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-sunken px-2 py-0.5 text-[11px] font-medium text-fg-2">
          {kindLabel(item.kind)}
        </span>
        {item.category && !isKindCategory(item.category, item.kind) ? (
          <span className="rounded-md border border-line px-2 py-0.5 text-[11px] text-fg-3">
            {categoryLabel(item.category)}
          </span>
        ) : null}
      </div>
      <p className="m-0 line-clamp-3 flex-1 text-[12.5px] leading-relaxed text-fg-2">
        {item.description || 'Pas de description.'}
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <RatingSummary
          average={item.average_rating}
          count={item.review_count}
        />
        <Meta>
          <Download size={12} aria-hidden="true" />
          <span className="font-mono">{COUNT.format(item.install_count)}</span>
          <span className="sr-only">installations</span>
        </Meta>
      </div>
      <footer className="relative z-[1] flex items-center gap-2 border-t border-[var(--line-2)] pt-3">
        {canReview ? (
          <Button
            variant="quiet"
            size="sm"
            leadingIcon={<MessageSquare size={13} />}
            aria-label={`Donner un avis sur ${item.name}`}
            onClick={onReview}
          >
            Donner un avis
          </Button>
        ) : null}
        <span className="flex-1" />
        {installed ? (
          <>
            <span className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-gain-soft px-2.5 text-xs font-medium text-gain">
              <Check size={13} aria-hidden="true" />
              Installé
            </span>
            <ItemMenu
              itemName={item.name}
              disabled={busy}
              onUninstall={onUninstall}
            />
          </>
        ) : (
          <Button
            size="sm"
            variant="primary"
            leadingIcon={<Download size={13} />}
            disabled={busy}
            aria-label={`Installer ${item.name}`}
            onClick={onInstall}
          >
            {busy ? 'Installation…' : 'Installer'}
          </Button>
        )}
      </footer>
    </article>
  );
}
