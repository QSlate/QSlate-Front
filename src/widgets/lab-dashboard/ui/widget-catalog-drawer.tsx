'use client';

import { Check, LayoutGrid, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

import {
  LAB_WIDGETS,
  type LabWidgetType,
  WIDGET_CATEGORY_LABELS,
  type WidgetCategory,
} from '@/entities/widget';
import { cn } from '@/shared/lib/class-names';
import { Button, Drawer, IconTile, Sparkline } from '@/shared/ui';

/** Shape of the curves in the previews (illustration, not data). */
const RISING = [3, 4, 3.6, 5, 4.7, 6.2, 5.8, 7.4, 8.1] as const;
const FALLING = [8, 7.2, 7.6, 5.9, 6.3, 4.8, 5.2, 3.9, 3.1] as const;

interface KpiPreviewProps {
  /** Direction glyph and unit shown in place of a value. */
  readonly value: string;
  readonly tone: 'gain' | 'loss' | 'neutral';
  readonly children: ReactNode;
}

/** KPI preview: the value's shape (glyph, unit) next to its visual. */
function KpiPreview({ value, tone, children }: KpiPreviewProps) {
  return (
    <div className="absolute inset-x-3 inset-y-2.5 flex items-end justify-between gap-2">
      <span
        className={cn(
          'font-mono text-[17px] font-semibold leading-none tracking-[-0.03em]',
          tone === 'gain' && 'text-gain',
          tone === 'loss' && 'text-loss',
          tone === 'neutral' && 'text-fg'
        )}
      >
        {value}
      </span>
      {children}
    </div>
  );
}

function ChartPreview({ children }: { readonly children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 140 44"
      className="absolute inset-x-3 inset-y-2.5 h-[calc(100%-20px)] w-[calc(100%-24px)]"
      preserveAspectRatio="none"
    >
      {children}
    </svg>
  );
}

/** Schematic preview of a widget kind (illustration, not data). */
function WidgetPreview({ type }: { readonly type: LabWidgetType }) {
  switch (type) {
    case 'net-return':
      return (
        <KpiPreview value="▲ %" tone="gain">
          <div className="h-8 w-[60%]">
            <Sparkline data={RISING} tone="gain" area />
          </div>
        </KpiPreview>
      );
    case 'max-drawdown':
      return (
        <KpiPreview value="▼ %" tone="loss">
          <div className="h-8 w-[60%]">
            <Sparkline data={FALLING} tone="loss" area />
          </div>
        </KpiPreview>
      );
    case 'sharpe':
      return (
        <KpiPreview value="0–3" tone="neutral">
          <svg viewBox="0 0 66 40" className="h-9 w-[58px]">
            <path
              d="M7 36 A26 26 0 0 1 59 36"
              fill="none"
              stroke="var(--line-strong)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d="M7 36 A26 26 0 0 1 46 13"
              fill="none"
              stroke="var(--a1)"
              strokeWidth="6"
              strokeLinecap="round"
            />
          </svg>
        </KpiPreview>
      );
    case 'win-rate':
      return (
        <KpiPreview value="%" tone="neutral">
          <svg viewBox="0 0 44 44" className="size-10 -rotate-90">
            <circle
              cx="22"
              cy="22"
              r="16"
              fill="none"
              stroke="var(--loss-soft)"
              strokeWidth="6"
            />
            <circle
              cx="22"
              cy="22"
              r="16"
              fill="none"
              stroke="var(--gain)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="62 101"
            />
          </svg>
        </KpiPreview>
      );
    case 'capital-chart':
      return (
        <ChartPreview>
          <path
            d="M0 40 L20 34 L40 36 L60 24 L80 26 L100 14 L120 16 L140 6"
            fill="none"
            stroke="var(--a1)"
            strokeWidth="2.5"
            vectorEffect="non-scaling-stroke"
          />
        </ChartPreview>
      );
    case 'price-chart':
      return (
        <ChartPreview>
          {[
            [16, 6, 34, 12, 26, 'gain'],
            [44, 4, 30, 8, 22, 'loss'],
            [72, 12, 38, 16, 30, 'gain'],
            [100, 4, 30, 8, 24, 'gain'],
            [126, 10, 36, 14, 28, 'loss'],
          ].map(([x, top, bottom, bodyTop, bodyBottom, tone]) => (
            <g key={x}>
              <path
                d={`M${x} ${top} V${bottom}`}
                stroke="var(--fg-3)"
                strokeWidth="1.2"
                vectorEffect="non-scaling-stroke"
              />
              <rect
                x={Number(x) - 5}
                y={bodyTop}
                width="10"
                height={Number(bodyBottom) - Number(bodyTop)}
                rx="1.5"
                fill={`var(--${tone})`}
              />
            </g>
          ))}
        </ChartPreview>
      );
    case 'drawdowns':
      return (
        <ChartPreview>
          <path
            d="M0 4 L20 4 L30 18 L45 10 L60 4 L80 4 L95 30 L115 14 L140 4 L140 0 L0 0 Z"
            fill="var(--loss-soft)"
            stroke="var(--loss)"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        </ChartPreview>
      );
    case 'monthly-returns':
      return (
        <ChartPreview>
          {Array.from({ length: 12 }, (_, index) => (
            <rect
              key={index}
              x={(index % 6) * 23.6}
              y={index < 6 ? 4 : 24}
              width="21"
              height="16"
              rx="3"
              fill={index % 3 === 1 ? 'var(--loss)' : 'var(--gain)'}
              opacity={0.3 + ((index * 7) % 5) * 0.14}
            />
          ))}
        </ChartPreview>
      );
    case 'trade-distribution':
      return (
        <ChartPreview>
          {[6, 12, 20, 30, 36, 26, 16, 8].map((height, index) => (
            <rect
              key={index}
              x={index * 17.5 + 1}
              y={44 - height}
              width="14"
              height={height}
              rx="2"
              fill={index < 3 ? 'var(--loss)' : 'var(--gain)'}
              opacity="0.7"
            />
          ))}
        </ChartPreview>
      );
    case 'trades':
      return (
        <ChartPreview>
          {[6, 18, 30, 42].map((y, index) => (
            <g key={y}>
              <rect
                x="0"
                y={y - 4}
                width="104"
                height="7"
                rx="3"
                fill="var(--line-strong)"
              />
              <rect
                x="112"
                y={y - 4}
                width="28"
                height="7"
                rx="3"
                fill={index % 2 === 0 ? 'var(--gain)' : 'var(--loss)'}
                opacity="0.7"
              />
            </g>
          ))}
        </ChartPreview>
      );
  }
}

const CATEGORIES: readonly WidgetCategory[] = [
  'performance',
  'risk',
  'trades',
  'market',
];

interface WidgetCatalogDrawerProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly placed: readonly LabWidgetType[];
  readonly onAdd: (type: LabWidgetType) => void;
}

