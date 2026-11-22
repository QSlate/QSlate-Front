'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/shared/ui';

import type { DashboardGridProps } from './dashboard-grid';

function GridPlaceholder() {
  return (
    <div aria-hidden="true" className="grid grid-cols-4 gap-3">
      <Skeleton className="h-[156px]" />
      <Skeleton className="h-[156px]" />
      <Skeleton className="h-[156px]" />
      <Skeleton className="h-[156px]" />
    </div>
  );
}

const DashboardGridClient = dynamic(
  () => import('./dashboard-grid').then((module) => module.DashboardGrid),
  { ssr: false, loading: GridPlaceholder }
);

/** The grid library touches the DOM on mount: client-only. */
export function DashboardGridLazy(props: DashboardGridProps) {
  return <DashboardGridClient {...props} />;
}
