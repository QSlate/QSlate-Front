import type {
  LabWidgetDefinition,
  LabWidgetType,
  WidgetCategory,
} from './types';

/** Single source of truth for the Lab result widgets. */
export const LAB_WIDGETS: readonly LabWidgetDefinition[] = [
  {
    type: 'net-return',
    title: 'Rendement net',
    description:
      'Gain ou perte total en % du capital de départ, frais inclus, sur toute la période testée.',
    category: 'performance',
    tone: 'gain',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
  },
  {
    type: 'max-drawdown',
    title: 'Baisse maximale',
    description:
      'La plus forte chute du capital entre un sommet et le creux qui suit. Plus elle est faible, moins la stratégie est risquée.',
    category: 'risk',
    tone: 'loss',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
  },
  {
    type: 'sharpe',
    title: 'Ratio de Sharpe',
    description:
      'Rendement obtenu par unité de risque. Au-dessus de 1 c’est bien, au-dessus de 2 c’est excellent.',
    category: 'risk',
    tone: 'brand',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
  },
  {
    type: 'win-rate',
    title: 'Trades gagnants',
    description: 'Part des trades clôturés avec un gain.',
    category: 'trades',
    tone: 'vio',
    defaultSize: { w: 3, h: 3 },
    minSize: { w: 2, h: 3 },
  },
  {
    type: 'capital-chart',
    title: 'Capital',
    description:
      'Évolution du capital au fil du temps, avec les entrées en position.',
    category: 'performance',
    tone: 'brand',
    defaultSize: { w: 8, h: 7 },
    minSize: { w: 4, h: 5 },
  },
  {
    type: 'price-chart',
    title: 'Graphique de prix',
    description:
      'Bougies et volumes des données du backtest affiché, avec les achats et ventes de la stratégie.',
    category: 'performance',
    tone: 'brand',
    defaultSize: { w: 8, h: 8 },
    minSize: { w: 5, h: 6 },
  },
  {
    type: 'drawdowns',
    title: 'Baisses dans le temps',
    description:
      'Écart du capital par rapport à son précédent sommet, à chaque instant.',
    category: 'risk',
    tone: 'loss',
    defaultSize: { w: 4, h: 7 },
    minSize: { w: 3, h: 4 },
  },
  {
    type: 'monthly-returns',
    title: 'Rendements mensuels',
    description:
      'Rendement de chaque mois, calculé à partir de la courbe de capital.',
    category: 'performance',
    tone: 'amber',
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 4 },
  },
  {
    type: 'trade-distribution',
    title: 'Répartition des trades',
    description:
      'Nombre de trades par tranche de rendement : les gros gains et les grosses pertes sautent aux yeux.',
    category: 'trades',
    tone: 'vio',
    defaultSize: { w: 6, h: 5 },
    minSize: { w: 3, h: 4 },
  },
  {
    type: 'trades',
    title: 'Trades',
    description:
      'Journal des trades : entrée, sortie, prix et résultat de chacun.',
    category: 'trades',
    tone: 'brand',
    defaultSize: { w: 12, h: 7 },
    minSize: { w: 6, h: 4 },
  },
];

export const WIDGET_CATEGORY_LABELS: Readonly<Record<WidgetCategory, string>> =
  {
    performance: 'Performance',
    risk: 'Risque',
    trades: 'Trades',
  };

export function isLabWidgetType(value: unknown): value is LabWidgetType {
  return LAB_WIDGETS.some((widget) => widget.type === value);
}

export function findLabWidget(type: string): LabWidgetDefinition | null {
  return LAB_WIDGETS.find((widget) => widget.type === type) ?? null;
}
