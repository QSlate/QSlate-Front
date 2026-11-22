import type { Metadata } from 'next';

import { LabHeader } from '@/widgets/lab-frame';
import { MarketplaceView } from '@/widgets/marketplace';

export const metadata: Metadata = {
  title: 'Market · QSlate',
  description:
    'Discover and embed verified quantitative trading modules, alternative data, and risk analytics',
};

export default function MarketplacePage() {
  return (
    <>
      <LabHeader title="Market" />
      <MarketplaceView />
    </>
  );
}
