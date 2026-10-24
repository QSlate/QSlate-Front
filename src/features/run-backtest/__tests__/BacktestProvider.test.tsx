// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { type BacktestService, INITIAL_MOCK_RESULT } from '@/entities/backtest';

import { BacktestProvider, useBacktest } from '../BacktestProvider';

afterEach(cleanup);

function Controls() {
  const { config, setConfig, run, status, error, result } = useBacktest();
  return (
    <>
      <button
        onClick={() => {
          void run();
        }}
      >
        Run
      </button>
      <button onClick={() => setConfig({ ...config, capital: 0 })}>
        Invalid
      </button>
      <button onClick={() => setConfig({ ...config, capital: 50000 })}>
        Change
      </button>
      <span data-testid="status">{status}</span>
      <span data-testid="result">{result.config.capital}</span>
      {error ? <p role="alert">{error}</p> : null}
    </>
  );
}

describe('backtest execution', () => {
  it('validates before calling the service and keeps the last result', () => {
    const service: BacktestService = { run: vi.fn() };
    render(
      <BacktestProvider service={service}>
        <Controls />
      </BacktestProvider>
    );
    fireEvent.click(screen.getByText('Invalid'));
    fireEvent.click(screen.getByText('Run'));
    expect(service.run).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain(
      'greater than zero'
    );
    expect(screen.getByTestId('result').textContent).toBe('100000');
  });

  it('submits a configuration snapshot once and commits results on completion', async () => {
    let complete!: (value: typeof INITIAL_MOCK_RESULT) => void;
    const service: BacktestService = {
      run: vi.fn(
        () =>
          new Promise<typeof INITIAL_MOCK_RESULT>((resolve) => {
            complete = resolve;
          })
      ),
    };
    render(
      <BacktestProvider service={service}>
        <Controls />
      </BacktestProvider>
    );
    fireEvent.click(screen.getByText('Change'));
    fireEvent.click(screen.getByText('Run'));
    fireEvent.click(screen.getByText('Run'));
    expect(service.run).toHaveBeenCalledTimes(1);
    expect(service.run).toHaveBeenCalledWith(
      expect.objectContaining({ capital: 50000 }),
      expect.any(AbortSignal)
    );
    expect(screen.getByTestId('status').textContent).toBe('running');
    expect(screen.getByTestId('result').textContent).toBe('100000');
    await act(async () =>
      complete({
        ...INITIAL_MOCK_RESULT,
        config: { ...INITIAL_MOCK_RESULT.config, capital: 50000 },
      })
    );
    expect(screen.getByTestId('status').textContent).toBe('success');
    expect(screen.getByTestId('result').textContent).toBe('50000');
  });

  it('clears a previous validation error when the configuration is edited', () => {
    const service: BacktestService = { run: vi.fn() };
    render(
      <BacktestProvider service={service}>
        <Controls />
      </BacktestProvider>
    );
    fireEvent.click(screen.getByText('Invalid'));
    fireEvent.click(screen.getByText('Run'));
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByText('Change'));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByTestId('status').textContent).toBe('idle');
  });

  it('aborts an in-flight execution when the provider unmounts', async () => {
    let signal: AbortSignal | undefined;
    let complete!: (value: typeof INITIAL_MOCK_RESULT) => void;
    const service: BacktestService = {
      run: vi.fn((_config, requestSignal) => {
        signal = requestSignal;
        return new Promise<typeof INITIAL_MOCK_RESULT>((resolve) => {
          complete = resolve;
        });
      }),
    };
    const { unmount } = render(
      <BacktestProvider service={service}>
        <Controls />
      </BacktestProvider>
    );
    fireEvent.click(screen.getByText('Run'));
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => complete(INITIAL_MOCK_RESULT));
  });

  it('reports a service error and supports retry', async () => {
    const service: BacktestService = {
      run: vi
        .fn()
        .mockRejectedValueOnce(new Error('Simulation failed'))
        .mockResolvedValue(INITIAL_MOCK_RESULT),
    };
    render(
      <BacktestProvider service={service}>
        <Controls />
      </BacktestProvider>
    );
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() =>
      expect(screen.getByRole('alert').textContent).toBe('Simulation failed')
    );
    fireEvent.click(screen.getByText('Run'));
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('success')
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
