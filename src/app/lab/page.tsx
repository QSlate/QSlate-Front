import './lab.css';

import type { Metadata } from 'next';

import { LabWorkspace } from './LabWorkspace';

export const metadata: Metadata = {
  title: 'Lab Workspace · QSlate',
  description: 'Hyper-modular quantitative backtesting laboratory',
};

export default function LabPage() {
  return <LabWorkspace />;
}
