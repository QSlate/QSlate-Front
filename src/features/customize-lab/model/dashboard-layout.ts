import { moveElement, verticalCompactor } from 'react-grid-layout';

import {
  findLabWidget,
  LAB_WIDGETS,
  type LabWidgetType,
} from '@/entities/widget';

export const GRID_COLUMNS = 12;
const MAX_ROWS = 200;

/** One placed widget (one instance per widget type). */
export interface DashboardItem {
  readonly i: LabWidgetType;
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}

export type DashboardLayout = readonly DashboardItem[];

const DEFAULT_PLACEMENT: readonly (readonly [LabWidgetType, number, number])[] =
  [
    ['net-return', 0, 0],
    ['max-drawdown', 3, 0],
    ['sharpe', 6, 0],
    ['win-rate', 9, 0],
    ['capital-chart', 0, 3],
    ['drawdowns', 8, 3],
    ['monthly-returns', 0, 10],
    ['trade-distribution', 6, 10],
    ['trades', 0, 15],
  ];

/** KPIs on top, then the charts, then the trade journal. */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout =
  DEFAULT_PLACEMENT.flatMap(([type, x, y]) => {
    const widget = findLabWidget(type);
    return widget
      ? [{ i: type, x, y, w: widget.defaultSize.w, h: widget.defaultSize.h }]
      : [];
  });

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function integer(value: unknown, min: number, max: number): number | null {
  return typeof value === 'number' && Number.isInteger(value)
    ? Math.min(max, Math.max(min, value))
    : null;
}

/** Clamps an item to the grid and to its widget's minimum size. */
export function clampItem(item: DashboardItem): DashboardItem {
  const widget = findLabWidget(item.i);
  const minW = widget?.minSize.w ?? 1;
  const minH = widget?.minSize.h ?? 1;
  const w = Math.min(GRID_COLUMNS, Math.max(minW, item.w));
  const h = Math.min(MAX_ROWS, Math.max(minH, item.h));
  return {
    i: item.i,
    w,
    h,
    x: Math.min(GRID_COLUMNS - w, Math.max(0, item.x)),
    y: Math.max(0, item.y),
  };
}

/** Validates a stored layout: unknown widgets and duplicates are dropped. */
export function sanitizeDashboardLayout(
  value: unknown
): DashboardLayout | null {
  if (!Array.isArray(value)) return null;
  const seen = new Set<string>();
  const items: DashboardItem[] = [];
  for (const raw of value) {
    if (!isRecord(raw)) continue;
    const widget = typeof raw.i === 'string' ? findLabWidget(raw.i) : null;
    if (!widget || seen.has(widget.type)) continue;
    const x = integer(raw.x, 0, GRID_COLUMNS - 1);
    const y = integer(raw.y, 0, MAX_ROWS);
    const w = integer(raw.w, 1, GRID_COLUMNS);
    const h = integer(raw.h, 1, MAX_ROWS);
    if (x === null || y === null || w === null || h === null) continue;
    seen.add(widget.type);
    items.push(clampItem({ i: widget.type, x, y, w, h }));
  }
  return compactLayout(items);
}

function toMutable(layout: DashboardLayout) {
  return layout.map((item) => ({ ...item }));
}

function fromGrid(
  layout: readonly { i: string; x: number; y: number; w: number; h: number }[]
): DashboardLayout {
  return layout.flatMap((item) => {
    const widget = findLabWidget(item.i);
    return widget
      ? [
          clampItem({
            i: widget.type,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          }),
        ]
      : [];
  });
}

/** Moves items up to fill gaps (same rule as the drag-and-drop grid). */
export function compactLayout(layout: DashboardLayout): DashboardLayout {
  return fromGrid(verticalCompactor.compact(toMutable(layout), GRID_COLUMNS));
}

/** Applies a grid callback layout, keeping our own constraints. */
export function fromGridLayout(
  layout: readonly { i: string; x: number; y: number; w: number; h: number }[]
): DashboardLayout {
  return compactLayout(fromGrid(layout));
}

/** Adds a widget at its default size below the existing ones. */
export function addDashboardWidget(
  layout: DashboardLayout,
  type: LabWidgetType
): DashboardLayout {
  if (layout.some((item) => item.i === type)) return layout;
  const widget = findLabWidget(type);
  if (!widget) return layout;
  const bottom = layout.reduce(
    (max, item) => Math.max(max, item.y + item.h),
    0
  );
  return compactLayout([
    ...layout,
    {
      i: type,
      x: 0,
      y: bottom,
      w: widget.defaultSize.w,
      h: widget.defaultSize.h,
    },
  ]);
}

export function removeDashboardWidget(
  layout: DashboardLayout,
  type: LabWidgetType
): DashboardLayout {
  return compactLayout(layout.filter((item) => item.i !== type));
}

/** Keyboard move by whole cells; other widgets make room. */
export function moveDashboardWidget(
  layout: DashboardLayout,
  type: LabWidgetType,
  dx: number,
  dy: number
): DashboardLayout {
  const mutable = toMutable(layout);
  const item = mutable.find((candidate) => candidate.i === type);
  if (!item) return layout;
  const x = Math.min(GRID_COLUMNS - item.w, Math.max(0, item.x + dx));
  const y = Math.max(0, item.y + dy);
  return fromGridLayout(
    moveElement(mutable, item, x, y, true, false, 'vertical', GRID_COLUMNS)
  );
}

/** Keyboard resize by whole cells, bounded by the widget's minimum size. */
export function resizeDashboardWidget(
  layout: DashboardLayout,
  type: LabWidgetType,
  dw: number,
  dh: number
): DashboardLayout {
  return compactLayout(
    layout.map((item) =>
      item.i === type
        ? clampItem({ ...item, w: item.w + dw, h: item.h + dh })
        : item
    )
  );
}

export function sameLayout(a: DashboardLayout, b: DashboardLayout): boolean {
  if (a.length !== b.length) return false;
  return a.every((item) => {
    const other = b.find((candidate) => candidate.i === item.i);
    return (
      other !== undefined &&
      other.x === item.x &&
      other.y === item.y &&
      other.w === item.w &&
      other.h === item.h
    );
  });
}

/** Widget types not on the dashboard yet. */
export function availableWidgets(
  layout: DashboardLayout
): readonly LabWidgetType[] {
  return LAB_WIDGETS.map((widget) => widget.type).filter(
    (type) => !layout.some((item) => item.i === type)
  );
}
