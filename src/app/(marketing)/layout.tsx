import type { Metadata } from 'next';

import { ThemeProvider } from '@/shared/theme/theme-provider';
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
    <ThemeProvider>
      <div className="relative min-h-screen bg-[#050505] light:bg-white text-white light:text-zinc-900 transition-colors duration-300 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
        <MarketingNavbar />
        <main className="relative flex flex-col">{children}</main>
        <LandingFooter />
      </div>
    </ThemeProvider>
  );
}
