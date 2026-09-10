import './globals.css';

import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

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
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} antialiased min-h-screen`}
        style={{ fontFamily: 'var(--font-jetbrains-mono)' }}
      >
        {children}
      </body>
    </html>
  );
}
