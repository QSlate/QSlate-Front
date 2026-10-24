'use client';

import { useId } from 'react';

import { useBacktest } from '@/features/run-backtest/BacktestProvider';

import { money, signed } from '../model/format';
import { EmptyState } from './EmptyState';

export function TradeLogWidget() {
  const { result, status } = useBacktest();
  if (!result.trades.length)
    return <EmptyState message="No trades were executed in this period." />;
  return (
    <div
      className="lab-trades"
      tabIndex={0}
      role="region"
      aria-label="Trade execution log, scroll to view transactions"
      aria-busy={status === 'running'}
    >
      <table>
        <caption className="sr-only">
          Latest {Math.min(100, result.trades.length)} of {result.trades.length}{' '}
          {result.source === 'mock' ? 'simulated' : 'backtest'} trades.
          Timestamps in UTC. Slippage in milliseconds.
        </caption>
        <thead>
          <tr>
            {[
              'Timestamp',
              'Ticker',
              'Side',
              'Entry',
              'Exit',
              'PnL $',
              'PnL %',
              'Slip',
              'Exec Hash',
            ].map((heading) => (
              <th key={heading} scope="col">
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.trades.slice(0, 100).map((trade) => (
            <tr key={trade.id}>
              <td>
                {new Date(trade.timestamp * 1000)
                  .toISOString()
                  .slice(0, 19)
                  .replace('T', ' ')}
              </td>
              <td>{trade.ticker}</td>
              <td>
                <span
                  className={`lab-side ${trade.side === 'BUY' ? 'lab-positive' : 'lab-negative'}`}
                >
                  {trade.side}
                </span>
              </td>
              <td>{money.format(trade.entry)}</td>
              <td>{money.format(trade.exit)}</td>
              <td className={trade.pnl >= 0 ? 'lab-positive' : 'lab-negative'}>
                {signed(trade.pnl, 0)}
              </td>
              <td className={trade.pnl >= 0 ? 'lab-positive' : 'lab-negative'}>
                {signed(trade.pnlPercent, 2)}%
              </td>
              <td>{trade.slippageMs.toFixed(1)}ms</td>
              <td>
                <ExecutionHash value={trade.executionHash} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="lab-trades-footer">
        Latest {Math.min(100, result.trades.length)} of{' '}
        {result.trades.length.toLocaleString('en-US')} trades · UTC
      </div>
    </div>
  );
}

function ExecutionHash({ value }: { value: string }) {
  const id = useId();
  return (
    <>
      <button
        className="lab-hash-button"
        type="button"
        popoverTarget={id}
        aria-label={`Show execution hash ${value}`}
        title="Show full execution hash"
      >
        {value.slice(0, 10)}
      </button>
      <div className="lab-hash-popover" id={id} popover="auto">
        <span>Execution hash</span>
        <code>{value}</code>
      </div>
    </>
  );
}
