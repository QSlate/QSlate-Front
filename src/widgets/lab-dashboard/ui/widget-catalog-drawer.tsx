'use client';

import { Check, LayoutGrid, Plus } from 'lucide-react';

import {
  LAB_WIDGETS,
  type LabWidgetType,
  WIDGET_CATEGORY_LABELS,
  type WidgetCategory,
} from '@/entities/widget';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { Drawer, IconTile } from '@/shared/ui';

/** Schematic preview of a widget kind (illustration, not data). */
function WidgetPreview({ type }: { readonly type: LabWidgetType }) {
  const stroke = 'var(--a1)';
  switch (type) {
    case 'capital-chart':
      return (
        <path
          d="M0 40 L20 34 L40 36 L60 24 L80 26 L100 14 L120 16 L140 6"
          fill="none"
          stroke={stroke}
          strokeWidth="2.5"
        />
      );
    case 'drawdowns':
      return (
        <path
          d="M0 4 L20 4 L30 18 L45 10 L60 4 L80 4 L95 30 L115 14 L140 4 L140 0 L0 0 Z"
          fill="var(--loss-soft)"
          stroke="var(--loss)"
          strokeWidth="1.5"
        />
      );
    case 'monthly-returns':
      return (
        <g>
          {Array.from({ length: 12 }, (_, index) => (
            <rect
              key={index}
              x={(index % 6) * 23}
              y={index < 6 ? 6 : 26}
              width="20"
              height="16"
              rx="3"
              fill={index % 3 === 1 ? 'var(--loss-soft)' : 'var(--gain-soft)'}
            />
          ))}
        </g>
      );
    case 'trade-distribution':
      return (
        <g>
          {[6, 12, 20, 30, 36, 26, 16, 8].map((height, index) => (
            <rect
              key={index}
              x={index * 17 + 2}
              y={44 - height}
              width="13"
              height={height}
              rx="2"
              fill={index < 3 ? 'var(--loss-soft)' : 'var(--gain-soft)'}
            />
          ))}
        </g>
      );
    case 'trades':
      return (
        <g>
          {[6, 18, 30, 42].map((y) => (
            <rect
              key={y}
              x="0"
              y={y - 4}
              width="140"
              height="7"
              rx="3"
              fill="var(--line-strong)"
            />
          ))}
        </g>
      );
    case 'sharpe':
      return (
        <path
          d="M40 40 A30 30 0 0 1 100 40"
          fill="none"
          stroke={stroke}
          strokeWidth="6"
          strokeLinecap="round"
        />
      );
    case 'win-rate':
      return (
        <circle
          cx="70"
          cy="24"
          r="17"
          fill="none"
          stroke="var(--gain)"
          strokeWidth="6"
          strokeDasharray="70 107"
        />
      );
    default:
      return (
        <g>
          <rect
            x="0"
            y="8"
            width="70"
            height="14"
            rx="4"
            fill="var(--line-strong)"
          />
          <rect x="0" y="30" width="100" height="6" rx="3" fill="var(--line)" />
        </g>
      );
  }
}

const CATEGORIES: readonly WidgetCategory[] = ['performance', 'risk', 'trades'];

interface WidgetCatalogDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly placed: readonly LabWidgetType[];
  readonly onAdd: (type: LabWidgetType) => void;
}

/** "Ajouter un widget": catalogue with previews and a + per widget. */
export function WidgetCatalogDrawer({
  open,
  onClose,
  placed,
  onAdd,
}: WidgetCatalogDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ajouter un widget"
      description="Chaque widget s'ajoute en bas du dashboard."
      icon={<IconTile icon={<LayoutGrid />} tone="brand" />}
    >
      {CATEGORIES.map((category) => (
        <section
          key={category}
          aria-label={WIDGET_CATEGORY_LABELS[category]}
          className="flex flex-col gap-2.5"
        >
          <h3 className="m-0 flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-fg-3 after:h-px after:flex-1 after:bg-line">
            {WIDGET_CATEGORY_LABELS[category]}
          </h3>
          <ul className="m-0 grid list-none grid-cols-2 gap-2.5 p-0">
            {LAB_WIDGETS.filter((widget) => widget.category === category).map(
              (widget) => {
                const added = placed.includes(widget.type);
                return (
                  <li
                    key={widget.type}
                    className="relative overflow-hidden rounded-xl border border-line bg-surface"
                  >
                    <div
                      aria-hidden="true"
                      className="relative h-[70px] border-b border-[var(--line-2)] bg-sunken"
                    >
                      <svg
                        viewBox="0 0 140 44"
                        className="absolute inset-x-3 inset-y-2.5 h-[calc(100%-20px)] w-[calc(100%-24px)]"
                        preserveAspectRatio="none"
                      >
                        <WidgetPreview type={widget.type} />
                      </svg>
                    </div>
                    <p className="m-0 px-2.5 pb-px pt-2 text-xs font-semibold text-fg">
                      {widget.title}
                    </p>
                    <p className="m-0 line-clamp-2 px-2.5 pb-[9px] text-[11px] text-fg-3">
                      {widget.description}
                    </p>
                    <button
                      type="button"
                      disabled={added}
                      aria-label={
                        added
                          ? `${widget.title} : déjà sur le dashboard`
                          : `Ajouter ${widget.title}`
                      }
                      onClick={() => onAdd(widget.type)}
                      className={cn(
                        FOCUS_RING,
                        'absolute right-2 top-2 grid size-6 place-items-center rounded-lg',
                        added
                          ? 'bg-gain-soft text-gain'
                          : 'bg-brand text-white shadow-[0_4px_10px_-2px_var(--glow)]'
                      )}
                    >
                      {added ? (
                        <Check size={13} aria-hidden="true" />
                      ) : (
                        <Plus size={13} aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              }
            )}
          </ul>
        </section>
      ))}
    </Drawer>
  );
}
