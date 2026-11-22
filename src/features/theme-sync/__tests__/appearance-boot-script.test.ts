// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';

import { USER_PREFERENCES_STORAGE_KEY } from '@/entities/user';

import { buildAppearanceBootScript } from '../lib/appearance-boot-script';

function runBootScript() {
  // The script is a self-contained string injected in <head>; evaluate it
  // the way the browser does.
  new Function(buildAppearanceBootScript())();
}

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-colorblind');
});

describe('buildAppearanceBootScript', () => {
  it('applies the persisted theme and daltonism mode before hydration', () => {
    localStorage.setItem(
      USER_PREFERENCES_STORAGE_KEY,
      JSON.stringify({
        state: { theme: 'light', colorblindMode: 'orange-blue' },
        version: 1,
      })
    );

    runBootScript();

    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.dataset.colorblind).toBe('orange-blue');
  });

  it('ignores missing, invalid or corrupted preferences', () => {
    runBootScript();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);

    localStorage.setItem(
      USER_PREFERENCES_STORAGE_KEY,
      JSON.stringify({ state: { theme: 'neon', colorblindMode: 'none' } })
    );
    runBootScript();
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(document.documentElement.hasAttribute('data-colorblind')).toBe(
      false
    );

    localStorage.setItem(USER_PREFERENCES_STORAGE_KEY, '{not json');
    expect(runBootScript).not.toThrow();
  });
});
