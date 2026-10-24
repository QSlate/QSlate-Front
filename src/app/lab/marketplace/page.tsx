import '../lab.css';

import type { Metadata } from 'next';

import { LabShell } from '@/widgets/lab-shell';
import { MarketplaceView } from '@/widgets/marketplace';

export const metadata: Metadata = {
  title: 'Widget Marketplace · QSlate',
  description:
    'Discover and embed verified quantitative trading modules, alternative data, and risk analytics',
};

export default function MarketplacePage() {
  return (
    <LabShell>
      <MarketplaceView />
    </LabShell>
  );
}
