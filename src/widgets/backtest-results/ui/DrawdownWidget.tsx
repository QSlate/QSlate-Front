'use client';

import { useState } from 'react';

import { useBacktest } from '@/features/run-backtest/BacktestProvider';

import { signed } from '../model/format';
import { EmptyState } from './EmptyState';

export function DrawdownWidget() {
  const { result, status } = useBacktest();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const returns = result.monthlyReturns;
  const max =
    Math.ceil(
      Math.max(4, ...returns.map((point) => Math.abs(point.value))) * 2
    ) / 2;
  const selected = returns.find((point) => point.month === selectedMonth);
  if (!returns.length)
    return <EmptyState message="No monthly returns available." />;
  return (
    <div className="lab-drawdown" aria-busy={status === 'running'}>
      <div className="lab-chart-caption">
        <span>Monthly returns (%)</span>
        <span>
          Longest DD: <strong>{result.longestDrawdownDays}d</strong>
        </span>
      </div>
      <div
        className="lab-bar-chart"
        role="group"
        aria-label="Monthly returns, in percent"
      >
        {[max, max / 2, 0, -max / 2, -max].map((value, index) => (
          <div
            key={index}
            className="lab-bar-gridline"
            style={{ top: `${index * 25}%` }}
          >
            <span>{Number(value.toFixed(1))}</span>
          </div>
        ))}
        <div className="lab-bars">
          {returns.map((point, index) => (
            <button
              type="button"
              key={point.month}
              tabIndex={
                selectedMonth
                  ? point.month === selectedMonth
                    ? 0
                    : -1
                  : index === 0
                    ? 0
                    : -1
              }
              aria-label={`${point.month}: ${signed(point.value, 2)}%`}
              className={`lab-bar ${point.value >= 0 ? 'is-positive' : 'is-negative'}`}
              style={{
                left: `${(index / returns.length) * 100}%`,
                width: `${80 / returns.length}%`,
                height: `${Math.max(0.25, (Math.abs(point.value) / max) * 50)}%`,
                top:
                  point.value >= 0
                    ? `${50 - (Math.abs(point.value) / max) * 50}%`
                    : '50%',
              }}
              onMouseEnter={() => setSelectedMonth(point.month)}
              onMouseLeave={(event) => {
                if (document.activeElement !== event.currentTarget)
                  setSelectedMonth(null);
              }}
              onClick={() => setSelectedMonth(point.month)}
              onKeyDown={(event) => {
                const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
                if (!keys.includes(event.key)) return;
                event.preventDefault();
                const nextIndex =
                  event.key === 'Home'
                    ? 0
                    : event.key === 'End'
                      ? returns.length - 1
                      : (index +
                          (event.key === 'ArrowRight' ? 1 : -1) +
                          returns.length) %
                        returns.length;
                const buttons =
                  event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
                    'button'
                  );
                buttons?.[nextIndex]?.focus();
              }}
              onFocus={() => setSelectedMonth(point.month)}
              onBlur={() => setSelectedMonth(null)}
            />
          ))}
        </div>
        {selected ? (
          <div className="lab-bar-tooltip" role="status">
            {selected.month} <strong>{signed(selected.value, 2)}%</strong>
          </div>
        ) : null}
      </div>
      <div className="lab-bar-labels">
        {returns.map((point, index) => {
          const last = returns.length - 1;
          const show =
            index === 0 ||
            index === last ||
            (index % Math.max(1, Math.ceil(last / 3)) === 0 &&
              last - index > Math.max(1, Math.floor(last / 8)));
          if (!show) return null;
          return (
            <span
              key={point.month}
              style={{
                left: `${((index + 0.5) / returns.length) * 100}%`,
                transform:
                  index === 0
                    ? 'none'
                    : index === last
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
              }}
            >
              {new Date(`${point.month}-01T00:00:00Z`).toLocaleDateString(
                'en-US',
                { month: 'short', year: '2-digit', timeZone: 'UTC' }
              )}
            </span>
          );
        })}
      </div>
      <table className="sr-only">
        <caption>Monthly returns</caption>
        <thead>
          <tr>
            <th>Month</th>
            <th>Return (%)</th>
          </tr>
        </thead>
        <tbody>
          {returns.map((point) => (
            <tr key={point.month}>
              <td>{point.month}</td>
              <td>{point.value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
