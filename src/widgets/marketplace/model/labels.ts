import type { MarketplaceItemKind } from '@/shared/api';

/** French names of the verified marketplace categories. */
const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  strategies: 'Stratégies',
  strategy: 'Stratégie',
  indicators: 'Indicateurs',
  indicator: 'Indicateur',
  visualization: 'Visualisation',
  visualizations: 'Visualisations',
  widgets: 'Widgets',
  risk: 'Risque',
  portfolio: 'Portefeuille',
  execution: 'Exécution',
  data: 'Données',
};

/** "strategies" → "Stratégies"; unknown ids are humanised, never raw. */
export function categoryLabel(id: string, name?: string | undefined): string {
  const known = CATEGORY_LABELS[id.toLowerCase()];
  if (known) return known;
  const text = (name || id).replace(/[-_]+/gu, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : 'Autre';
}

/** "strategies" on a strategy only repeats its kind: not worth a tag. */
export function isKindCategory(
  category: string,
  kind: MarketplaceItemKind
): boolean {
  const id = category.toLowerCase();
  return (
    id === kind ||
    id === `${kind}s` ||
    (kind === 'strategy' && id === 'strategies')
  );
}

export function kindLabel(kind: MarketplaceItemKind): string {
  return kind === 'strategy' ? 'Stratégie' : 'Widget';
}

/** The API only exposes the author's id: name the current user, else a member tag. */
export function authorLabel(
  authorId: number,
  currentUserId: number | null
): string {
  return authorId === currentUserId ? 'Toi' : `Membre n° ${authorId}`;
}
