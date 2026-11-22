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
  type BacktestJobSnapshot,
  type BacktestResult,
  type BacktestRunRequest,
  type BacktestService,
  type BacktestWatchOptions,
  EMPTY_METRICS,
  useLoadedBacktestStore,
} from '@/entities/backtest';
import { useAuthStore } from '@/entities/user';
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
  periodStart: null,
  periodEnd: null,
};

function result(id: string): BacktestResult {
  return {
    id,
    metrics: EMPTY_METRICS,
    equity: [{ time: 1000, equity: 50_000, drawdownPct: 0 }],
    trades: [],
    truncated: false,
  };
}

function snapshot(
  status: BacktestJobSnapshot['status'],
  backtestId = 'bt-1'
): BacktestJobSnapshot {
  return { backtestId, status, progress: null, error: null };
}

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Service whose every step is resolved by the test. */
function controlledService() {
  const submit = deferred<BacktestJobSnapshot>();
  const watch = deferred<BacktestJobSnapshot>();
  const watchCalls: { id: string; options: BacktestWatchOptions }[] = [];
  const service = {
    submit: vi.fn(() => submit.promise),
    watch: vi.fn((id: string, options: BacktestWatchOptions) => {
      watchCalls.push({ id, options });
      return new Promise<BacktestJobSnapshot>((resolve, reject) => {
        options.signal.addEventListener('abort', () =>
          reject(new DOMException('detached', 'AbortError'))
        );
        watch.promise.then(resolve, reject);
      });
    }),
    cancel: vi.fn(() => Promise.resolve()),
    fetchResult: vi.fn((id: string) => Promise.resolve(result(id))),
  } satisfies BacktestService;
  return { service, submit, watch, watchCalls };
}

function Controls() {
  const { run, retry, cancel, status, error, result, canRetry, activeRun } =
    useBacktest();
  return (
    <>
      <button onClick={() => void run(REQUEST)}>Run</button>
      <button onClick={() => void retry()} disabled={!canRetry}>
        Retry
      </button>
      <button onClick={cancel}>Cancel</button>
      <span data-testid="status">{status}</span>
      <span data-testid="active">{activeRun?.backtestId ?? 'none'}</span>
      <span data-testid="result">{result?.id ?? 'none'}</span>
      {error ? (
        <p role="alert" data-action={error.action}>
          {error.message}
        </p>
      ) : null}
    </>
  );
}

function renderProvider(service: BacktestService) {
  return render(
    <BacktestProvider service={service}>
      <Controls />
    </BacktestProvider>
  );
}

const status = () => screen.getByTestId('status').textContent;

