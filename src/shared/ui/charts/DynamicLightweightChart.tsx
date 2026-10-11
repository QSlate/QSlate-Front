'use client';

import dynamic from 'next/dynamic';

import { ChartSkeleton } from './ChartSkeleton';
import type { ChartDataPoint, LightweightChartProps } from './types';

const DynamicClientChart = dynamic(
  () => import('./LightweightChart').then((mod) => mod.LightweightChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
) as <TData extends ChartDataPoint>(
  props: LightweightChartProps<TData>
) => React.JSX.Element;

export function DynamicLightweightChart<TData extends ChartDataPoint>(
  props: LightweightChartProps<TData>
) {
  return <DynamicClientChart {...props} />;
}
