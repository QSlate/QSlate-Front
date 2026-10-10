'use client';

import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import React, { useCallback } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}

export function SpotlightCard({
  children,
  className = '',
  spotlightColor = 'rgba(0, 229, 255, 0.15)',
}: SpotlightCardProps) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = useCallback(
    ({ currentTarget, clientX, clientY }: React.MouseEvent<HTMLDivElement>) => {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    },
    [mouseX, mouseY]
  );

  const background = useMotionTemplate`radial-gradient(500px circle at ${mouseX}px ${mouseY}px, ${spotlightColor}, transparent 80%)`;

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`group relative rounded-2xl border border-white/10 [data-theme=light]:border-black/5 bg-[#090b10] [data-theme=light]:bg-white overflow-hidden shadow-xl ${className}`}
    >
      {/* Interactive Radial Spotlight Layer */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
        style={{ background }}
      />

      {/* Card Interior */}
      <div className="relative z-20 h-full">{children}</div>
    </div>
  );
}
