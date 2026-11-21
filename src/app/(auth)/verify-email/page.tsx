import type { Metadata } from 'next';
import { Suspense } from 'react';

import { VerifyEmailView } from '@/features/user-auth';

export const metadata: Metadata = {
  title: 'Verify Email | QSlate - Pro Quant Kernel',
  description:
    'Cryptographically verify your institutional email address on QSlate.',
};

function VerifyEmailFallback() {
  return (
    <div className="w-full h-80 rounded-2xl bg-[#0d0f14]/85 border border-white/10 animate-pulse" />
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailView />
    </Suspense>
  );
}
