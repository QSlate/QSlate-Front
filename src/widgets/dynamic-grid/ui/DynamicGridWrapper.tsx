'use client';

import dynamic from 'next/dynamic';

import type { DynamicGridProps } from '../types';
import { GridSkeleton } from './GridSkeleton';

const DynamicGridClient = dynamic(
  () => import('./DynamicGrid').then((mod) => mod.DynamicGrid),
  {
    ssr: false,
    loading: () => <GridSkeleton />,
  }
);

export function DynamicGridWrapper(props: DynamicGridProps) {
  return <DynamicGridClient {...props} />;
}
