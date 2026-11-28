'use client';

import { LayoutGrid } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { DashboardLayout } from '@/features/customize-lab';
import { EmptyState } from '@/shared/ui';

import type { WidgetComponents } from '../model/types';
import { DashboardGridLazy } from './dashboard-grid-lazy';

/** Width the grid is laid out at before being scaled into the preview. */
const LAYOUT_WIDTH = 1200;

function ignore() {}

interface DashboardPreviewProps {
  readonly layout: DashboardLayout;
  readonly components: WidgetComponents;
}

/**
 * The real Lab grid with the real widgets (and the shown backtest), laid
 * out at desktop width then scaled down. Read-only: neither focusable nor
 * read twice by screen readers.
 */
export function DashboardPreview({
  layout,
  components,
}: DashboardPreviewProps) {
  const sizerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  const [height, setHeight] = useState(0);
  const empty = layout.length === 0;

  // The frame only exists for a non-empty layout: measure again on change.
  useEffect(() => {
    const sizer = sizerRef.current;
    const content = contentRef.current;
    if (!sizer || !content) return;
    const measure = () => {
      setScale(sizer.clientWidth / LAYOUT_WIDTH);
      setHeight(content.offsetHeight);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(sizer);
    observer.observe(content);
    return () => observer.disconnect();
  }, [empty]);

  if (empty) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-line-strong">
        <EmptyState
          icon={<LayoutGrid />}
          title="Un dashboard vide"
          description="Tu ajoutes toi-même les widgets dont tu as besoin avec « Personnaliser »."
        />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className="h-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-line bg-[var(--bg)] p-2"
    >
      {/* Sized to the scaled grid so the frame scrolls the right amount. */}
      <div
        ref={sizerRef}
        className="relative w-full"
        style={{ height: Math.ceil(height * scale) }}
      >
        <div
          ref={contentRef}
          inert
          className="pointer-events-none absolute left-0 top-0 origin-top-left select-none"
          // Scale computed from the measured preview width.
          style={{ width: LAYOUT_WIDTH, transform: `scale(${scale})` }}
        >
          <DashboardGridLazy
            layout={layout}
            editing={false}
            components={components}
            onChange={ignore}
            onRemove={ignore}
          />
        </div>
      </div>
    </div>
  );
}
