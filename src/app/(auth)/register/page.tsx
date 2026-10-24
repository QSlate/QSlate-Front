import type { Metadata } from 'next';
import { Suspense } from 'react';

import { RegisterForm } from '@/features/user-auth';

export const metadata: Metadata = {
  title: 'Create Account | QSlate - Pro Quant Kernel',
  description: 'Initialize a new quant researcher session with QSlate.',
};

function RegisterFallback() {
  return (
    <div className="w-full h-[520px] rounded-2xl bg-[#0d0f14]/85 border border-white/10 animate-pulse" />
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