beforeEach(() => {
  localStorage.clear();
  useLoadedBacktestStore.setState({ loadedBacktestId: null });
  useAuthStore.setState({ accessToken: null });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('BacktestProvider', () => {
  it('runs the request once, follows the job and loads the result on completion', async () => {
    const { service, submit, watch } = controlledService();
    renderProvider(service);

    fireEvent.click(screen.getByText('Run'));
    fireEvent.click(screen.getByText('Run'));
    expect(service.submit).toHaveBeenCalledTimes(1);
    expect(service.submit).toHaveBeenCalledWith(REQUEST);
    expect(status()).toBe('running');

    await act(async () => submit.resolve(snapshot('queued')));
    expect(screen.getByTestId('active').textContent).toBe('bt-1');
    // Not "loaded" while running: the restore effect must not touch it.
    expect(useLoadedBacktestStore.getState().loadedBacktestId).toBeNull();
    expect(service.fetchResult).not.toHaveBeenCalled();

    await act(async () => watch.resolve(snapshot('completed')));

    expect(status()).toBe('success');
    expect(screen.getByTestId('result').textContent).toBe('bt-1');
    expect(service.fetchResult).toHaveBeenCalledTimes(1);
    expect(useLoadedBacktestStore.getState().loadedBacktestId).toBe('bt-1');
    expect(screen.getByTestId('active').textContent).toBe('none');
  });

  it('cancels as soon as the job id arrives when stopped early', async () => {
    const { service, submit } = controlledService();
    renderProvider(service);

    fireEvent.click(screen.getByText('Run'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(status()).toBe('cancelling');
    fireEvent.click(screen.getByText('Run'));
    expect(service.submit).toHaveBeenCalledTimes(1);

    await act(async () => submit.resolve(snapshot('queued')));

    expect(service.cancel).toHaveBeenCalledWith('bt-1');
    expect(service.watch).not.toHaveBeenCalled();
    expect(status()).toBe('idle');
  });

  it('surfaces a failed cancel and keeps following the run', async () => {
    const { service, submit } = controlledService();
    service.cancel.mockRejectedValueOnce(
      new ApiError(409, 'state_conflict', 'x')
    );
    renderProvider(service);

    fireEvent.click(screen.getByText('Run'));
    await act(async () => submit.resolve(snapshot('running')));
    await act(async () => fireEvent.click(screen.getByText('Cancel')));

    expect(screen.getByRole('alert').textContent).toContain(
      "Impossible d'arrêter le backtest"
    );
    expect(status()).toBe('running');
    expect(screen.getByTestId('active').textContent).toBe('bt-1');
  });

  it('detaches on unmount without cancelling, then re-attaches on remount', async () => {
    const first = controlledService();
    const { unmount } = renderProvider(first.service);
    fireEvent.click(screen.getByText('Run'));
    await act(async () => first.submit.resolve(snapshot('running', 'bt-9')));

    unmount();

    expect(first.watchCalls[0]?.options.signal.aborted).toBe(true);
    expect(first.service.cancel).not.toHaveBeenCalled();

    const second = controlledService();
    renderProvider(second.service);

    await waitFor(() =>
      expect(second.service.watch).toHaveBeenCalledWith(
        'bt-9',
        expect.anything()
      )
    );
    expect(status()).toBe('running');
    await act(async () => second.watch.resolve(snapshot('completed', 'bt-9')));
    expect(screen.getByTestId('result').textContent).toBe('bt-9');
  });

  it('never lets a slow restore overwrite a newer run result', async () => {
    const { service, submit, watch } = controlledService();
    const slowRestore = deferred<BacktestResult>();
    service.fetchResult.mockImplementationOnce(() => slowRestore.promise);
    useLoadedBacktestStore.setState({ loadedBacktestId: 'bt-old' });
    renderProvider(service);

    fireEvent.click(screen.getByText('Run'));
    await act(async () => submit.resolve(snapshot('running', 'bt-new')));
    await act(async () => watch.resolve(snapshot('completed', 'bt-new')));
    expect(screen.getByTestId('result').textContent).toBe('bt-new');

    await act(async () => slowRestore.resolve(result('bt-old')));

    expect(screen.getByTestId('result').textContent).toBe('bt-new');
  });

  it('describes a rejected run in French and retries the same request', async () => {
    const { service } = controlledService();
    service.submit
      .mockRejectedValueOnce(
        new ApiError(503, 'execution_unavailable', 'execution unavailable')
      )
      .mockResolvedValueOnce(snapshot('queued'));
    renderProvider(service);

    fireEvent.click(screen.getByText('Run'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain(
      "L'exécution des backtests est désactivée"
    );
    expect(alert.dataset.action).toBe('retry');

    fireEvent.click(screen.getByText('Retry'));
    await waitFor(() => expect(service.submit).toHaveBeenCalledTimes(2));
    expect(service.submit).toHaveBeenLastCalledWith(REQUEST);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('asks to reconnect and clears the session on 401 while following', async () => {
    const clearAuth = vi.spyOn(useAuthStore.getState(), 'clearAuth');
    const { service, submit, watch } = controlledService();
    renderProvider(service);

    fireEvent.click(screen.getByText('Run'));
    await act(async () => submit.resolve(snapshot('running')));
    await act(async () =>
      watch.reject(new ApiError(401, 'unauthorized', 'session'))
    );

    expect(screen.getByRole('alert').dataset.action).toBe('reconnect');
    expect(clearAuth).toHaveBeenCalled();
    expect(status()).toBe('error');
  });
});
