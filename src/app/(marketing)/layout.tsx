import type { Metadata } from 'next';

import { LandingFooter } from '@/widgets/landing-footer/LandingFooter';
import { MarketingNavbar } from '@/widgets/marketing-navbar/MarketingNavbar';

export const metadata: Metadata = {
  title: 'QSlate | The Flight Simulator for Quantitative Finance',
  description:
    'Bridge the gap between visual intuition and institutional rigor. Build, backtest, and stress-test algorithmic strategies with Rust speed and a dynamic widget workspace.',
  keywords: [
    'quantitative finance',
    'algorithmic trading',
    'backtesting',
    'rust',
    'polars',
    'market simulation',
  ],
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative min-h-screen bg-[#08090d] light:bg-white text-white light:text-zinc-900 transition-colors duration-300 overflow-x-clip selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Subtle atmospheric top gradient for professional depth in dark mode */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.06),rgba(99,102,241,0.04)_45%,transparent_70%)] blur-3xl dark:block hidden"
      />
      <MarketingNavbar />
      <main className="relative flex flex-col">{children}</main>
      <LandingFooter />
    </div>
  );
}
