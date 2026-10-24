import '../lab.css';

import type { Metadata } from 'next';

import { LabShell } from '@/widgets/lab-shell';
import { MiniIdeView } from '@/widgets/mini-ide';

export const metadata: Metadata = {
  title: 'Mini IDE & Builder · QSlate',
  description:
    'Institutional Python strategy development environment with gVisor sandbox',
};

export default function MiniIdePage() {
  return (
    <LabShell>
      <section
        className="flex-1 w-full flex flex-col overflow-hidden"
        aria-label="Mini IDE & Builder"
      >
        <MiniIdeView />
      </section>
    </LabShell>
  );
}
