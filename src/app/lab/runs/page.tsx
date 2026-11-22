import type { Metadata } from 'next';

import { BacktestRunsView } from '@/widgets/backtest-runs';
import { LabHeader } from '@/widgets/lab-frame';

export const metadata: Metadata = {
  title: 'Historique · QSlate',
  description: 'Auditable institutional quantitative simulation run history',
};

export default function RunsPage() {
  return (
    <>
      <LabHeader title="Historique" />
      <BacktestRunsView />
    </>
  );
}
