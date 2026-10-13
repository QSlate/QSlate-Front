import Image from 'next/image';
import type { ReactNode } from 'react';

export function DeviceFallback({ intro }: { intro?: ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center gap-10 px-4 py-24">
      {intro}
      <Image
        src="/lab_image.png"
        alt="QSlate dashboard preview"
        width={3070}
        height={1658}
        sizes="(max-width: 1024px) 100vw, 1024px"
        className="h-auto w-full max-w-5xl rounded-2xl border border-white/10"
      />
    </div>
  );
}
