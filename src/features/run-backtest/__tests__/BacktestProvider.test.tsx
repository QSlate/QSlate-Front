// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  type BacktestResult,
  type BacktestRunOptions,
  type BacktestRunRequest,
  type BacktestService,
  EMPTY_BACKTEST_RESULT,
} from '@/entities/backtest';
import { useAuthStore } from '@/entities/user/model';
import { useLabStore } from '@/features/lab-state';
import { ApiError } from '@/shared/api';

import { BacktestProvider, useBacktest } from '../BacktestProvider';

const REQUEST: BacktestRunRequest = {
  strategyId: 'strat-a',
  strategyVersionId: 'ver-a',
  datasetId: 'ds-a',
  datasetVersionId: 'dsv-a',
  initialCapital: 50_000,
  parameters: {},
  window: 20,
  commissionRate: 0.001,
  slippageBps: 0,
};

const SAMPLE_RESULT: BacktestResult = {
  ...EMPTY_BACKTEST_RESULT,
  id: 'test-run-1',
  initialCapital: 50_000,
  equity: [{ time: 1000, nav: 50_000, benchmark: 50_000 }],
};

function Controls() {
  const { run, retry, cancel, status, error, result, canRetry } = useBacktest();
  return (
    <>
      <button onClick={() => void run(REQUEST)}>Run</button>
      <button onClick={() => void retry()} disabled={!canRetry}>
        Retry
      </button>
      <button onClick={cancel}>Cancel</button>
      <span data-testid="status">{status}</span>
      <span data-testid="result">{result.id || 'none'}</span>
      {error ? (
        <p role="alert" data-action={error.action}>
          {error.message}
        </p>
      ) : null}
    </>
  );
}

function pendingService() {
  let options: BacktestRunOptions | undefined;
  let complete!: (value: BacktestResult) => void;
  const service: BacktestService = {
    run: vi.fn(
      (_request: BacktestRunRequest, runOptions?: BacktestRunOptions) => {
        options = runOptions;
        return new Promise<BacktestResult>((resolve) => {
          complete = resolve;
        });
      }
    ),
  };
  return {
    service,
    options: () => options,
    complete: (value: BacktestResult) => complete(value),
  };
}

beforeEach(() => {
  localStorage.clear();
  useLabStore.setState({ loadedBacktestId: null });
  useAuthStore.setState({ accessToken: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('BacktestProvider', () => {
  it('runs exactly the given request once and commits the result', async () => {
    const pending = pendingService();
    render(
      <BacktestProvider service={pending.service}>
        <Controls />
      </BacktestProvider>
    );

    fireEvent.click(screen.getByText('Run'));
    fireEvent.click(screen.getByText('Run'));

    expect(pending.service.run).toHaveBeenCalledTimes(1);
    expect(pending.service.run).toHaveBeenCalledWith(
      REQUEST,
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(screen.getByTestId('status').textContent).toBe('running');

    await act(async () => pending.complete(SAMPLE_RESULT));

    expect(screen.getByTestId('status').textContent).toBe('success');
    expect(screen.getByTestId('result').textContent).toBe('test-run-1');
  });

  it('exposes the accepted job id for live logs', () => {
    const pending = pendingService();
    render(
      <BacktestProvider service={pending.service}>
        <Controls />
      </BacktestProvider>
    );
    fireEvent.click(screen.getByText('Run'));

    act(() => pending.options()?.onAccepted?.('bt-42'));

    expect(useLabStore.getState().loadedBacktestId).toBe('bt-42');
  });

  it('describes a rejected run in French and retries the same request', async () => {
    const service: BacktestService = {
      run: vi
        .fn()
        .mockRejectedValueOnce(
          new ApiError(503, 'execution_unavailable', 'execution unavailable')
        )
        .mockResolvedValue(SAMPLE_RESULT),
    };
    render(
      <BacktestProvider service={service}>
        <Controls />
      </BacktestProvider>
    );

    fireEvent.click(screen.getByText('Run'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      "L'exécution des backtests est désactivée"
    );
    expect(alert.dataset.action).toBe('retry');

    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('success')
    );
    expect(service.run).toHaveBeenLastCalledWith(REQUEST, expect.anything());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('asks to reconnect and clears the session on 401', async () => {
    const clearAuth = vi.spyOn(useAuthStore.getState(), 'clearAuth');
    const service: BacktestService = {
      run: vi
        .fn()
        .mockRejectedValue(new ApiError(401, 'unauthorized', 'session')),
    };
    render(
      <BacktestProvider service={service}>
        <Controls />
      </BacktestProvider>
    );

    fireEvent.click(screen.getByText('Run'));

    const alert = await screen.findByRole('alert');
    expect(alert.dataset.action).toBe('reconnect');
    expect(clearAuth).toHaveBeenCalled();
  });

  it('cancels an in-flight run without reporting an error', async () => {
    const pending = pendingService();
    render(
      <BacktestProvider service={pending.service}>
        <Controls />
      </BacktestProvider>
    );

    fireEvent.click(screen.getByText('Run'));
    expect(pending.options()?.signal?.aborted).toBe(false);

    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByTestId('status').textContent).toBe('idle');
    expect(pending.options()?.signal?.aborted).toBe(true);
    await act(async () => pending.complete(SAMPLE_RESULT));
    expect(screen.getByTestId('result').textContent).toBe('none');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('aborts an in-flight run when the provider unmounts', async () => {
    const pending = pendingService();
    const { unmount } = render(
      <BacktestProvider service={pending.service}>
        <Controls />
      </BacktestProvider>
    );
    fireEvent.click(screen.getByText('Run'));

    unmount();

    expect(pending.options()?.signal?.aborted).toBe(true);
    await act(async () => pending.complete(SAMPLE_RESULT));
  });
});
