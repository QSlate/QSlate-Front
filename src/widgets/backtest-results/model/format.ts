export const money = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});
export const signed = (value: number, digits = 1) =>
  `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;
