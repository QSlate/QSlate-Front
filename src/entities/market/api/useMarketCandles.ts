'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuthStore } from '@/entities/user/model';
import { apiClient, type MarketCandle, type MarketTick } from '@/shared/api';
import { useWebSocket } from '@/shared/api/websocket';

import { generateMockCandles } from '../model/mockMarketData';
import type { CandleInterval, MarketCandlePoint } from '../model/types';

const RESOLUTION_MAP: Record<CandleInterval, string> = {
  '15m': '15m',
  '1h': '1h',
  '4h': '4h',
  '1D': '1d',
  '1W': '1d',
};

const DURATION_SECONDS: Record<CandleInterval, number> = {
  '15m': 900,
  '1h': 3600,
  '4h': 14400,
  '1D': 86400,
  '1W': 604800,
};

export function useMarketCandles(
  symbol: string,
  interval: CandleInterval = '1h'
) {
  const token = useAuthStore((state) => state.accessToken);
  const [candles, setCandles] = useState<MarketCandlePoint[]>(() =>
    generateMockCandles(symbol, interval, 90)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [lastTick, setLastTick] = useState<MarketTick | null>(null);

  const resolution = RESOLUTION_MAP[interval] ?? '1h';

  // 1. Fetch historical candles from Market Data service
  useEffect(() => {
    let isCancelled = false;

    async function loadHistory() {
      setIsLoading(true);
      const stepSec = DURATION_SECONDS[interval] ?? 3600;
      const end = new Date();
      const start = new Date(end.getTime() - 90 * stepSec * 1000);

      try {
        const history = await apiClient.getMarketHistory(
          {
            symbol,
            resolution,
            start: start.toISOString(),
            end: end.toISOString(),
            limit: 100,
          },
          token
        );

        if (!isCancelled && history.items && history.items.length > 0) {
          const parsedCandles: MarketCandlePoint[] = history.items.map(
            (c: MarketCandle) => ({
              time: Math.floor(new Date(c.time).getTime() / 1000),
              open: Number(c.open),
              high: Number(c.high),
              low: Number(c.low),
              close: Number(c.close),
              volume: Number(c.volume || 0),
            })
          );
          parsedCandles.sort((a, b) => a.time - b.time);
          setCandles(parsedCandles);
          setIsLoading(false);
          return;
        }
      } catch {
        // Fallback to synthetic realistic candles if offline or symbol not indexed
      }

      if (!isCancelled) {
        setCandles(generateMockCandles(symbol, interval, 90));
        setIsLoading(false);
      }
    }

    void loadHistory();

    return () => {
      isCancelled = true;
    };
  }, [symbol, interval, resolution, token]);

  const handleTick = useCallback(
    (tick: MarketTick) => {
      if (tick.symbol !== symbol) return;

      setLastTick(tick);
      const tickPrice = Number(tick.price);
      const tickQty = Number(tick.quantity || 0);

      if (Number.isNaN(tickPrice)) return;

      setCandles((prev) => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        const updatedLast: MarketCandlePoint = {
          ...last,
          close: tickPrice,
          high: Math.max(last.high, tickPrice),
          low: Math.min(last.low, tickPrice),
          volume: last.volume + tickQty,
        };
        return [...prev.slice(0, -1), updatedLast];
      });
    },
    [symbol]
  );

  // 2. Connect to real-time tick stream
  const wsUrl = useMemo(() => {
    if (typeof window === 'undefined') return '';
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^http/, 'ws')
      : `${protocol}//${window.location.hostname}:8080`;
    return `${host}/qslate/v1/ws/data/ticks`;
  }, []);

  const { state: wsState } = useWebSocket<MarketTick>({
    url: wsUrl,
    autoConnect: Boolean(wsUrl),
    reconnect: true,
    onMessage: handleTick,
  });

  const isLive = wsState === 'CONNECTED';

  return {
    candles,
    isLoading,
    isLive,
    lastTick,
  };
}
