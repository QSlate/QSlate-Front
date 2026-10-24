'use client';
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
export const EQUITY_RANGES = ['1D', '1W', '1M', '1Y', 'ALL'] as const;
type EquityRange = (typeof EQUITY_RANGES)[number];
const RangeContext = createContext<{
  range: EquityRange;
  setRange: (value: EquityRange) => void;
} | null>(null);
export function ResultControlsProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<EquityRange>('ALL');
  const value = useMemo(() => ({ range, setRange }), [range]);
  return (
    <RangeContext.Provider value={value}>{children}</RangeContext.Provider>
  );
}
export function useResultControls() {
  const context = useContext(RangeContext);
  if (!context)
    throw new Error('useResultControls requires ResultControlsProvider');
  return context;
}
