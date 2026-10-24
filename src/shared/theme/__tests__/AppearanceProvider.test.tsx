// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { AppearanceProvider, useAppearance } from '../AppearanceProvider';

afterEach(cleanup);

describe('appearance context', () => {
  it('provides safe defaults without an application provider', () => {
    const { result } = renderHook(useAppearance);

    expect(result.current).toEqual({ theme: 'dark', colorblindMode: 'none' });
  });

  it('exposes the explicitly supplied appearance', () => {
    const { result } = renderHook(useAppearance, {
      wrapper: ({ children }: { children: ReactNode }) => (
        <AppearanceProvider
          value={{ theme: 'light', colorblindMode: 'orange-blue' }}
        >
          {children}
        </AppearanceProvider>
      ),
    });

    expect(result.current).toEqual({
      theme: 'light',
      colorblindMode: 'orange-blue',
    });
  });
});
