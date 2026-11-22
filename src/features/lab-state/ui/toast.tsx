'use client';

import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';

import { cn, FOCUS_RING } from '@/shared/lib/class-names';

import { useLabStore } from '../model/useLabStore';

const ICONS = {
  error: (
    <CircleAlert size={15} className="shrink-0 text-loss" aria-hidden="true" />
  ),
  warning: (
    <TriangleAlert
      size={15}
      className="shrink-0 text-warn"
      aria-hidden="true"
    />
  ),
  success: (
    <CircleCheck size={15} className="shrink-0 text-gain" aria-hidden="true" />
  ),
  info: <Info size={15} className="shrink-0 text-brand" aria-hidden="true" />,
} as const;

/** Single transient notification of the Lab (errors are announced assertively). */
export function Toast() {
  const toast = useLabStore((state) => state.toast);
  const clearToast = useLabStore((state) => state.clearToast);
  if (!toast) return null;
  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className="fixed bottom-5 right-5 z-50 flex max-w-[420px] items-center gap-2.5 rounded-xl border border-line-strong bg-[color-mix(in_srgb,var(--raised)_92%,transparent)] px-4 py-2.5 text-xs text-fg shadow-pop backdrop-blur-xl"
    >
      {ICONS[toast.type]}
      <span className="font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={clearToast}
        aria-label="Fermer la notification"
        className={cn(FOCUS_RING, 'ml-2 rounded text-fg-3 hover:text-fg')}
      >
        <X size={13} aria-hidden="true" />
      </button>
    </div>
  );
}
