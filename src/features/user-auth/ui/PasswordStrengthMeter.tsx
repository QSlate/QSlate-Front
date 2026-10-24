'use client';

import { Check, X } from 'lucide-react';

import { selectColorblindMode, useUserStore } from '@/entities/user/model';
import { useHydratedStore } from '@/shared/lib/store';

export interface PasswordCriteria {
  min12: boolean;
  hasUpper: boolean;
  hasLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function evaluatePassword(password: string): {
  criteria: PasswordCriteria;
  score: number;
  label: string;
} {
  const criteria: PasswordCriteria = {
    min12: password.length >= 12 && password.length <= 72,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  let score = 0;
  if (criteria.min12) score += 2;
  if (criteria.hasUpper) score += 1;
  if (criteria.hasLower) score += 1;
  if (criteria.hasNumber) score += 1;
  if (criteria.hasSpecial) score += 1;

  let label = 'Too Short';
  if (password.length === 0) {
    label = 'Empty';
  } else if (!criteria.min12) {
    label = 'Min 12 chars required';
  } else if (score < 4) {
    label = 'Weak';
  } else if (score < 6) {
    label = 'Medium';
  } else {
    label = 'Institutional Grade';
  }

  return { criteria, score, label };
}

export function PasswordStrengthMeter({ password }: { password: string }) {
  const colorblindMode = useHydratedStore(
    useUserStore,
    selectColorblindMode,
    'none'
  );
  const isColorblind = colorblindMode === 'orange-blue';

  const { criteria, score, label } = evaluatePassword(password);

  const getBarColor = (index: number) => {
    if (password.length === 0) return 'bg-zinc-800 light:bg-zinc-200';
    if (!criteria.min12) {
      return isColorblind ? 'bg-amber-500' : 'bg-rose-500';
    }
    if (score >= index * 1.5) {
      return isColorblind ? 'bg-sky-400' : 'bg-[#00ffb2]';
    }
    return 'bg-zinc-800 light:bg-zinc-200';
  };

  const getStatusColor = () => {
    if (password.length === 0) return 'text-zinc-500';
    if (!criteria.min12) {
      return isColorblind ? 'text-amber-400' : 'text-rose-400';
    }
    if (score < 4) {
      return isColorblind ? 'text-amber-400' : 'text-yellow-400';
    }
    return isColorblind ? 'text-sky-400' : 'text-[#00ffb2]';
  };

  const items = [
    { label: 'At least 12 characters (max 72)', valid: criteria.min12 },
    { label: 'Uppercase letter (A-Z)', valid: criteria.hasUpper },
    { label: 'Lowercase letter (a-z)', valid: criteria.hasLower },
    { label: 'Number (0-9)', valid: criteria.hasNumber },
    { label: 'Special character (!@#$%...)', valid: criteria.hasSpecial },
  ];

  return (
    <div className="space-y-2 mt-2 font-mono text-xs" aria-live="polite">
      {/* Strength Bar */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wider text-zinc-400">
          Entropy & Strength
        </span>
        <span className={`text-[11px] font-semibold ${getStatusColor()}`}>
          {label}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
        <div
          className={`rounded-full transition-colors duration-300 ${getBarColor(1)}`}
        />
        <div
          className={`rounded-full transition-colors duration-300 ${getBarColor(2)}`}
        />
        <div
          className={`rounded-full transition-colors duration-300 ${getBarColor(3)}`}
        />
        <div
          className={`rounded-full transition-colors duration-300 ${getBarColor(4)}`}
        />
      </div>

      {/* Criteria Checklist */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {items.map((item) => {
          const validColor = isColorblind ? 'text-sky-400' : 'text-[#00ffb2]';
          return (
            <li
              key={item.label}
              className={`flex items-center gap-1.5 transition-colors ${
                item.valid ? validColor : 'text-zinc-500 light:text-zinc-400'
              }`}
            >
              {item.valid ? (
                <Check className="w-3 h-3 flex-shrink-0" />
              ) : (
                <X className="w-3 h-3 flex-shrink-0 opacity-40" />
              )}
              <span className="truncate">{item.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
