import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { AuthHeader, TelemetryBanner } from '@/features/user-auth';

export const metadata: Metadata = {
  title: 'Authentication | QSlate - Pro Quant Kernel',
  description:
    'Enterprise algorithmic trading & quantitative backtesting platform.',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#050505] light:bg-[#f8f9fa] text-white light:text-zinc-900 overflow-x-hidden selection:bg-[#00ffb2] selection:text-black">
      {/* Ambient background glows & grid matrix */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Radial top-center emerald glow */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[radial-gradient(ellipse_at_center,_rgba(0,255,178,0.12),_transparent_70%)] light:bg-[radial-gradient(ellipse_at_center,_rgba(0,180,120,0.08),_transparent_70%)] blur-3xl opacity-70" />

        {/* Subtle secondary cyan/blue glow */}
        <div className="absolute top-1/3 -right-40 w-[500px] h-[400px] bg-[radial-gradient(ellipse_at_center,_rgba(0,229,255,0.06),_transparent_70%)] light:bg-[radial-gradient(ellipse_at_center,_rgba(0,120,220,0.05),_transparent_70%)] blur-3xl opacity-60" />

        {/* Faint technical grid matrix */}
        <div
          className="absolute inset-0 opacity-[0.03] light:opacity-[0.05] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] light:bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-[size:4rem_4rem]"
          aria-hidden="true"
        />
      </div>

      {/* Floating Auth Header */}
      <div className="relative z-10">
        <AuthHeader />
      </div>

      {/* Centered Main Form Container */}
      <main className="relative z-10 w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center flex-1">
        {children}
      </main>

      {/* Sovereign Telemetry Footer */}
      <div className="relative z-10">
        <TelemetryBanner />
      </div>
    </div>
  );
}
