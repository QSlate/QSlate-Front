const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function getShowcaseFrame(progress: number) {
  const t = clamp((progress - 0.06) / 0.58);
  const open = t * t * t * (t * (t * 6 - 15) + 10);
  const wake = clamp((open - 0.18) / 0.72);

  return {
    open,
    brightness: wake * wake * (3 - 2 * wake),
    y: 0.12 - 0.18 * open,
  };
}
