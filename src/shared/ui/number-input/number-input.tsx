import type { ChangeEvent, ComponentPropsWithRef, ReactNode } from 'react';

import { Input } from '../input';

export interface NumberInputProps extends Omit<
  ComponentPropsWithRef<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange' | 'prefix'
> {
  /** Current value; `null` renders an empty field. */
  readonly value: number | null;
  /** Called with the parsed number, or `null` when the field is cleared. */
  readonly onValueChange: (value: number | null) => void;
  readonly suffix?: ReactNode | undefined;
  readonly invalid?: boolean | undefined;
  readonly frameClassName?: string | undefined;
}

export function NumberInput({
  value,
  onValueChange,
  suffix,
  invalid,
  frameClassName,
  ...rest
}: NumberInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value;
    if (raw.trim() === '') {
      onValueChange(null);
      return;
    }
    const parsed = Number(raw);
    if (Number.isFinite(parsed)) onValueChange(parsed);
  };

  return (
    <Input
      {...rest}
      type="number"
      mono
      inputMode="decimal"
      value={value ?? ''}
      onChange={handleChange}
      suffix={suffix}
      invalid={invalid}
      frameClassName={frameClassName}
      className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}
