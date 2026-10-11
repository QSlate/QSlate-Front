// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';

import {
  DEFAULT_LAYOUTS,
  selectActivePreset,
  selectIsWidgetMinimized,
  selectIsWidgetPinned,
  selectLayouts,
  selectWidgetLayout,
  useLayoutStore,
  type WidgetLayout,
} from '../index';

describe('useLayoutStore', () => {
  beforeEach(() => {
    useLayoutStore.getState().resetLayout();
  });

  describe('initialization', () => {
    it('initializes with default layouts and default preset', () => {
      const state = useLayoutStore.getState();
      expect(state.layouts).toEqual(DEFAULT_LAYOUTS);
      expect(state.activePreset).toBe('default');
    });

    it('exposes all core quantitative widgets in default layout', () => {
      const state = useLayoutStore.getState();
      expect(state.layouts['mini-ide']).toBeDefined();
      expect(state.layouts['equity-curve']).toBeDefined();
      expect(state.layouts['drawdown']).toBeDefined();
    });
  });

  describe('updateWidgetLayout', () => {
    it('updates atomic coordinates without modifying other widgets', () => {
      const { updateWidgetLayout } = useLayoutStore.getState();

      updateWidgetLayout('mini-ide', { x: 2, y: 3 });

      const state = useLayoutStore.getState();
      expect(state.layouts['mini-ide']?.x).toBe(2);
      expect(state.layouts['mini-ide']?.y).toBe(3);
      expect(state.layouts['equity-curve']).toEqual(
        DEFAULT_LAYOUTS['equity-curve']
      );
    });

    it('updates widget dimensions while preserving existing attributes', () => {
      const { updateWidgetLayout } = useLayoutStore.getState();

      updateWidgetLayout('drawdown', { w: 6, h: 5 });

      const updated = useLayoutStore.getState().layouts['drawdown'];
      expect(updated?.w).toBe(6);
      expect(updated?.h).toBe(5);
      expect(updated?.x).toBe(DEFAULT_LAYOUTS['drawdown']?.x);
      expect(updated?.y).toBe(DEFAULT_LAYOUTS['drawdown']?.y);
      expect(updated?.isPinned).toBe(false);
    });

    it('safely ignores updates for non-existent widget IDs', () => {
      const { updateWidgetLayout } = useLayoutStore.getState();
      const layoutsBefore = useLayoutStore.getState().layouts;

      updateWidgetLayout('non-existent-widget', { x: 10, y: 10 });

      const layoutsAfter = useLayoutStore.getState().layouts;
      expect(layoutsAfter).toEqual(layoutsBefore);
      expect(layoutsAfter['non-existent-widget']).toBeUndefined();
    });
  });

  describe('batchUpdateLayouts', () => {
    it('batch updates multiple existing widgets in a single atomic transaction', () => {
      const { batchUpdateLayouts } = useLayoutStore.getState();
      const updates: WidgetLayout[] = [
        { id: 'mini-ide', x: 1, y: 1, w: 6, h: 6 },
        { id: 'equity-curve', x: 7, y: 1, w: 5, h: 3 },
      ];

      batchUpdateLayouts(updates);

      const state = useLayoutStore.getState();
      expect(state.layouts['mini-ide']?.x).toBe(1);
      expect(state.layouts['mini-ide']?.w).toBe(6);
      expect(state.layouts['equity-curve']?.x).toBe(7);
      expect(state.layouts['equity-curve']?.w).toBe(5);
      expect(state.layouts['drawdown']).toEqual(DEFAULT_LAYOUTS['drawdown']);
    });

    it('inserts new widgets when present in batch update payload', () => {
      const { batchUpdateLayouts } = useLayoutStore.getState();
      const newWidget: WidgetLayout = {
        id: 'order-book',
        x: 0,
        y: 6,
        w: 4,
        h: 4,
        minW: 2,
        minH: 2,
      };

      batchUpdateLayouts([newWidget]);

      const state = useLayoutStore.getState();
      expect(state.layouts['order-book']).toEqual(newWidget);
      expect(state.layouts['mini-ide']).toBeDefined();
    });
  });

  describe('toggleWidgetPin', () => {
    it('toggles isPinned flag cleanly', () => {
      const { toggleWidgetPin } = useLayoutStore.getState();

      expect(useLayoutStore.getState().layouts['mini-ide']?.isPinned).toBe(
        false
      );

      toggleWidgetPin('mini-ide');
      expect(useLayoutStore.getState().layouts['mini-ide']?.isPinned).toBe(
        true
      );

      toggleWidgetPin('mini-ide');
      expect(useLayoutStore.getState().layouts['mini-ide']?.isPinned).toBe(
        false
      );
    });

    it('ignores pin toggle for non-existent widget ID', () => {
      const { toggleWidgetPin } = useLayoutStore.getState();
      const before = useLayoutStore.getState().layouts;

      toggleWidgetPin('ghost-widget');

      expect(useLayoutStore.getState().layouts).toEqual(before);
    });
  });

  describe('toggleWidgetMinimize', () => {
    it('toggles isMinimized flag cleanly', () => {
      const { toggleWidgetMinimize } = useLayoutStore.getState();

      expect(
        useLayoutStore.getState().layouts['equity-curve']?.isMinimized
      ).toBe(false);

      toggleWidgetMinimize('equity-curve');
      expect(
        useLayoutStore.getState().layouts['equity-curve']?.isMinimized
      ).toBe(true);

      toggleWidgetMinimize('equity-curve');
      expect(
        useLayoutStore.getState().layouts['equity-curve']?.isMinimized
      ).toBe(false);
    });

    it('ignores minimize toggle for non-existent widget ID', () => {
      const { toggleWidgetMinimize } = useLayoutStore.getState();
      const before = useLayoutStore.getState().layouts;

      toggleWidgetMinimize('ghost-widget');

      expect(useLayoutStore.getState().layouts).toEqual(before);
    });
  });

  describe('resetLayout', () => {
    it('restores default layout preset', () => {
      const { updateWidgetLayout, resetLayout } = useLayoutStore.getState();

      updateWidgetLayout('mini-ide', { x: 10, y: 20 });
      expect(useLayoutStore.getState().layouts['mini-ide']?.x).toBe(10);

      resetLayout();

      const state = useLayoutStore.getState();
      expect(state.layouts).toEqual(DEFAULT_LAYOUTS);
      expect(state.activePreset).toBe('default');
    });

    it('falls back to default preset if unknown preset name is passed', () => {
      const { resetLayout } = useLayoutStore.getState();

      resetLayout('unrecognized-preset');

      const state = useLayoutStore.getState();
      expect(state.layouts).toEqual(DEFAULT_LAYOUTS);
      expect(state.activePreset).toBe('default');
    });
  });

  describe('selectors', () => {
    it('extracts state slices atomically via selectors', () => {
      const state = useLayoutStore.getState();

      expect(selectLayouts(state)).toEqual(state.layouts);
      expect(selectActivePreset(state)).toBe('default');
      expect(selectWidgetLayout('mini-ide')(state)).toEqual(
        state.layouts['mini-ide']
      );
      expect(selectWidgetLayout('non-existent')(state)).toBeUndefined();
      expect(selectIsWidgetPinned('mini-ide')(state)).toBe(false);
      expect(selectIsWidgetMinimized('mini-ide')(state)).toBe(false);
    });
  });
});
