import Image from 'next/image';
export function DeviceFallback({ loading = true }: { loading?: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-[8%] top-[48%] flex items-center justify-center px-6">
      {loading ? (
        <div
          role="status"
          aria-label="Loading device preview"
          className="w-full max-w-xl motion-safe:animate-pulse"
        >
          <span className="sr-only">Loading device preview</span>
          <div
            aria-hidden="true"
            className="mx-auto aspect-[16/9] w-[90%] rounded-t-xl border border-white/10 bg-zinc-900/70 p-4 light:border-black/10 light:bg-zinc-100"
          >
            <div className="h-full rounded-md bg-white/5 light:bg-black/5" />
          </div>
          <div
            aria-hidden="true"
            className="h-3 rounded-b-xl border border-white/10 bg-zinc-800 light:border-black/10 light:bg-zinc-200"
          />
        </div>
      ) : (
        <Image
          src="/lab_image.png"
          alt="QSlate dashboard preview"
          width={3070}
          height={1658}
          sizes="(max-width: 768px) 100vw, 768px"
          className="h-full w-auto max-w-full rounded-xl object-contain"
        />
      )}
    </div>
  );
}
