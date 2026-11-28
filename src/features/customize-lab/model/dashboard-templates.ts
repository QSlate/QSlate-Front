import type { LabWidgetType } from '@/entities/widget';

import {
  type DashboardLayout,
  DEFAULT_DASHBOARD_LAYOUT,
  sanitizeDashboardLayout,
} from './dashboard-layout';

export type DashboardTemplateId = 'empty' | 'essential' | 'complete' | 'trades';

export interface DashboardTemplate {
  readonly id: DashboardTemplateId;
  readonly title: string;
  readonly description: string;
  readonly layout: DashboardLayout;
}

type Placement = readonly [
  type: LabWidgetType,
  x: number,
  y: number,
  w: number,
  h: number,
];

/** Builds a layout through the stored-layout rules (min sizes, compaction). */
function layoutOf(placements: readonly Placement[]): DashboardLayout {
  return (
    sanitizeDashboardLayout(
      placements.map(([i, x, y, w, h]) => ({ i, x, y, w, h }))
    ) ?? []
  );
}

/** The starting points offered when a dashboard is created. */
export const DASHBOARD_TEMPLATES: readonly DashboardTemplate[] = [
  {
    id: 'essential',
    title: 'Essentiel',
    description:
      'Les chiffres clés, l’évolution du capital et les trades sur le prix : de quoi juger un backtest d’un coup d’œil.',
    layout: layoutOf([
      ['net-return', 0, 0, 4, 3],
      ['max-drawdown', 4, 0, 4, 3],
      ['win-rate', 8, 0, 4, 3],
      ['capital-chart', 0, 3, 12, 7],
      ['price-chart', 0, 10, 12, 8],
    ]),
  },
  {
    id: 'complete',
    title: 'Analyse complète',
    description:
      'Tous les widgets : performance, risque, rendements mensuels, répartition, journal des trades et replay.',
    layout: layoutOf([
      ...DEFAULT_DASHBOARD_LAYOUT.filter((item) => item.i !== 'trades').map(
        ({ i, x, y, w, h }): Placement => [i, x, y, w, h]
      ),
      ['price-chart', 0, 15, 12, 8],
      ['trades', 0, 23, 12, 7],
      ['replay', 0, 30, 12, 10],
    ]),
  },
  {
    id: 'trades',
    title: 'Analyse des trades',
    description:
      'Le replay du backtest bougie par bougie, la part de trades gagnants, leur répartition et le journal détaillé.',
    layout: layoutOf([
      ['replay', 0, 0, 12, 10],
      ['win-rate', 0, 10, 4, 5],
      ['trade-distribution', 4, 10, 8, 5],
      ['monthly-returns', 0, 15, 12, 5],
      ['trades', 0, 20, 12, 7],
    ]),
  },
  {
    id: 'empty',
    title: 'Vide',
    description: 'Aucun widget : tu ajoutes toi-même ceux dont tu as besoin.',
    layout: [],
  },
];

export const DEFAULT_DASHBOARD_TEMPLATE: DashboardTemplateId = 'essential';

/** Starting layout of a template. */
export function templateLayout(id: DashboardTemplateId): DashboardLayout {
  return (
    DASHBOARD_TEMPLATES.find((template) => template.id === id)?.layout ?? []
  );
}
