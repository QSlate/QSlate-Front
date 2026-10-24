// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_LAYOUT,
  sanitizeLayout,
  selectActivePreset,
  selectIsWidgetMinimized,
  selectIsWidgetPinned,
  selectLayout,
  selectWidgetLayout,
  useLayoutStore,
} from '../index';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetLayout();
  });

  describe('initialization', () => {
    it('initializes with a react-grid-layout compatible default layout', () => {
      const state = useLayoutStore.getState();

      expect(state.layout).toEqual(DEFAULT_LAYOUT);
      expect(state.activePreset).toBe('default');
      expect(state.layout.every((item) => typeof item.i === 'string')).toBe(
        true
      );
    });

    it('exposes all core quantitative widgets in the default layout', () => {
      const layout = useLayoutStore.getState().layout;

      expect(layout.find((item) => item.i === 'equity-curve')).toBeDefined();
      expect(layout.find((item) => item.i === 'drawdown')).toBeDefined();
      expect(
        layout.find((item) => item.i === 'execution-metrics')
      ).toBeDefined();
    });
  });

  describe('setLayout', () => {
    it('replaces the complete grid layout', () => {
      const { setLayout } = useLayoutStore.getState();
      const nextLayout = [
        { i: 'order-book', x: 0, y: 0, w: 4, h: 4 },
        { i: 'trades', x: 4, y: 0, w: 8, h: 4 },
      ];

      setLayout(nextLayout);

      expect(useLayoutStore.getState().layout).toEqual(nextLayout);
    });

    it('preserves QSlate widget metadata omitted by grid callbacks', () => {
      const { setLayout, toggleWidgetPin } = useLayoutStore.getState();

      toggleWidgetPin('equity-curve');
      setLayout([{ i: 'equity-curve', x: 2, y: 3, w: 7, h: 5 }]);

      expect(
        selectWidgetLayout('equity-curve')(useLayoutStore.getState())
      ).toEqual({
        ...DEFAULT_LAYOUT[0],
        i: 'equity-curve',
        x: 2,
        y: 3,
        w: 7,
        h: 5,
        isPinned: true,
      });
    });
  });

  describe('updateWidget', () => {
    it('updates coordinates without modifying other widgets', () => {
      const { updateWidget } = useLayoutStore.getState();

      updateWidget('equity-curve', { x: 2, y: 3 });

      const state = useLayoutStore.getState();
      expect(selectWidgetLayout('equity-curve')(state)?.x).toBe(2);
      expect(selectWidgetLayout('equity-curve')(state)?.y).toBe(3);
      expect(selectWidgetLayout('drawdown')(state)).toEqual(DEFAULT_LAYOUT[1]);
    });

    it('updates dimensions while preserving existing attributes', () => {
      const { updateWidget } = useLayoutStore.getState();

      updateWidget('execution-metrics', { w: 6, h: 5 });

      const updated = selectWidgetLayout('execution-metrics')(
        useLayoutStore.getState()
      );
      expect(updated?.w).toBe(6);
      expect(updated?.h).toBe(5);
      expect(updated?.x).toBe(DEFAULT_LAYOUT[2]?.x);
      expect(updated?.y).toBe(DEFAULT_LAYOUT[2]?.y);
      expect(updated?.isPinned).toBe(false);
    });

    it('does not notify subscribers for unknown widget IDs', () => {
      const { updateWidget } = useLayoutStore.getState();
      const layoutBefore = useLayoutStore.getState().layout;

      updateWidget('non-existent-widget', { x: 10, y: 10 });

      expect(useLayoutStore.getState().layout).toBe(layoutBefore);
    });
  });

  describe('widget UI actions', () => {
    it('toggles the pinned state', () => {
      const { toggleWidgetPin } = useLayoutStore.getState();

      expect(
        selectIsWidgetPinned('equity-curve')(useLayoutStore.getState())
      ).toBe(false);

      toggleWidgetPin('equity-curve');
      expect(
        selectIsWidgetPinned('equity-curve')(useLayoutStore.getState())
      ).toBe(true);

      toggleWidgetPin('equity-curve');
      expect(
        selectIsWidgetPinned('equity-curve')(useLayoutStore.getState())
      ).toBe(false);
    });

    it('toggles the minimized state', () => {
      const { toggleWidgetMinimize } = useLayoutStore.getState();

      expect(
        selectIsWidgetMinimized('drawdown')(useLayoutStore.getState())
      ).toBe(false);

      toggleWidgetMinimize('drawdown');
      expect(
        selectIsWidgetMinimized('drawdown')(useLayoutStore.getState())
      ).toBe(true);

      toggleWidgetMinimize('drawdown');
      expect(
        selectIsWidgetMinimized('drawdown')(useLayoutStore.getState())
      ).toBe(false);
    });

    it('ignores UI actions for unknown widget IDs', () => {
      const { toggleWidgetMinimize, toggleWidgetPin } =
        useLayoutStore.getState();
      const layoutBefore = useLayoutStore.getState().layout;

      toggleWidgetPin('ghost-widget');
      toggleWidgetMinimize('ghost-widget');

      expect(useLayoutStore.getState().layout).toBe(layoutBefore);
    });
  });

  describe('resetLayout', () => {
    it('restores the default layout preset', () => {
      const { resetLayout, updateWidget } = useLayoutStore.getState();

      updateWidget('equity-curve', { x: 10, y: 20 });
      resetLayout();

      const state = useLayoutStore.getState();
      expect(state.layout).toEqual(DEFAULT_LAYOUT);
      expect(state.layout).not.toBe(DEFAULT_LAYOUT);
      expect(state.activePreset).toBe('default');
    });

    it('falls back to the default preset for unknown names', () => {
      useLayoutStore.getState().resetLayout('unrecognized-preset');

      const state = useLayoutStore.getState();
      expect(state.layout).toEqual(DEFAULT_LAYOUT);
      expect(state.activePreset).toBe('default');
    });

    it('rejects inherited object keys as preset names', () => {
      expect(() =>
        useLayoutStore.getState().resetLayout('toString')
      ).not.toThrow();

      expect(useLayoutStore.getState().layout).toEqual(DEFAULT_LAYOUT);
      expect(useLayoutStore.getState().activePreset).toBe('default');
    });
  });

  describe('selectors', () => {
    it('extracts focused state slices', () => {
      const state = useLayoutStore.getState();

      expect(selectLayout(state)).toBe(state.layout);
      expect(selectActivePreset(state)).toBe('default');
      expect(selectWidgetLayout('equity-curve')(state)).toEqual(
        DEFAULT_LAYOUT[0]
      );
      expect(selectWidgetLayout('non-existent')(state)).toBeUndefined();
      expect(selectIsWidgetPinned('equity-curve')(state)).toBe(false);
      expect(selectIsWidgetMinimized('equity-curve')(state)).toBe(false);
    });
  });
});

