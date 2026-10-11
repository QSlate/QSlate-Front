import type { HTMLAttributes } from 'react';

export interface ChartSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  height?: number | string | undefined;
  width?: number | string | undefined;
  className?: string | undefined;
}

export function ChartSkeleton({
  height = '100%',
  width = '100%',
  className,
  ...rest
}: ChartSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading financial chart visualization"
      className={`relative h-full w-full min-h-[150px] overflow-hidden rounded-md border border-white/[0.04] bg-[#050505] animate-pulse ${
        className ?? ''
      }`}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
      }}
      data-testid="chart-skeleton"
      {...rest}
    >
      <div className="absolute inset-0 flex flex-col justify-between p-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-28 rounded bg-white/[0.06]" />
          <div className="h-3 w-16 rounded bg-white/[0.04]" />
        </div>

        <div className="flex-1 my-3 flex flex-col justify-between border-b border-r border-white/[0.05] pr-10 pb-5">
          <div className="w-full border-t border-dashed border-white/[0.03]" />
          <div className="w-full border-t border-dashed border-white/[0.03]" />
          <div className="w-full border-t border-dashed border-white/[0.03]" />
          <div className="w-full border-t border-dashed border-white/[0.03]" />
        </div>

        <div className="flex justify-between pl-2 pr-12 text-[10px]">
          <div className="h-2 w-10 rounded bg-white/[0.04]" />
          <div className="h-2 w-10 rounded bg-white/[0.04]" />
          <div className="h-2 w-10 rounded bg-white/[0.04]" />
          <div className="h-2 w-10 rounded bg-white/[0.04]" />
        </div>
      </div>

      <div className="absolute right-2 top-10 bottom-8 flex flex-col justify-between items-end">
        <div className="h-2 w-7 rounded bg-white/[0.04]" />
        <div className="h-2 w-7 rounded bg-white/[0.04]" />
        <div className="h-2 w-7 rounded bg-white/[0.04]" />
        <div className="h-2 w-7 rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}
