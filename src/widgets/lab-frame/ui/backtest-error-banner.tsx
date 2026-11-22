'use client';

import { CircleAlert } from 'lucide-react';
import Link from 'next/link';

import { useBacktest } from '@/features/run-backtest';
import { Button, buttonClassName } from '@/shared/ui';

const AUTH_ERROR_HINTS = ['token', 'session', 'reconnecter', 'authentif'];

function isAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return AUTH_ERROR_HINTS.some((hint) => lower.includes(hint));
}

/** Surfaces the last backtest error with the relevant recovery action. */
export function BacktestErrorBanner() {
  const { error, run, status } = useBacktest();
  if (!error) return null;

  return (
    <div
      role="alert"
      className="mx-[22px] mt-3 flex items-center gap-2.5 rounded-xl border border-loss/40 bg-loss-soft px-3 py-2 text-[12.5px] text-loss"
    >
      <CircleAlert size={15} aria-hidden="true" className="shrink-0" />
      <span className="min-w-0 flex-1">{error}</span>
      {isAuthError(error) ? (
        <Link href="/login" className={buttonClassName('primary', 'sm')}>
          Se connecter
        </Link>
      ) : (
        <Button
          size="sm"
          onClick={() => void run()}
          disabled={status === 'running'}
        >
          Réessayer
        </Button>
      )}
    </div>
  );
}
