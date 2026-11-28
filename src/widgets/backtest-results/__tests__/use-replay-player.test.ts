// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ReplayTimeline } from '../model/replay-timeline';
import { useReplayPlayer } from '../model/use-replay-player';

const EVENTS = [3, 6] as const;

const TIMELINE: ReplayTimeline = {
  length: 20,
  events: [],
  figuresAt: () => ({
    capital: null,
    returnPct: null,
    drawdownPct: null,
    closedTrades: 0,
    winRatePct: null,
    lastEvent: null,
  }),
  eventCountAt: () => 0,
  previousEventCandle: (cursor) =>
    [...EVENTS].reverse().find((candle) => candle < cursor) ?? null,
  nextEventCandle: (cursor) => EVENTS.find((candle) => candle > cursor) ?? null,
};

let frames: FrameRequestCallback[] = [];
let now = 0;

/** Runs the pending animation frames `count` times, `ms` apart. */
function runFrames(count: number, ms: number) {
  for (let index = 0; index < count; index += 1) {
    const pending = frames;
    frames = [];
    now += ms;
    act(() => {
      for (const callback of pending) callback(now);
    });
  }
}

beforeEach(() => {
  frames = [];
  now = 0;
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frames.push(callback);
    return frames.length;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('useReplayPlayer', () => {
  it('starts paused on the first candle at ×1', () => {
    const { result } = renderHook(() => useReplayPlayer(TIMELINE));
    expect(result.current).toMatchObject({
      cursor: 0,
      playing: false,
      speed: 1,
      stopOnTrades: false,
      ended: false,
    });
  });

  it('plays 4 candles per second and pauses', () => {
    const { result } = renderHook(() => useReplayPlayer(TIMELINE));
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(true);
    runFrames(1, 0);
    runFrames(10, 100);
    expect(result.current.cursor).toBe(4);
    act(() => result.current.toggle());
    expect(result.current.playing).toBe(false);
  });

  it('never jumps more than 100 ms of candles in one frame', () => {
    const { result } = renderHook(() => useReplayPlayer(TIMELINE));
    act(() => result.current.setSpeed(10));
    act(() => result.current.toggle());
    runFrames(1, 0);
    runFrames(1, 60_000);
    expect(result.current.cursor).toBe(4);
  });

  it('stops at the end, then replays from the start', () => {
    const { result } = renderHook(() => useReplayPlayer(TIMELINE));
    act(() => result.current.setSpeed(50));
    act(() => result.current.toggle());
    runFrames(1, 0);
    runFrames(3, 100);
    expect(result.current).toMatchObject({
      cursor: 19,
      playing: false,
      ended: true,
    });
    act(() => result.current.toggle());
    expect(result.current).toMatchObject({ cursor: 0, playing: true });
  });

  it('pauses on the next order when asked to', () => {
    const { result } = renderHook(() => useReplayPlayer(TIMELINE));
    act(() => result.current.setStopOnTrades(true));
    act(() => result.current.setSpeed(10));
    act(() => result.current.toggle());
    runFrames(1, 0);
    runFrames(2, 100);
    expect(result.current).toMatchObject({ cursor: 3, playing: false });
  });

  it('steps, seeks and jumps between orders within the candles', () => {
    const { result } = renderHook(() => useReplayPlayer(TIMELINE));
    act(() => result.current.step(-1));
    expect(result.current.cursor).toBe(0);
    act(() => result.current.toNextTrade());
    expect(result.current.cursor).toBe(3);
    act(() => result.current.toNextTrade());
    expect(result.current.cursor).toBe(6);
    act(() => result.current.toPreviousTrade());
    expect(result.current.cursor).toBe(3);
    act(() => result.current.seek(99));
    expect(result.current).toMatchObject({ cursor: 19, ended: true });
    act(() => result.current.step(-2));
    expect(result.current.cursor).toBe(17);
  });

  it('pauses on a manual move', () => {
    const { result } = renderHook(() => useReplayPlayer(TIMELINE));
    act(() => result.current.toggle());
    act(() => result.current.step(1));
    expect(result.current.playing).toBe(false);
  });
});
