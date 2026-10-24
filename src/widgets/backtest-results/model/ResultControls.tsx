'use client';

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useMemo,
  useState,
} from 'react';

export const EQUITY_RANGES = ['1D', '1W', '1M', '1Y', 'ALL'] as const;
export const CANDLE_INTERVALS = ['15m', '1h', '4h', '1D', '1W'] as const;

export type EquityRange = (typeof EQUITY_RANGES)[number];
export type CandleInterval = (typeof CANDLE_INTERVALS)[number];
export type ChartDisplayMode = 'candles' | 'nav';

interface ResultControlsContextType {
  range: EquityRange;
  setRange: (value: EquityRange) => void;
  chartMode: ChartDisplayMode;
  setChartMode: (mode: ChartDisplayMode) => void;
  selectedTicker: string;
  setSelectedTicker: (ticker: string) => void;
  candleInterval: CandleInterval;
  setCandleInterval: (interval: CandleInterval) => void;
  showEMA21: boolean;
  setShowEMA21: Dispatch<SetStateAction<boolean>>;
  showEMA55: boolean;
  setShowEMA55: Dispatch<SetStateAction<boolean>>;
}

const RangeContext = createContext<ResultControlsContextType | null>(null);

export function ResultControlsProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<EquityRange>('ALL');
  const [chartMode, setChartMode] = useState<ChartDisplayMode>('candles');
  const [selectedTicker, setSelectedTicker] = useState<string>('ETH/USDT');
  const [candleInterval, setCandleInterval] = useState<CandleInterval>('1D');
  const [showEMA21, setShowEMA21] = useState<boolean>(true);
  const [showEMA55, setShowEMA55] = useState<boolean>(false);

  const value = useMemo(
    () => ({
      range,
      setRange,
      chartMode,
      setChartMode,
      selectedTicker,
      setSelectedTicker,
      candleInterval,
      setCandleInterval,
      showEMA21,
      setShowEMA21,
      showEMA55,
      setShowEMA55,
    }),
    [range, chartMode, selectedTicker, candleInterval, showEMA21, showEMA55]
  );

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
