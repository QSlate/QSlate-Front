import type { Metadata } from 'next';

import { LabHeader } from '@/widgets/lab-frame';
import { MarketplaceView } from '@/widgets/marketplace';

export const metadata: Metadata = {
  title: 'Market · QSlate',
  description: 'Stratégies et widgets publiés par la communauté',
};

export default function MarketplacePage() {
  return (
    <>
      <LabHeader title="Market" />
      <MarketplaceView />
    </>
  );
}
