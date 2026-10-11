'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const Macbook3DShowcase = dynamic(
  () => import('./Macbook3DShowcase').then((mod) => mod.Macbook3DShowcase),
  {
    ssr: false,
    loading: () => <DeviceFallback />,
  }
);

function DeviceFallback({ intro }: { intro?: React.ReactNode }) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4">
      {intro}
      <div className="mt-8 w-full max-w-4xl aspect-[16/10] rounded-2xl bg-zinc-900/40 border border-white/5 animate-pulse" />
    </div>
  );
}

export function DeviceShowcase({ intro }: { intro: React.ReactNode }) {
  return <Macbook3DShowcase intro={intro} />;
}
