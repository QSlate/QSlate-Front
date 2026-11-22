import { ChevronDown } from 'lucide-react';
import type { ChangeEvent, ComponentPropsWithRef } from 'react';

import { cn } from '@/shared/lib/class-names';

import { FIELD_CONTROL_CLASS, fieldFrameClassName } from '../input';

export interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly disabled?: boolean | undefined;
}

export interface SelectProps<T extends string> extends Omit<
  ComponentPropsWithRef<'select'>,
  'value' | 'defaultValue' | 'onChange' | 'children'
> {
  readonly options: readonly SelectOption<T>[];
  readonly value: T;
  readonly onValueChange: (value: T) => void;
  readonly invalid?: boolean | undefined;
  readonly frameClassName?: string | undefined;
}

export function Select<T extends string>({
  options,
  value,
  onValueChange,
  invalid = false,
  frameClassName,
  className,
  ...rest
}: SelectProps<T>) {
  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = options.find((option) => option.value === event.target.value);
    if (next) onValueChange(next.value);
  };

  return (
    <span className={fieldFrameClassName(invalid, cn('pr-0', frameClassName))}>
      <select
        {...rest}
        value={value}
        onChange={handleChange}
        aria-invalid={invalid || undefined}
        className={cn(
          FIELD_CONTROL_CLASS,
          'cursor-pointer appearance-none pr-8 font-medium [&>option]:bg-raised [&>option]:text-fg',
          className
        )}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 text-fg-3"
      />
    </span>
  );
}
