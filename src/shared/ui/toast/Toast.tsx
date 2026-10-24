'use client';

import { CheckCircle2, Info, X } from 'lucide-react';

import { useLabStore } from '@/features/lab-state';

export function Toast() {
  const toast = useLabStore((state) => state.toast);
  const clearToast = useLabStore((state) => state.clearToast);

  if (!toast) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-lg border bg-[#0e1015]/95 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-3 duration-200 text-xs font-sans text-white border-white/10"
      role="status"
      aria-live="polite"
    >
      {toast.type === 'success' ? (
        <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
      ) : (
        <Info size={15} className="text-blue-400 shrink-0" />
      )}
      <span className="font-medium">{toast.message}</span>
      <button
        type="button"
        onClick={clearToast}
        className="ml-2 text-zinc-400 hover:text-white transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={13} />
      </button>
    </div>
  );
}
