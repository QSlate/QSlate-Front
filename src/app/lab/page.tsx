import type { Metadata } from 'next';

import { DynamicGridWrapper } from '@/widgets/dynamic-grid';

import { LabWorkspaceHeader } from './LabWorkspaceHeader';

export const metadata: Metadata = {
  title: 'Lab Workspace · QSlate',
  description: 'Hyper-modular quantitative backtesting laboratory',
};

export default function LabPage() {
  return (
    <main className="min-h-screen w-full bg-matte p-4 text-white flex flex-col">
      <LabWorkspaceHeader />
      <div className="flex-1 w-full">
        <DynamicGridWrapper />
      </div>
    </main>
  );
}
