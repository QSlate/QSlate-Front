import type { HTMLAttributes } from 'react';

export interface GridSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  className?: string | undefined;
}

export function GridSkeleton({ className, ...rest }: GridSkeletonProps) {
  return (
    <div
      className={`w-full p-4 animate-pulse ${className ?? ''}`}
      data-testid="grid-skeleton"
      aria-label="Loading workspace grid layout"
      {...rest}
    >
      <div className="grid grid-cols-12 gap-3 h-[720px]">
        <div className="col-span-12 lg:col-span-8 flex flex-col rounded-lg border border-default bg-card/60 overflow-hidden">
          <div className="h-9 border-b border-default bg-panel/60 px-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3.5 w-3.5 rounded bg-white/10" />
              <div className="h-3 w-32 rounded bg-white/10" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-4 w-4 rounded bg-white/10" />
              <div className="h-4 w-4 rounded bg-white/10" />
            </div>
          </div>
          <div className="flex-1 p-4 space-y-3">
            <div className="h-4 w-1/3 rounded bg-white/5" />
            <div className="h-4 w-2/3 rounded bg-white/5" />
            <div className="h-4 w-1/2 rounded bg-white/5" />
            <div className="h-4 w-3/4 rounded bg-white/5" />
            <div className="h-24 w-full rounded bg-white/5 mt-4" />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-3">
          <div className="flex-1 flex flex-col rounded-lg border border-default bg-card/60 overflow-hidden min-h-[340px]">
            <div className="h-9 border-b border-default bg-panel/60 px-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded bg-white/10" />
                <div className="h-3 w-28 rounded bg-white/10" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-4 w-4 rounded bg-white/10" />
              </div>
            </div>
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div className="h-6 w-24 rounded bg-white/10" />
              <div className="h-36 w-full rounded bg-white/5" />
            </div>
          </div>

          <div className="flex-1 flex flex-col rounded-lg border border-default bg-card/60 overflow-hidden min-h-[340px]">
            <div className="h-9 border-b border-default bg-panel/60 px-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3.5 w-3.5 rounded bg-white/10" />
                <div className="h-3 w-28 rounded bg-white/10" />
              </div>
              <div className="flex gap-1.5">
                <div className="h-4 w-4 rounded bg-white/10" />
              </div>
            </div>
            <div className="flex-1 p-4 flex items-end gap-2">
              <div className="h-16 flex-1 rounded bg-white/5" />
              <div className="h-24 flex-1 rounded bg-white/5" />
              <div className="h-12 flex-1 rounded bg-white/5" />
              <div className="h-28 flex-1 rounded bg-white/5" />
              <div className="h-20 flex-1 rounded bg-white/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
