import type { ChartOptions, DeepPartial } from 'lightweight-charts';

export type ChartTime = string | number;

export interface OHLCData {
  time: ChartTime;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface LinePointData {
  time: ChartTime;
  value: number;
}

export interface AreaPointData {
  time: ChartTime;
  value: number;
}

export interface HistogramPointData {
  time: ChartTime;
  value: number;
  color?: string | undefined;
}

export type ChartSeriesType = 'candlestick' | 'line' | 'area' | 'histogram';

export type ChartThemeMode = 'dark' | 'light';

export type ChartColorblindMode = 'none' | 'orange-blue';

export type ChartDataPoint =
  OHLCData | LinePointData | AreaPointData | HistogramPointData;

export interface LightweightChartProps<TData extends ChartDataPoint> {
  data: TData[];
  seriesType: ChartSeriesType;
  ariaLabel: string;
  height?: number | string | undefined;
  width?: number | string | undefined;
  autoSize?: boolean | undefined;
  options?: DeepPartial<ChartOptions> | undefined;
  seriesOptions?: Record<string, unknown> | undefined;
  title?: string | undefined;
  className?: string | undefined;
  theme?: ChartThemeMode | undefined;
  colorblindMode?: ChartColorblindMode | undefined;
  onCrosshairMove?: ((param: unknown) => void) | undefined;
  onTimeRangeChange?: ((range: unknown) => void) | undefined;
}
