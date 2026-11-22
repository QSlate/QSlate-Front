/**
 * Keeps at most ~`target` points while preserving each bucket's extremes,
 * so drawdowns and peaks stay visible on long hourly curves.
 */
export function downsample<T>(
  points: readonly T[],
  target: number,
  value: (point: T) => number
): readonly T[] {
  if (points.length <= target) return points;
  const bucket = Math.ceil(points.length / Math.max(2, Math.floor(target / 2)));
  const result: T[] = [];
  for (let start = 0; start < points.length; start += bucket) {
    const slice = points.slice(start, start + bucket);
    let min = slice[0];
    let max = slice[0];
    for (const point of slice) {
      if (min === undefined || value(point) < value(min)) min = point;
      if (max === undefined || value(point) > value(max)) max = point;
    }
    if (min === undefined || max === undefined) continue;
    const minFirst = slice.indexOf(min) <= slice.indexOf(max);
    result.push(...(min === max ? [min] : minFirst ? [min, max] : [max, min]));
  }
  const last = points[points.length - 1];
  if (last !== undefined && result[result.length - 1] !== last)
    result.push(last);
  return result;
}

/** Index of the point whose time is closest to `time` (sorted input). */
export function nearestIndex(times: readonly number[], time: number): number {
  let low = 0;
  let high = times.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if ((times[mid] ?? 0) < time) low = mid + 1;
    else high = mid;
  }
  const previous = low - 1;
  if (
    previous >= 0 &&
    Math.abs((times[previous] ?? 0) - time) <=
      Math.abs((times[low] ?? 0) - time)
  ) {
    return previous;
  }
  return low;
}
