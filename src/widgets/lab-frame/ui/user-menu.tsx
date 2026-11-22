'use client';

import { LogOut, Moon, Sun, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { useAuthStore, useUserStore } from '@/entities/user';
import { apiClient } from '@/shared/api';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { useHydratedStore } from '@/shared/lib/store';

import { resolveUserIdentity } from '../model/user-identity';

const MENU_ITEM_CLASS = cn(
  FOCUS_RING,
  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-0 bg-transparent px-2.5 py-2 text-left text-[13px] font-medium text-fg-2 hover:bg-sunken hover:text-fg'
);

/** Avatar button opening the account panel (theme toggle, sign out). */
export function UserMenu() {
  const router = useRouter();
  const panelId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  const authUser = useHydratedStore(useAuthStore, (state) => state.user, null);
  const session = useHydratedStore(
    useUserStore,
    (state) => state.session,
    null
  );
  const theme = useHydratedStore(useUserStore, (state) => state.theme, 'dark');
  const toggleTheme = useUserStore((state) => state.toggleTheme);
  const { name, email, initials } = resolveUserIdentity(authUser, session);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      const container = containerRef.current;
      if (
        container &&
        event.target instanceof Node &&
        !container.contains(event.target)
      )
        setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await apiClient.logout();
    } catch {
      // The local session is cleared even when the gateway is unreachable.
    } finally {
      useAuthStore.getState().clearAuth();
      router.push('/login');
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-label={name ? `Compte de ${name}` : 'Mon compte'}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          FOCUS_RING,
          'grid size-[34px] cursor-pointer place-items-center rounded-full border-0 bg-[linear-gradient(135deg,var(--vio),var(--a1))] text-xs font-semibold text-white'
        )}
      >
        {initials ?? <UserRound size={16} aria-hidden="true" />}
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Compte"
          className="absolute bottom-0 left-[calc(100%+14px)] z-50 w-64 rounded-xl border border-line-strong bg-raised p-1.5 text-fg shadow-pop"
        >
          <div className="border-b border-line px-2.5 pb-2.5 pt-1.5">
            <p className="m-0 truncate text-[13px] font-semibold">
              {name ?? 'Session active'}
            </p>
            {email ? (
              <p className="m-0 truncate font-mono text-[11.5px] text-fg-3">
                {email}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-0.5 pt-1.5">
            <button
              type="button"
              className={MENU_ITEM_CLASS}
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun size={15} aria-hidden="true" />
              ) : (
                <Moon size={15} aria-hidden="true" />
              )}
              {theme === 'dark'
                ? 'Passer en thème clair'
                : 'Passer en thème sombre'}
            </button>
            <button
              type="button"
              className={cn(MENU_ITEM_CLASS, 'hover:text-loss')}
              onClick={() => void handleLogout()}
            >
              <LogOut size={15} aria-hidden="true" />
              Se déconnecter
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
