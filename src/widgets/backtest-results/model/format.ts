const NUMBER_2 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const NUMBER_1 = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const AMOUNT = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const PRICE = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
const DAY = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const DAY_TIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit',
  month: 'short',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});

export const MONTH_LABELS = [
  'Janv.',
  'Févr.',
  'Mars',
  'Avr.',
  'Mai',
  'Juin',
  'Juil.',
  'Août',
  'Sept.',
  'Oct.',
  'Nov.',
  'Déc.',
] as const;

export type Direction = 'up' | 'down' | 'flat';

export function directionOf(value: number): Direction {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

/** "▲ +18,4 %", "▼ −3,2 %", "0,0 %" (arrow + sign, never color alone). */
export function formatSignedPercent(value: number, digits: 1 | 2 = 1): string {
  const formatter = digits === 1 ? NUMBER_1 : NUMBER_2;
  const body = `${formatter.format(Math.abs(value))} %`;
  if (value > 0) return `▲ +${body}`;
  if (value < 0) return `▼ −${body}`;
  return body;
}

/** "+1 842 USD", "−320 USD". */
export function formatSignedUsd(value: number): string {
  const body = `${AMOUNT.format(Math.abs(value))} USD`;
  if (value > 0) return `+${body}`;
  if (value < 0) return `−${body}`;
  return body;
}

export function formatUsd(value: number): string {
  return `${AMOUNT.format(value)} USD`;
}

export function formatAmount(value: number): string {
  return AMOUNT.format(value);
}

export function formatPrice(value: number): string {
  return PRICE.format(value);
}

export function formatRatio(value: number): string {
  return NUMBER_2.format(value);
}

/** "18,4" (French decimal comma, one digit). */
export function formatDecimal(value: number): string {
  return NUMBER_1.format(value);
}

export function formatPercent(value: number): string {
  return `${NUMBER_1.format(value)} %`;
}

/** Unix seconds → "18 mars 2025". */
export function formatDay(seconds: number): string {
  return DAY.format(seconds * 1_000);
}

/** Unix seconds → "18 mars 25 14:00". */
export function formatDayTime(seconds: number): string {
  return DAY_TIME.format(seconds * 1_000);
}
