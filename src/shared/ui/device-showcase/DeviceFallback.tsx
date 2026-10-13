import Image from 'next/image';

export function DeviceFallback() {
  return (
    <div className="absolute inset-x-0 bottom-[8%] top-[48%] flex items-center justify-center px-6">
      <Image
        src="/lab_image.png"
        alt="QSlate dashboard preview"
        width={3070}
        height={1658}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-full w-auto max-w-full rounded-xl object-contain"
      />
    </div>
  );
}
