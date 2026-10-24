export type ThemeMode = 'dark' | 'light';

export type ColorblindMode = 'none' | 'orange-blue';

export interface Appearance {
  theme: ThemeMode;
  colorblindMode: ColorblindMode;
}
