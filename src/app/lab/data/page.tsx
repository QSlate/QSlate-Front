import type { Metadata } from 'next';

import { DatasetsView } from '@/widgets/datasets-view';
import { LabHeader } from '@/widgets/lab-frame';

export const metadata: Metadata = {
  title: 'Données · QSlate',
  description: 'Market data and custom datasets used by your backtests',
};

export default function DataPage() {
  return (
    <>
      <LabHeader title="Données" />
      <DatasetsView />
    </>
  );
}
