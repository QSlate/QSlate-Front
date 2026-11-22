import { afterEach, describe, expect, it, vi } from 'vitest';

import type {
  BacktestStreamOptions,
  LabStreamEvent,
} from '@/shared/api/websocket';

import { type StreamWatchDeps, watchBacktestStream } from '../stream-watch';

interface FakeSession {
  readonly options: BacktestStreamOptions;
  readonly detach: ReturnType<typeof vi.fn>;
}

function event(
  eventId: number,
  type: LabStreamEvent['type'],
  data: Record<string, unknown>
): LabStreamEvent {
  return { eventId, type, data, createdAt: '' };
}

function setup(token: string | null = 'tok') {
  const sessions: FakeSession[] = [];
  const confirm = vi.fn<StreamWatchDeps['confirm']>(async (backtestId) => ({
    backtestId,
    status: 'completed',
    progress: 100,
    error: null,
  }));
  const deps: StreamWatchDeps = {
    connect: (options) => {
      const detach = vi.fn();
      sessions.push({ options, detach });
      return { detach };
    },
    getToken: () => token,
    getUrl: (id) => `ws://test/${id}`,
    confirm,
    delay: async () => undefined,
  };
  return { sessions, confirm, deps };
}

async function flush() {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
}

describe('watchBacktestStream', () => {
  afterEach(() => vi.clearAllMocks());

  it('reports progress and logs, then confirms the terminal job', async () => {
    const { sessions, confirm, deps } = setup();
    const onUpdate = vi.fn();
    const onLogs = vi.fn();
    const done = watchBacktestStream(
      'bt',
      { signal: new AbortController().signal, onUpdate, onLogs },
      deps
    );
    await flush();
    const session = sessions[0];
    expect(session?.options.accessToken).toBe('tok');
    session?.options.onEvent(
      event(1, 'status', { status: 'running', progress: 0 })
    );
    session?.options.onEvent(event(2, 'progress', { progress: 62 }));
    session?.options.onEvent(event(3, 'logs', { logs: 'a\nb\n' }));
    session?.options.onEvent(
      event(4, 'status', { status: 'completed', progress: 100 })
    );
    const final = await done;
    expect(onUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'running', progress: 62 })
    );
    expect(onLogs).toHaveBeenCalledWith(['a', 'b']);
    expect(session?.detach).toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledTimes(1);
    expect(final.status).toBe('completed');
  });

  it('resumes after the last event id when the socket drops', async () => {
    const { sessions, deps } = setup();
    const done = watchBacktestStream(
      'bt',
      { signal: new AbortController().signal },
      deps
    );
    await flush();
    sessions[0]?.options.onEvent(event(7, 'progress', { progress: 10 }));
    sessions[0]?.options.onClose({ code: 1006, reason: '' });
    await flush();
    expect(sessions[1]?.options.afterEventId).toBe(7);
    sessions[1]?.options.onEvent(
      event(8, 'status', { status: 'failed', progress: 10 })
    );
    await done;
  });

  it('falls back to polling when the stream is rejected or no token exists', async () => {
    const rejected = setup();
    const first = watchBacktestStream(
      'bt',
      { signal: new AbortController().signal },
      rejected.deps
    );
    await flush();
    rejected.sessions[0]?.options.onClose({ code: 1008, reason: 'policy' });
    await first;
    expect(rejected.sessions).toHaveLength(1);
    expect(rejected.confirm).toHaveBeenCalledTimes(1);

    const anonymous = setup(null);
    await watchBacktestStream(
      'bt',
      { signal: new AbortController().signal },
      anonymous.deps
    );
    expect(anonymous.sessions).toHaveLength(0);
    expect(anonymous.confirm).toHaveBeenCalledTimes(1);
  });

  it('detaches without confirming when aborted', async () => {
    const { sessions, confirm, deps } = setup();
    const listen = new AbortController();
    const done = watchBacktestStream('bt', { signal: listen.signal }, deps);
    await flush();
    listen.abort();
    await expect(done).rejects.toMatchObject({ name: 'AbortError' });
    expect(sessions[0]?.detach).toHaveBeenCalled();
    expect(confirm).not.toHaveBeenCalled();
  });
});