describe('Lab layout persistence', () => {
  it('keeps workspace editing functional when browser storage is unavailable', () => {
    const storageWrite = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
      });

    try {
      expect(() => {
        useLayoutStore.getState().resetLayout();
        useLayoutStore.getState().toggleWidgetMinimize('equity-curve');
        useLayoutStore.getState().removeWidget('trade-log');
      }).not.toThrow();
      expect(useLayoutStore.getState().layout).toHaveLength(3);
      expect(
        selectIsWidgetMinimized('equity-curve')(useLayoutStore.getState())
      ).toBe(true);
    } finally {
      storageWrite.mockRestore();
      useLayoutStore.getState().resetLayout();
    }
  });

  it('closes and restores widgets without allowing duplicates', () => {
    const store = useLayoutStore.getState();
    store.resetLayout();
    store.removeWidget('trade-log');
    expect(useLayoutStore.getState().layout).toHaveLength(3);
    store.addWidget('trade-log');
    store.addWidget('trade-log');
    expect(useLayoutStore.getState().layout).toHaveLength(4);
    store.addWidget('unknown');
    expect(useLayoutStore.getState().layout).toHaveLength(4);
  });

  it('rehydrates saved geometry, minimized state and closed widgets', async () => {
    const store = useLayoutStore.getState();
    store.resetLayout();
    store.updateWidget('equity-curve', { w: 7, h: 8, isMinimized: true });
    store.removeWidget('trade-log');
    const saved = localStorage.getItem('qslate_lab_layout');
    store.resetLayout();
    localStorage.setItem('qslate_lab_layout', saved!);
    await useLayoutStore.persist.rehydrate();
    expect(useLayoutStore.getState().layout).toHaveLength(3);
    expect(
      selectWidgetLayout('equity-curve')(useLayoutStore.getState())
    ).toMatchObject({ w: 7, h: 8, isMinimized: true });
  });

  it('preserves an intentionally empty workspace after rehydration', async () => {
    localStorage.setItem(
      'qslate_lab_layout',
      JSON.stringify({ version: 1, state: { layout: [] } })
    );
    await useLayoutStore.persist.rehydrate();
    expect(useLayoutStore.getState().layout).toHaveLength(0);
    useLayoutStore.getState().resetLayout();
  });
});

describe('stored layout validation', () => {
  it('rejects unknown, duplicate or malformed widgets and clamps geometry', () => {
    const valid = { ...DEFAULT_LAYOUT[0], x: -8, w: 50, h: 100 };
    const restored = sanitizeLayout([
      valid,
      valid,
      { i: 'unknown', x: 0, y: 0, w: 4, h: 4 },
      { ...DEFAULT_LAYOUT[1], w: 'broken' },
    ]);
    expect(restored).toHaveLength(1);
    expect(restored[0]).toMatchObject({ x: 0, w: 12, h: 30 });
    expect(sanitizeLayout([{ i: 'obsolete' }])).toEqual(DEFAULT_LAYOUT);
    expect(sanitizeLayout(null)).toEqual(DEFAULT_LAYOUT);
  });
});
