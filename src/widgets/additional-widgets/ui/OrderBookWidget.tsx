'use client';

import { Layers } from 'lucide-react';

import { useUserStore } from '@/entities/user/model';
import { MOCK_ORDER_BOOK_ROWS } from '@/entities/widget';
import { useHydratedStore } from '@/shared/lib/store';

export function OrderBookWidget() {
  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const isColorblind = colorblind === 'orange-blue';

  const bidColor = isColorblind ? '#38BDF8' : '#10B981';
  const askColor = isColorblind ? '#F59E0B' : '#F43F5E';

  const asks = MOCK_ORDER_BOOK_ROWS.filter((r) => r.side === 'ask');
  const bids = MOCK_ORDER_BOOK_ROWS.filter((r) => r.side === 'bid');

  return (
    <div className="flex flex-col h-full w-full justify-between p-3 select-none font-mono text-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-1 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Layers size={13} className="text-zinc-400" />
          <span className="text-white font-medium">L2 Order Book</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] border border-white/[0.08] text-zinc-300">
            ES1! Tick Multiplier
          </span>
        </div>
        <div className="text-[11px] text-zinc-400">
          Spread: <span className="text-white font-bold">0.75</span> pts
        </div>
      </div>

      {/* Grid Table of Asks & Bids */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-1 text-[11px]">
        {/* Asks (Top, descending order) */}
        {asks.map((ask) => (
          <div
            key={ask.price}
            className="relative flex items-center justify-between px-2 py-0.5 rounded-xs overflow-hidden"
          >
            {/* Depth bar background */}
            <div
              className="absolute right-0 top-0 bottom-0 opacity-20 transition-all duration-300"
              style={{
                width: `${Math.round(ask.intensity * 100)}%`,
                backgroundColor: askColor,
              }}
            />
            <span style={{ color: askColor }} className="font-semibold z-10">
              {ask.price.toFixed(2)}
            </span>
            <span className="text-zinc-400 z-10 tabular-nums">{ask.size}</span>
            <span className="text-zinc-500 z-10 tabular-nums">
              {ask.cumulative.toLocaleString()}
            </span>
          </div>
        ))}

        {/* Spread Divider */}
        <div className="flex items-center justify-between py-1 px-2 my-1 border-y border-white/[0.08] bg-white/[0.02] text-[10px] text-zinc-400 font-sans">
          <span>MID MARKET 5,429.62</span>
          <span className="text-zinc-500 font-mono">0.75 SPREAD (0.1ms)</span>
        </div>

        {/* Bids (Bottom) */}
        {bids.map((bid) => (
          <div
            key={bid.price}
            className="relative flex items-center justify-between px-2 py-0.5 rounded-xs overflow-hidden"
          >
            {/* Depth bar background */}
            <div
              className="absolute right-0 top-0 bottom-0 opacity-20 transition-all duration-300"
              style={{
                width: `${Math.round(bid.intensity * 100)}%`,
                backgroundColor: bidColor,
              }}
            />
            <span style={{ color: bidColor }} className="font-semibold z-10">
              {bid.price.toFixed(2)}
            </span>
            <span className="text-zinc-400 z-10 tabular-nums">{bid.size}</span>
            <span className="text-zinc-500 z-10 tabular-nums">
              {bid.cumulative.toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Screen reader table fallback */}
      <div
        className="sr-only"
        role="region"
        aria-label="Level 2 order book bids and asks"
      >
        <table>
          <caption>Level 2 Order Book Depth</caption>
          <thead>
            <tr>
              <th scope="col">Side</th>
              <th scope="col">Price</th>
              <th scope="col">Size</th>
              <th scope="col">Cumulative</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ORDER_BOOK_ROWS.map((row) => (
              <tr key={`${row.side}-${row.price}`}>
                <td>{row.side}</td>
                <td>{row.price}</td>
                <td>{row.size}</td>
                <td>{row.cumulative}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
