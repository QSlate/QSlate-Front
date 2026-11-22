import './globals.css';

import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { buildAppearanceBootScript, ThemeSync } from '@/features/theme-sync';

import { QueryProvider } from './providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  display: 'swap',
});

const APPEARANCE_BOOT_SCRIPT = buildAppearanceBootScript();

export const metadata: Metadata = {
  title: 'QSlate',
  description: 'Enterprise-grade quantitative finance application',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script
          // Applies saved theme/daltonism before first paint (no flash).
          dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }}
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased min-h-screen`}
      >
        <QueryProvider>
          <ThemeSync>{children}</ThemeSync>
        </QueryProvider>
      </body>
    </html>
  );
}
