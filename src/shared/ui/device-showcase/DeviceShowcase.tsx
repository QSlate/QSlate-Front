'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import type { ThemeMode } from '@/shared/theme/types';

import { DeviceFallback } from './DeviceFallback';

const Macbook3DShowcase = dynamic(
  () => import('./Macbook3DShowcase').then((mod) => mod.Macbook3DShowcase),
  {
    ssr: false,
    loading: () => <DeviceFallback />,
  }
);

interface DeviceShowcaseProps {
  intro: React.ReactNode;
  theme: ThemeMode;
}

export function DeviceShowcase({ intro, theme }: DeviceShowcaseProps) {
  return <Macbook3DShowcase intro={intro} theme={theme} />;
}
