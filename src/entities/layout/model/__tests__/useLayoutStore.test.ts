// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_LAYOUT,
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

      expect(layout.find((item) => item.i === 'mini-ide')).toBeDefined();
      expect(layout.find((item) => item.i === 'equity-curve')).toBeDefined();
      expect(layout.find((item) => item.i === 'drawdown')).toBeDefined();
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

      toggleWidgetPin('mini-ide');
      setLayout([{ i: 'mini-ide', x: 2, y: 3, w: 7, h: 5 }]);

      expect(selectWidgetLayout('mini-ide')(useLayoutStore.getState())).toEqual(
        {
          ...DEFAULT_LAYOUT[0],
          i: 'mini-ide',
          x: 2,
          y: 3,
          w: 7,
          h: 5,
          isPinned: true,
        }
      );
    });
  });

  describe('updateWidget', () => {
    it('updates coordinates without modifying other widgets', () => {
      const { updateWidget } = useLayoutStore.getState();

      updateWidget('mini-ide', { x: 2, y: 3 });

      const state = useLayoutStore.getState();
      expect(selectWidgetLayout('mini-ide')(state)?.x).toBe(2);
      expect(selectWidgetLayout('mini-ide')(state)?.y).toBe(3);
      expect(selectWidgetLayout('equity-curve')(state)).toEqual(
        DEFAULT_LAYOUT[1]
      );
    });

    it('updates dimensions while preserving existing attributes', () => {
      const { updateWidget } = useLayoutStore.getState();

      updateWidget('drawdown', { w: 6, h: 5 });

      const updated = selectWidgetLayout('drawdown')(useLayoutStore.getState());
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

      expect(selectIsWidgetPinned('mini-ide')(useLayoutStore.getState())).toBe(
        false
      );

      toggleWidgetPin('mini-ide');
      expect(selectIsWidgetPinned('mini-ide')(useLayoutStore.getState())).toBe(
        true
      );

      toggleWidgetPin('mini-ide');
      expect(selectIsWidgetPinned('mini-ide')(useLayoutStore.getState())).toBe(
        false
      );
    });

    it('toggles the minimized state', () => {
      const { toggleWidgetMinimize } = useLayoutStore.getState();

      expect(
        selectIsWidgetMinimized('equity-curve')(useLayoutStore.getState())
      ).toBe(false);

      toggleWidgetMinimize('equity-curve');
      expect(
        selectIsWidgetMinimized('equity-curve')(useLayoutStore.getState())
      ).toBe(true);

      toggleWidgetMinimize('equity-curve');
      expect(
        selectIsWidgetMinimized('equity-curve')(useLayoutStore.getState())
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

      updateWidget('mini-ide', { x: 10, y: 20 });
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
      expect(selectWidgetLayout('mini-ide')(state)).toEqual(DEFAULT_LAYOUT[0]);
      expect(selectWidgetLayout('non-existent')(state)).toBeUndefined();
      expect(selectIsWidgetPinned('mini-ide')(state)).toBe(false);
      expect(selectIsWidgetMinimized('mini-ide')(state)).toBe(false);
    });
  });
});
