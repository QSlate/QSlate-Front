'use client';

import { memo, useEffect, useRef, useState } from 'react';

import { toTradingViewSymbol } from '@/entities/market';
import { useAppearance } from '@/shared/theme';

interface TradingViewRealTimeChartProps {
  symbol: string;
  interval?: '15m' | '1h' | '4h' | '1D' | '1W';
  theme?: 'dark' | 'light';
  height?: string;
  className?: string;
}

const INTERVAL_MAP: Record<string, string> = {
  '15m': '15',
  '1h': '60',
  '4h': '240',
  '1D': 'D',
  '1W': 'W',
};

function TradingViewRealTimeChartComponent({
  symbol,
  interval = '1D',
  theme: themeProp,
  className,
}: TradingViewRealTimeChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme: storeTheme } = useAppearance();
  const activeTheme = themeProp ?? storeTheme;
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  const tvSymbol = toTradingViewSymbol(symbol);
  const tvInterval = INTERVAL_MAP[interval] ?? 'D';

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear any previous widget DOM
    container.innerHTML = '';

    const widgetHolder = document.createElement('div');
    widgetHolder.className = 'tradingview-widget-container__widget';
    widgetHolder.style.height = '100%';
    widgetHolder.style.width = '100%';
    container.appendChild(widgetHolder);

    const script = document.createElement('script');
    script.src =
      'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: tvInterval,
      timezone: 'Etc/UTC',
      theme: activeTheme === 'light' ? 'light' : 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: activeTheme === 'light' ? '#ffffff' : '#08090a',
      gridColor: activeTheme === 'light' ? '#f1f3f5' : '#141517',
    });

    script.onload = () => {
      setIsScriptLoaded(true);
    };

    container.appendChild(script);

    return () => {
      container.innerHTML = '';
    };
  }, [tvSymbol, tvInterval, activeTheme]);

  return (
    <div
      className={`tradingview-widget-container relative w-full h-full min-h-[300px] overflow-hidden select-none ${
        className ?? ''
      }`}
      ref={containerRef}
      data-testid="tradingview-live-container"
      data-symbol={tvSymbol}
      data-theme={activeTheme}
    >
      {!isScriptLoaded && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-xs text-zinc-500 bg-transparent">
          <span className="animate-pulse">
            Loading TradingView Live Market Feed…
          </span>
        </div>
      )}
    </div>
  );
}

export const TradingViewRealTimeChart = memo(TradingViewRealTimeChartComponent);
