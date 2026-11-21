import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ResetPasswordForm } from '@/features/user-auth';

export const metadata: Metadata = {
  title: 'Set New Password | QSlate - Pro Quant Kernel',
  description:
    'Reset your institutional account credentials with high-entropy standards.',
};

function ResetPasswordFallback() {
  return (
    <div className="w-full h-96 rounded-2xl bg-[#0d0f14]/85 border border-white/10 animate-pulse" />
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