/** "Ajouter un widget": catalogue with previews and an action per widget. */
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
      {CATEGORIES.map((category) => {
        const widgets = LAB_WIDGETS.filter(
          (widget) => widget.category === category
        );
        if (widgets.length === 0) return null;
        return (
          <section
            key={category}
            aria-label={WIDGET_CATEGORY_LABELS[category]}
            className="flex flex-col gap-2.5"
          >
            <h3 className="m-0 flex items-center gap-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.07em] text-fg-3 after:h-px after:flex-1 after:bg-line">
              {WIDGET_CATEGORY_LABELS[category]}
            </h3>
            <ul className="m-0 grid list-none auto-rows-fr grid-cols-2 gap-2.5 p-0">
              {widgets.map((widget, index) => {
                const added = placed.includes(widget.type);
                // A lone last card spans the row instead of leaving a hole.
                const lone =
                  widgets.length % 2 === 1 && index === widgets.length - 1;
                return (
                  <li
                    key={widget.type}
                    className={cn(
                      'flex min-w-0 flex-col overflow-hidden rounded-xl border bg-surface',
                      added
                        ? 'border-line'
                        : 'border-line hover:border-line-strong',
                      lone && 'col-span-2'
                    )}
                  >
                    <div
                      aria-hidden="true"
                      className={cn(
                        'relative h-[70px] shrink-0 border-b border-[var(--line-2)] bg-sunken',
                        added && 'opacity-60'
                      )}
                    >
                      <WidgetPreview type={widget.type} />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 px-2.5 pb-2.5 pt-2">
                      <p className="m-0 truncate text-xs font-semibold text-fg">
                        {widget.title}
                      </p>
                      <p
                        title={widget.description}
                        className="m-0 line-clamp-2 flex-1 text-[11px] leading-[1.45] text-fg-3"
                      >
                        {widget.description}
                      </p>
                      {added ? (
                        <span className="mt-1 inline-flex h-7 items-center gap-1.5 self-start rounded-lg bg-gain-soft px-2.5 text-xs font-medium text-gain">
                          <Check size={13} aria-hidden="true" />
                          Sur le dashboard
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-1 self-start"
                          leadingIcon={<Plus size={13} />}
                          aria-label={`Ajouter ${widget.title}`}
                          onClick={() => onAdd(widget.type)}
                        >
                          Ajouter
                        </Button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </Drawer>
  );
}
