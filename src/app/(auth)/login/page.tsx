import type { Metadata } from 'next';
import { Suspense } from 'react';

import { LoginForm } from '@/features/user-auth';

export const metadata: Metadata = {
  title: 'Authenticate | QSlate - Pro Quant Kernel',
  description: 'Log in to your institutional-grade backtesting workspace.',
};

function LoginFallback() {
  return (
    <div className="w-full h-96 rounded-2xl bg-[#0d0f14]/85 border border-white/10 animate-pulse" />
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
