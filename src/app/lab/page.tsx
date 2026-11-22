import type { Metadata } from 'next';

import { LabWorkspace } from './LabWorkspace';

export const metadata: Metadata = {
  title: 'Lab · QSlate',
  description: 'Hyper-modular quantitative backtesting laboratory',
};

export default function LabPage() {
  return <LabWorkspace />;
}
