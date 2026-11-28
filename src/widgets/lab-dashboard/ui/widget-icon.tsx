import {
  CalendarDays,
  ChartArea,
  ChartCandlestick,
  ChartColumn,
  ChartLine,
  Gauge,
  List,
  MonitorPlay,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import type { LabWidgetType } from '@/entities/widget';

const ICONS = {
  'net-return': TrendingUp,
  'max-drawdown': TrendingDown,
  sharpe: Gauge,
  'win-rate': Target,
  'capital-chart': ChartLine,
  'price-chart': ChartCandlestick,
  replay: MonitorPlay,
  drawdowns: ChartArea,
  'monthly-returns': CalendarDays,
  'trade-distribution': ChartColumn,
  trades: List,
} as const satisfies Record<LabWidgetType, typeof TrendingUp>;

export function WidgetIcon({ type }: { readonly type: LabWidgetType }) {
  const Icon = ICONS[type];
  return <Icon aria-hidden="true" />;
}
