'use client';

import { Check, Lock, Upload } from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useState } from 'react';

import { useStrategies } from '@/entities/strategy';
import { ImportDatasetDialog } from '@/features/import-dataset';
import { cn, FOCUS_RING } from '@/shared/lib/class-names';
import { Button } from '@/shared/ui';

interface StepCardProps {
  readonly index: number;
  readonly title: string;
  readonly state: 'next' | 'done' | 'todo' | 'locked';
  readonly children: ReactNode;
}

function StepCard({ index, title, state, children }: StepCardProps) {
  return (
    <li
      className={cn(
        'flex flex-col gap-2 rounded-2xl border bg-surface p-[18px] shadow-card',
        state === 'next'
          ? 'border-brand-line shadow-[0_0_0_3px_var(--brand-soft)]'
          : 'border-line',
        state === 'locked' && 'opacity-70'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'grid size-7 place-items-center rounded-full font-mono text-xs font-semibold',
          state === 'done'
            ? 'bg-gain-soft text-gain'
            : state === 'next'
              ? 'bg-brand text-white'
              : 'bg-sunken text-fg-3'
        )}
      >
        {state === 'done' ? <Check size={14} /> : index}
      </span>
      <h3 className="m-0 text-[14px] font-semibold text-fg">
        <span className="sr-only">
          Étape {index}
          {state === 'done' ? ' (faite)' : ''} :{' '}
        </span>
        {title}
      </h3>
      {children}
    </li>
  );
}

/** First-run welcome: what a backtest is and the three steps to run one. */
export function LabWelcome() {
  const strategies = useStrategies();
  const [importing, setImporting] = useState(false);
  const hasStrategy = (strategies.data ?? []).length > 0;

  return (
    <section
      aria-labelledby="qs-welcome-title"
      className="flex flex-col gap-5 px-[22px] py-6"
    >
      <div className="relative overflow-hidden rounded-[20px] border border-line bg-[var(--card-hl),var(--surface)] p-7 shadow-card">
        <h2
          id="qs-welcome-title"
          className="m-0 max-w-[560px] text-[26px] font-semibold leading-tight tracking-[-0.02em] text-fg"
        >
          Teste une idée de trading{' '}
          <span className="bg-[linear-gradient(90deg,var(--a1),var(--a2))] bg-clip-text text-transparent">
            sans risquer un euro
          </span>
        </h2>
        <p className="m-0 mt-3 max-w-[560px] text-[13.5px] leading-relaxed text-fg-2">
          Un backtest rejoue une stratégie sur des prix passés pour voir ce
          qu&apos;elle aurait gagné ou perdu, sans risquer d&apos;argent. Des
          données publiques sont déjà prêtes : il ne te manque qu&apos;une
          stratégie.
        </p>
      </div>
      <ol className="m-0 grid list-none grid-cols-1 gap-3 p-0 md:grid-cols-3">
        <StepCard index={1} title="Choisir des données de marché" state="done">
          <p className="m-0 text-[12.5px] text-fg-3">
            BTC/USDT, ETH/USDT et AAPL sont disponibles en 1 h et 1 jour. Tu
            peux aussi importer ton propre fichier de bougies (CSV ou Parquet).
          </p>
          <Button
            variant="secondary"
            size="sm"
            leadingIcon={<Upload size={14} />}
            className="self-start"
            onClick={() => setImporting(true)}
          >
            Importer un fichier
          </Button>
        </StepCard>
        <StepCard
          index={2}
          title="Choisir une stratégie"
          state={hasStrategy ? 'done' : 'next'}
        >
          <p className="m-0 text-[12.5px] text-fg-3">
            Pars d&apos;un modèle commenté, comme le RSI ou le croisement de
            moyennes mobiles, ou écris la tienne en Python.
          </p>
          <Link
            href="/lab/ide"
            className={cn(
              FOCUS_RING,
              'self-start rounded-lg border border-line bg-raised px-3 py-1.5 text-xs font-medium text-fg hover:border-line-strong'
            )}
          >
            {hasStrategy ? 'Voir mes stratégies' : "Ouvrir l'éditeur"}
          </Link>
        </StepCard>
        <StepCard
          index={3}
          title="Lancer et analyser"
          state={hasStrategy ? 'next' : 'locked'}
        >
          <p className="m-0 text-[12.5px] text-fg-3">
            Choisis la stratégie, les données, la période et ton capital en haut
            de la page, puis clique sur « Lancer ». Le dashboard se remplit à la
            fin du run.
          </p>
          {hasStrategy ? null : (
            <span className="flex items-center gap-1.5 text-[11.5px] text-fg-3">
              <Lock size={12} aria-hidden="true" />
              Disponible après l&apos;étape 2
            </span>
          )}
        </StepCard>
      </ol>
      {importing ? (
        <ImportDatasetDialog onClose={() => setImporting(false)} />
      ) : null}
    </section>
  );
}
