'use client';

import {
  ChartLine,
  Clock,
  CodeXml,
  Database,
  type LucideIcon,
  Settings,
  ShoppingBag,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useBacktest } from '@/features/run-backtest';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';

import { UserMenu } from './user-menu';

interface RailDestination {
  readonly href: string;
  readonly label: string;
  readonly icon: LucideIcon;
}

const PRIMARY_DESTINATIONS: readonly RailDestination[] = [
  { href: '/lab', label: 'Lab', icon: ChartLine },
  { href: '/lab/ide', label: 'Stratégies', icon: CodeXml },
  { href: '/lab/data', label: 'Données', icon: Database },
  { href: '/lab/runs', label: 'Historique', icon: Clock },
  { href: '/lab/marketplace', label: 'Market', icon: ShoppingBag },
];

const SETTINGS_DESTINATION: RailDestination = {
  href: '/lab/settings',
  label: 'Réglages',
  icon: Settings,
};

export function isDestinationActive(pathname: string, href: string): boolean {
  if (href === '/lab') return pathname === '/lab';
  return pathname === href || pathname.startsWith(`${href}/`);
}

interface RailLinkProps {
  readonly destination: RailDestination;
  readonly active: boolean;
  readonly busy?: boolean | undefined;
}

function RailLink({ destination, active, busy = false }: RailLinkProps) {
  const Icon = destination.icon;
  return (
    <Link
      href={destination.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        FOCUS_RING,
        'group flex w-[62px] flex-col items-center gap-0.5 rounded-xl pb-1 no-underline'
      )}
    >
      <span
        className={cn(
          'relative grid size-11 place-items-center rounded-xl transition-colors',
          active
            ? 'bg-brand-soft text-brand before:absolute before:-left-2.5 before:bottom-2.5 before:top-2.5 before:w-[3px] before:rounded-r-[3px] before:bg-[linear-gradient(var(--a1),var(--a2))] before:shadow-[0_0_12px_var(--glow)]'
            : 'text-fg-3 group-hover:bg-sunken group-hover:text-fg-2'
        )}
      >
        <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
        {busy ? (
          <span
            aria-hidden="true"
            className="absolute right-[9px] top-[9px] size-[7px] rounded-full bg-a2 shadow-[0_0_0_3px_var(--surface),0_0_10px_var(--a2)]"
          />
        ) : null}
      </span>
      <span
        className={cn(
          'whitespace-nowrap text-[10px] font-medium leading-none',
          active ? 'text-fg' : 'text-fg-3 group-hover:text-fg-2'
        )}
      >
        {destination.label}
      </span>
      {busy ? <span className="sr-only">, backtest en cours</span> : null}
    </Link>
  );
}

/** 72px icon rail shared by every /lab route. */
export function LabRail() {
  const pathname = usePathname() ?? '';
  const { status } = useBacktest();

  return (
    <nav
      aria-label="Navigation principale"
      className="sticky top-0 z-20 flex h-dvh flex-col items-center gap-2.5 border-r border-line bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] py-3.5 backdrop-blur-[12px]"
    >
      <Link
        href="/"
        aria-label="QSlate, retour à l'accueil"
        className={cn(
          FOCUS_RING,
          'mb-2.5 grid size-9 place-items-center rounded-[11px] bg-brand-gradient font-mono text-[15px] font-bold text-white no-underline shadow-[0_8px_20px_-6px_var(--glow),inset_0_1px_0_rgba(255,255,255,0.3)]'
        )}
      >
        Q
      </Link>
      <ul className="m-0 flex list-none flex-col items-center gap-2.5 p-0">
        {PRIMARY_DESTINATIONS.map((destination) => (
          <li key={destination.href}>
            <RailLink
              destination={destination}
              active={isDestinationActive(pathname, destination.href)}
              busy={
                destination.href === '/lab' &&
                (status === 'running' || status === 'cancelling')
              }
            />
          </li>
        ))}
      </ul>
      <span className="flex-1" />
      <RailLink
        destination={SETTINGS_DESTINATION}
        active={isDestinationActive(pathname, SETTINGS_DESTINATION.href)}
      />
      <UserMenu />
    </nav>
  );
}
