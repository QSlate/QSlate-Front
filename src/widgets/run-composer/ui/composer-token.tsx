import { ChevronDown } from 'lucide-react';
import { type ReactNode, useId } from 'react';

import { cn } from '@/shared/lib/class-names';

export const TOKEN_CLASS =
  'relative inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[10px] pl-[7px] pr-2.5 text-[13px] font-medium text-fg transition-colors hover:bg-surface has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60';

export const TOKEN_META_CLASS = 'font-mono text-[11.5px] font-normal text-fg-3';

export interface TokenOption {
  readonly value: string;
  readonly label: string;
}

interface ComposerSelectTokenProps {
  /** Accessible name of the select ("Stratégie", "Données"). */
  readonly label: string;
  readonly chip: ReactNode;
  readonly chipClassName: string;
  readonly options: readonly TokenOption[];
  readonly value: string | null;
  readonly onChange: (value: string) => void;
  /** Shown as the only option when the list is empty. */
  readonly emptyLabel: string;
  /** The stored value no longer exists: show a placeholder, keep the list. */
  readonly missing?: boolean | undefined;
  /** Secondary information (version, candle count). */
  readonly meta?: string | undefined;
  readonly disabled?: boolean | undefined;
}

/** Composer token wrapping a native select (keyboard and screen-reader friendly). */
export function ComposerSelectToken({
  label,
  chip,
  chipClassName,
  options,
  value,
  onChange,
  emptyLabel,
  meta,
  missing = false,
  disabled = false,
}: ComposerSelectTokenProps) {
  const metaId = useId();
  const empty = options.length === 0;
  return (
    <span className={TOKEN_CLASS}>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-6 place-items-center rounded-[7px] font-mono text-[10.5px] font-bold text-white',
          chipClassName
        )}
      >
        {chip}
      </span>
      <select
        aria-label={label}
        aria-describedby={meta ? metaId : undefined}
        value={empty || missing ? '' : (value ?? '')}
        aria-invalid={missing || undefined}
        disabled={disabled || empty}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[170px] cursor-pointer appearance-none truncate border-0 bg-transparent p-0 pr-4 font-medium text-inherit outline-none disabled:cursor-not-allowed [&>option]:bg-raised [&>option]:text-fg"
      >
        {empty ? (
          <option value="">{emptyLabel}</option>
        ) : (
          <>
            {missing ? (
              <option value="" disabled>
                Sélection introuvable
              </option>
            ) : null}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
      {meta ? (
        <span id={metaId} className={TOKEN_META_CLASS}>
          {meta}
        </span>
      ) : null}
      <ChevronDown
        size={13}
        aria-hidden="true"
        className="pointer-events-none text-fg-3"
      />
    </span>
  );
}
