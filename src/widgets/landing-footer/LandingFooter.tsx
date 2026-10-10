'use client';

import Link from 'next/link';

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'PRODUCT',
    links: [
      { label: 'Flight Simulator', href: '/lab' },
      { label: 'Kernel 2.0', href: '#architecture' },
      { label: 'Marketplace', href: '#marketplace' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'RESOURCES',
    links: [
      { label: 'Documentation', href: '#docs' },
      { label: 'API Reference', href: '#api' },
      { label: 'Python SDK', href: '#sdk' },
      { label: 'Changelog', href: '#changelog' },
    ],
  },
  {
    title: 'COMPANY',
    links: [
      { label: 'About', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Security', href: '#security' },
      { label: 'Legal', href: '#legal' },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="relative w-full border-t border-white/10 [data-theme=light]:border-black/5 bg-[#050505] [data-theme=light]:bg-white text-zinc-400 [data-theme=light]:text-zinc-600 transition-colors">
      <div className="max-w-6xl mx-auto px-4 py-16 sm:py-20">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 lg:gap-16">
          {/* Brand Info (2 columns) */}
          <div className="md:col-span-2 flex flex-col justify-between space-y-6">
            <div>
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 p-[1px] shadow-[0_0_15px_rgba(0,255,178,0.25)]">
                  <div className="w-full h-full bg-[#050505] rounded-[7px] flex items-center justify-center">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="w-4 h-4 text-cyan-400"
                    >
                      <path
                        d="M12 2L2 7L12 12L22 7L12 2Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 17L12 22L22 17"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M2 12L12 17L22 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
                <span className="text-lg font-bold tracking-tight text-white [data-theme=light]:text-zinc-900 font-mono">
                  QSlate
                </span>
              </Link>

              <p className="mt-4 text-xs sm:text-sm text-zinc-400 [data-theme=light]:text-zinc-600 leading-relaxed max-w-sm font-sans">
                The flight simulator for quantitative finance. Modern web
                accessibility married with SIMD-accelerated low-latency kernel
                speed.
              </p>
            </div>

            {/* Social Network Icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub Repository"
                className="p-2 rounded-lg bg-white/5 [data-theme=light]:bg-black/5 hover:text-white [data-theme=light]:hover:text-black hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                aria-label="X Twitter"
                className="p-2 rounded-lg bg-white/5 [data-theme=light]:bg-black/5 hover:text-white [data-theme=light]:hover:text-black hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                aria-label="Discord Community"
                className="p-2 rounded-lg bg-white/5 [data-theme=light]:bg-black/5 hover:text-white [data-theme=light]:hover:text-black hover:bg-white/10 transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.894.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Links Columns (3 columns) */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {FOOTER_COLUMNS.map((column, idx) => (
              <div key={idx} className="space-y-4">
                <h4 className="text-[11px] font-mono uppercase tracking-widest font-semibold text-white [data-theme=light]:text-zinc-900">
                  {column.title}
                </h4>
                <ul className="space-y-2.5 font-mono text-xs">
                  {column.links.map((link, linkIdx) => (
                    <li key={linkIdx}>
                      <a
                        href={link.href}
                        className="text-zinc-400 [data-theme=light]:text-zinc-600 hover:text-white [data-theme=light]:hover:text-black transition-colors"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Metadata Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 [data-theme=light]:border-black/5 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-zinc-500">
          <div className="flex items-center gap-4">
            <span>&copy; 2026 QSlate Inc. All rights reserved.</span>
            <span className="hidden sm:inline">&bull;</span>
            <span className="hidden sm:inline">
              Technical Service Provider (Hypothetical simulation only)
            </span>
          </div>

          {/* Live Systems Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
