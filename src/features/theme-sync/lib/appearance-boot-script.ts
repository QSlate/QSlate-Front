import { USER_PREFERENCES_STORAGE_KEY } from '@/entities/user';

/**
 * Inline script executed in <head> before first paint: it reads the
 * persisted user preferences (zustand `persist` format: `{ state, version }`)
 * and mirrors theme and daltonism mode on <html>, so the page never flashes
 * the default theme before React hydrates. Any failure leaves the defaults.
 */
export function buildAppearanceBootScript(
  storageKey: string = USER_PREFERENCES_STORAGE_KEY
): string {
  return `(function(){try{var raw=window.localStorage.getItem(${JSON.stringify(
    storageKey
  )});if(!raw)return;var state=(JSON.parse(raw)||{}).state||{};var root=document.documentElement;if(state.theme==='light'||state.theme==='dark'){root.setAttribute('data-theme',state.theme);}if(state.colorblindMode==='orange-blue'){root.setAttribute('data-colorblind','orange-blue');}}catch(e){}})();`;
}
