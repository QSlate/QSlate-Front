import '../lab.css';

import type { Metadata } from 'next';

import { BacktestRunsView } from '@/widgets/backtest-runs';
import { LabShell } from '@/widgets/lab-shell';

export const metadata: Metadata = {
  title: 'Backtest Runs · QSlate',
  description: 'Auditable institutional quantitative simulation run history',
};

export default function RunsPage() {
  return (
    <LabShell>
      <BacktestRunsView />
    </LabShell>
  );
}
