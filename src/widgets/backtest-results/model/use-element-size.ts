'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';

export interface ElementSize {
  readonly width: number;
  readonly height: number;
}

/** Pixel size of an element, kept current with a ResizeObserver. */
export function useElementSize<T extends HTMLElement>(): [
  RefObject<T | null>,
  ElementSize,
] {
  const ref = useRef<T | null>(null);
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height }
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, size];
}
