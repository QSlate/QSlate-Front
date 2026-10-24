'use client';

import { Eye, Moon, Sun } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import {
  selectColorblindMode,
  useUserStore,
  useUserTheme,
} from '@/entities/user/model';
import { useHydratedStore } from '@/shared/lib/store';

export function AuthHeader() {
  const theme = useUserTheme();
  const toggleTheme = useUserStore((state) => state.toggleTheme);
  const colorblindMode = useHydratedStore(
    useUserStore,
    selectColorblindMode,
    'none'
  );
  const toggleColorblindMode = useUserStore(
    (state) => state.toggleColorblindMode
  );
  const isColorblind = colorblindMode === 'orange-blue';

  return (
    <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-6 px-4 sm:px-6">
      {/* Brand logo + PRO KERNEL badge */}
      <Link
        href="/"
        className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg p-1"
        aria-label="QSlate Home"
      >
        <div className="relative w-8 h-8 rounded-lg overflow-hidden transition-transform group-hover:scale-105 flex items-center justify-center bg-white/5 border border-white/10 light:border-black/10">
          <Image
            src="/logo-dark.png"
            alt="QSlate Logo"
            width={28}
            height={28}
            className="w-7 h-7 object-contain light:hidden block"
            priority
          />
          <Image
            src="/logo-light.png"
            alt="QSlate Logo"
            width={28}
            height={28}
            className="w-7 h-7 object-contain hidden light:block"
            priority
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold tracking-tight text-white light:text-zinc-950 font-sans">
            QSlate
          </span>
          <span className="font-mono text-[9px] tracking-widest uppercase font-semibold text-sky-400 border border-sky-500/30 bg-sky-500/10 px-1.5 py-0.5 rounded">
            PRO KERNEL
          </span>
        </div>
      </Link>

      {/* Accessibility & Theme Toggles */}
      <div className="flex items-center gap-2.5">
        {/* Daltonism Accessibility Toggle */}
        <button
          type="button"
          onClick={toggleColorblindMode}
          aria-pressed={isColorblind}
          aria-label="Toggle Daltonism high-contrast accessibility mode"
          title={`Daltonism mode: ${isColorblind ? 'Enabled (Blue/Amber)' : 'Disabled (Standard)'}`}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            isColorblind
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-300 light:bg-sky-50 light:border-sky-300 light:text-sky-700 shadow-sm'
              : 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-400 hover:text-zinc-200 light:bg-black/5 light:border-black/10 light:text-zinc-600 light:hover:text-zinc-900'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Daltonism</span>
          <span className="text-[10px] font-semibold opacity-75">
            {isColorblind ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-2 rounded-full bg-white/5 hover:bg-white/10 light:bg-black/5 light:hover:bg-black/10 border border-white/10 light:border-black/10 text-zinc-300 light:text-zinc-700 hover:text-white light:hover:text-black transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
}
