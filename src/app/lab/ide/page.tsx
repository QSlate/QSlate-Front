import type { Metadata } from 'next';

import { LabHeader } from '@/widgets/lab-frame';
import { MiniIdeView } from '@/widgets/mini-ide';

export const metadata: Metadata = {
  title: 'Stratégies · QSlate',
  description:
    'Institutional Python strategy development environment with gVisor sandbox',
};

export default function MiniIdePage() {
  return (
    <>
      <LabHeader title="Stratégies" />
      <section
        className="flex w-full flex-1 flex-col overflow-hidden"
        aria-label="Éditeur de stratégies"
      >
        <MiniIdeView />
      </section>
    </>
  );
}
