'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  advanceCursor,
  type ReplaySpeed,
  type ReplayTimeline,
} from './replay-timeline';

/** A hidden tab or a long frame never jumps more than this at once. */
const MAX_FRAME_MS = 100;

export interface ReplayPlayer {
  readonly cursor: number;
  readonly playing: boolean;
  readonly speed: ReplaySpeed;
  readonly stopOnTrades: boolean;
  /** The cursor is on the last candle. */
  readonly ended: boolean;
  readonly toggle: () => void;
  readonly pause: () => void;
  readonly seek: (index: number) => void;
  readonly step: (delta: number) => void;
  readonly toPreviousTrade: () => void;
  readonly toNextTrade: () => void;
  readonly setSpeed: (speed: ReplaySpeed) => void;
  readonly setStopOnTrades: (value: boolean) => void;
}

/**
 * Playback state of a replay: a requestAnimationFrame loop reveals
 * `BASE_CANDLES_PER_SECOND × speed` candles per second, and stops at the
 * end, or on the next order when "stop on trades" is on. Manual moves
 * pause the playback.
 */
export function useReplayPlayer(timeline: ReplayTimeline): ReplayPlayer {
  const lastIndex = Math.max(timeline.length - 1, 0);
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<ReplaySpeed>(1);
  const [stopOnTrades, setStopOnTrades] = useState(false);
  const cursorRef = useRef(cursor);
  const settingsRef = useRef({ speed, stopOnTrades, timeline, lastIndex });

  useEffect(() => {
    cursorRef.current = cursor;
    settingsRef.current = { speed, stopOnTrades, timeline, lastIndex };
  });

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous: number | null = null;
    let carry = 0;
    const tick = (now: number) => {
      const elapsed = previous === null ? 0 : now - previous;
      previous = now;
      const settings = settingsRef.current;
      const from = cursorRef.current;
      const next = advanceCursor(
        from,
        carry,
        Math.min(elapsed, MAX_FRAME_MS),
        settings.speed,
        settings.lastIndex,
        settings.stopOnTrades ? settings.timeline.nextEventCandle(from) : null
      );
      carry = next.carry;
      if (next.cursor !== from) {
        cursorRef.current = next.cursor;
        setCursor(next.cursor);
      }
      if (next.stop) {
        setPlaying(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const seek = useCallback(
    (index: number) => {
      setPlaying(false);
      const next = Math.min(Math.max(Math.round(index), 0), lastIndex);
      cursorRef.current = next;
      setCursor(next);
    },
    [lastIndex]
  );

  const toggle = useCallback(() => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (lastIndex === 0) return;
    if (cursorRef.current >= lastIndex) {
      cursorRef.current = 0;
      setCursor(0);
    }
    setPlaying(true);
  }, [playing, lastIndex]);

  return {
    cursor,
    playing,
    speed,
    stopOnTrades,
    ended: cursor >= lastIndex,
    toggle,
    pause: useCallback(() => setPlaying(false), []),
    seek,
    step: useCallback(
      (delta: number) => seek(cursorRef.current + delta),
      [seek]
    ),
    toPreviousTrade: useCallback(() => {
      const target = timeline.previousEventCandle(cursorRef.current);
      if (target !== null) seek(target);
    }, [timeline, seek]),
    toNextTrade: useCallback(() => {
      const target = timeline.nextEventCandle(cursorRef.current);
      if (target !== null) seek(target);
    }, [timeline, seek]),
    setSpeed,
    setStopOnTrades,
  };
}
