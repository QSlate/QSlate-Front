import type { Metadata } from 'next';

import { DynamicGridWrapper } from '@/widgets/dynamic-grid';

export const metadata: Metadata = {
  title: 'Lab Workspace · QSlate',
  description: 'Hyper-modular quantitative backtesting laboratory',
};

export default function LabPage() {
  return (
    <main className="min-h-screen w-full bg-matte p-4 text-white">
      <DynamicGridWrapper />
    </main>
  );
}
