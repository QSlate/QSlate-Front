'use client';

import {
  CalendarDays,
  ChevronDown,
  Eye,
  LoaderCircle,
  Play,
  Plus,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import {
  type BacktestConfig,
  STRATEGIES,
  type Timeframe,
  validateBacktestFields,
} from '@/entities/backtest';
import { useUserStore } from '@/entities/user/model';
import { useBacktest } from '@/features/run-backtest/BacktestProvider';
import { useHydratedStore } from '@/shared/lib/store';

const subscribePlatform = () => () => {};
const getPlatformShortcut = () =>
  /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘↵' : 'Ctrl↵';

export function LabToolbar({ onAddWidget }: { onAddWidget: () => void }) {
  const { config, setConfig, run, status } = useBacktest();
  const colorblind = useHydratedStore(
    useUserStore,
    (state) => state.colorblindMode,
    'none'
  );
  const toggleColorblind = useUserStore((state) => state.toggleColorblindMode);
  const formRef = useRef<HTMLFormElement>(null);
  const running = status === 'running';
  const [submitted, setSubmitted] = useState(false);
  const validation = useMemo(() => validateBacktestFields(config), [config]);
  const shortcutLabel = useSyncExternalStore(
    subscribePlatform,
    getPlatformShortcut,
    () => 'Ctrl↵'
  );
  const fieldProps = (field: keyof BacktestConfig) => ({
    name: field,
    'aria-invalid': submitted && Boolean(validation[field]),
    'aria-describedby':
      submitted && validation[field] ? `lab-${field}-error` : undefined,
  });

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.key === 'Enter' &&
        !event.repeat &&
        !event.isComposing &&
        !document.querySelector('dialog[open]')
      ) {
        event.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, []);

  return (
    <form
      ref={formRef}
      className="lab-toolbar"
      aria-label="Backtest configuration"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        const firstInvalidField = Object.keys(validation)[0];
        if (firstInvalidField)
          requestAnimationFrame(() => {
            const field =
              formRef.current?.elements.namedItem(firstInvalidField);
            if (field instanceof HTMLElement) field.focus();
          });
        void run();
      }}
    >
      <fieldset disabled={running} className="lab-config-fields">
        <label className="lab-strategy">
          <span className="lab-strategy-label">
            Strategies <span>/</span>
          </span>
          <span className="lab-select-shell">
            <i className="lab-status-dot" />
            <select
              aria-label="Strategy"
              {...fieldProps('strategyId')}
              value={config.strategyId}
              onChange={(event) =>
                setConfig({ ...config, strategyId: event.target.value })
              }
            >
              {STRATEGIES.map((strategy) => (
                <option key={strategy.id} value={strategy.id}>
                  {strategy.name} · {strategy.version}
                </option>
              ))}
            </select>
            <ChevronDown size={11} />
          </span>
        </label>
        <div className="lab-date-range">
          <CalendarDays size={12} />
          <input
            type="date"
            aria-label="Start date"
            {...fieldProps('startDate')}
            value={config.startDate}
            onChange={(event) =>
              setConfig({ ...config, startDate: event.target.value })
            }
          />
          <span>to</span>
          <input
            type="date"
            aria-label="End date"
            {...fieldProps('endDate')}
            value={config.endDate}
            onChange={(event) =>
              setConfig({ ...config, endDate: event.target.value })
            }
          />
        </div>
        <select
          className="lab-timeframe"
          aria-label="Timeframe"
          {...fieldProps('timeframe')}
          value={config.timeframe}
          onChange={(event) =>
            setConfig({ ...config, timeframe: event.target.value as Timeframe })
          }
        >
          <option value="15m">15m</option>
          <option value="1h">1h</option>
          <option value="4h">4h</option>
          <option value="1d">1d</option>
        </select>
        <label className="lab-capital">
          <span>Capital</span>
          <span>$</span>
          <input
            aria-label="Initial capital in USD"
            {...fieldProps('capital')}
            type="number"
            min="1"
            step="any"
            value={Number.isNaN(config.capital) ? '' : config.capital}
            onChange={(event) =>
              setConfig({ ...config, capital: event.target.valueAsNumber })
            }
          />
        </label>
      </fieldset>
      <div className="lab-toolbar-actions">
        <button className="lab-button" type="button" onClick={onAddWidget}>
          <Plus size={12} />
          <span>Add Widget</span>
        </button>
        <button
          className="lab-button lab-colorblind"
          type="button"
          onClick={toggleColorblind}
          aria-pressed={colorblind === 'orange-blue'}
          aria-label="Toggle colorblind mode"
        >
          <Eye size={12} />
          <span>Daltonism</span>
          <span className="lab-palette" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
        <button
          className="lab-button lab-run-button"
          type="submit"
          disabled={running}
          aria-keyshortcuts="Control+Enter Meta+Enter"
        >
          {running ? (
            <LoaderCircle size={12} className="lab-spin" />
          ) : (
            <Play size={12} fill="currentColor" />
          )}
          <span>{running ? 'Running…' : 'Run Backtest'}</span>
          <kbd title="Ctrl or Command + Enter" aria-hidden="true">
            {shortcutLabel}
          </kbd>
        </button>
      </div>
      {submitted && Object.keys(validation).length ? (
        <div className="lab-form-errors">
          {Object.entries(validation).map(([field, message]) => (
            <span id={`lab-${field}-error`} key={field}>
              {message}
            </span>
          ))}
        </div>
      ) : null}
    </form>
  );
}
