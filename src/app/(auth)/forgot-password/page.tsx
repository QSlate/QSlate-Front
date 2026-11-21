import type { Metadata } from 'next';
import { Suspense } from 'react';

import { ForgotPasswordForm } from '@/features/user-auth';

export const metadata: Metadata = {
  title: 'Recover Password | QSlate - Pro Quant Kernel',
  description:
    'Request a secure password reset link for your institutional QSlate account.',
};

function ForgotPasswordFallback() {
  return (
    <div className="w-full h-80 rounded-2xl bg-[#0d0f14]/85 border border-white/10 animate-pulse" />
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
