'use client';

import { useFrame } from '@react-three/fiber';
import { Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Macbook, MacbookStage } from 'rigged-macbook-3d';
import * as THREE from 'three';

import { useTheme } from '@/shared/theme/theme-provider';

interface Macbook3DShowcaseProps {
  intro: React.ReactNode;
}

function ControlledMacbook({
  scrollProgressRef,
  mouseRef,
  isMobile,
}: {
  scrollProgressRef: React.RefObject<number>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
  isMobile: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef({ open: 0, brightness: 0 });

  useFrame((_, delta) => {
    const p = scrollProgressRef.current ?? 0;

    // Calculate lid open amount (0 = closed, 1 = fully open)
    // Starts closed at p <= 0.04, opens progressively between 0.04 and 0.48
    const targetOpen = THREE.MathUtils.clamp((p - 0.04) / 0.44, 0, 1);
    const easedOpen =
      targetOpen < 0.5
        ? 2 * targetOpen * targetOpen
        : -1 + (4 - 2 * targetOpen) * targetOpen;

    // Screen brightness (wakes up between 0.12 and 0.50)
    const targetBrightness = THREE.MathUtils.clamp((p - 0.12) / 0.38, 0, 1);

    // Smooth damp values to ensure buttery motion
    stateRef.current.open = THREE.MathUtils.damp(
      stateRef.current.open,
      easedOpen,
      10,
      delta
    );
    stateRef.current.brightness = THREE.MathUtils.damp(
      stateRef.current.brightness,
      targetBrightness,
      10,
      delta
    );

    if (groupRef.current) {
      // Balanced scale: fits comfortably inside the viewport with generous margins
      const baseScale = isMobile ? 0.44 : 0.62;
      const diveScale = isMobile ? 0.48 : 0.68;
      const targetScale = THREE.MathUtils.lerp(
        baseScale,
        diveScale,
        THREE.MathUtils.clamp(p / 0.48, 0, 1)
      );

      // Vertical position:
      // When closed (p=0): lowered (-0.46) so headline & CTAs have breathing room above
      // When open (p>=0.45): centered perfectly at -0.26, keeping BOTH screen and keyboard visible!
      const targetY = THREE.MathUtils.lerp(
        -0.46,
        -0.26,
        THREE.MathUtils.clamp(p / 0.45, 0, 1)
      );

      // Pitch & Yaw:
      // Closed: isometric showcase tilt (pitch: 0.36, yaw: -0.14)
      // Open: authentic laptop perspective (pitch: 0.16, yaw: 0.0)
      const targetPitch = THREE.MathUtils.lerp(
        0.36,
        0.16,
        THREE.MathUtils.clamp(p / 0.45, 0, 1)
      );
      const targetYaw = THREE.MathUtils.lerp(
        -0.14,
        0.0,
        THREE.MathUtils.clamp(p / 0.45, 0, 1)
      );

      // Mouse interactive parallax (active once opened)
      const mouse = mouseRef.current ?? { x: 0, y: 0 };
      const parallaxFactor = Math.min(p / 0.3, 1);
      const parallaxYaw = mouse.x * 0.1 * parallaxFactor;
      const parallaxPitch = -mouse.y * 0.05 * parallaxFactor;

      // Apply critically damped interpolation to group transforms
      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        targetY,
        8,
        delta
      );
      groupRef.current.position.x = THREE.MathUtils.damp(
        groupRef.current.position.x,
        0,
        8,
        delta
      );

      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetPitch + parallaxPitch,
        8,
        delta
      );
      groupRef.current.rotation.y = THREE.MathUtils.damp(
        groupRef.current.rotation.y,
        targetYaw + parallaxYaw,
        8,
        delta
      );

      const currentScale = groupRef.current.scale.x;
      const newScale = THREE.MathUtils.damp(
        currentScale,
        targetScale,
        8,
        delta
      );
      groupRef.current.scale.setScalar(newScale);
    }
  });

  return (
    <group ref={groupRef}>
      <Macbook
        screen="/lab_image.png"
        modelSrc="/models/macbook-rigged.glb"
        frameDriver={() => ({
          open: stateRef.current.open,
          brightness: stateRef.current.brightness,
        })}
      />
    </group>
  );
}

export function Macbook3DShowcase({ intro }: Macbook3DShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<number>(0);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const { theme } = useTheme();

  // Scroll tracking loop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const totalScrollable = container.offsetHeight - window.innerHeight;
      if (totalScrollable <= 0) return;
      const currentScroll = -rect.top;
      const rawProgress = Math.max(
        0,
        Math.min(1, currentScroll / totalScrollable)
      );
      scrollProgressRef.current = rawProgress;
      setProgress(rawProgress);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
      const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
      mouseRef.current = { x: normalizedX, y: normalizedY };
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Intro fade calculations (smoothly clears out when scroll begins)
  const introOpacity = Math.max(0, 1 - progress / 0.16);
  const introY = -40 * Math.min(progress / 0.16, 1);
  const introPointerEvents = progress > 0.14 ? 'none' : 'auto';

  // Badges opacity calculations
  const badgesVisible = progress >= 0.42 && progress <= 0.88;
  const badgeOpacity = badgesVisible
    ? Math.min((progress - 0.42) / 0.08, 1) *
      Math.min((0.88 - progress) / 0.08, 1)
    : 0;

  const lightingPreset = theme === 'light' ? 'studio-light' : 'studio-dark';

  return (
    <div ref={containerRef} className="relative h-[180vh]">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Subtle radial ambient spotlight behind laptop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[70vh] w-[85vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.18),rgba(30,41,59,0.22)_45%,transparent_70%)] blur-3xl opacity-75 dark:opacity-90 transition-opacity"
        />

        {/* Real 3D WebGL MacBook Pro Canvas */}
        <div className="absolute inset-0 z-10">
          <MacbookStage lighting={lightingPreset} lightingIntensity={1.1}>
            <ControlledMacbook
              scrollProgressRef={scrollProgressRef}
              mouseRef={mouseRef}
              isMobile={isMobile}
            />
          </MacbookStage>
        </div>

        {/* Intro Overlay Header */}
        <div
          style={{
            opacity: introOpacity,
            transform: `translateY(${introY}px)`,
            pointerEvents: introPointerEvents as 'none' | 'auto',
          }}
          className="absolute inset-x-0 top-0 z-30 px-4 pt-[clamp(4.5rem,10vh,7rem)] sm:px-6 transition-all duration-75"
        >
          {intro}
        </div>

        {/* Floating Institutional Badges (Fade in when laptop is open) */}
        <div
          style={{ opacity: badgeOpacity }}
          className="pointer-events-none absolute inset-0 z-20 mx-auto max-w-6xl transition-opacity duration-300"
        >
          {/* Sharpe Ratio Badge - Right */}
          <div className="absolute right-4 top-[32%] rounded-xl border border-white/10 light:border-black/10 bg-black/60 light:bg-white/80 px-4 py-3 shadow-2xl backdrop-blur-xl sm:right-8 lg:right-12">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 light:text-zinc-500">
              Sharpe ratio
            </p>
            <p className="mt-1 flex items-baseline gap-2 font-mono text-xl tabular-nums text-white light:text-zinc-950">
              <span className="font-bold text-emerald-400">2.41</span>
              <span className="text-xs text-rose-400">Max DD -8.7%</span>
            </p>
          </div>

          {/* Execution Latency Fill Badge - Left */}
          <div className="absolute bottom-[16%] left-4 rounded-xl border border-white/10 light:border-black/10 bg-black/60 light:bg-white/80 p-3 shadow-2xl backdrop-blur-xl sm:left-8 lg:left-12">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30">
                <Zap className="size-4" aria-hidden="true" />
              </span>
              <div className="font-mono">
                <p className="text-[10px] uppercase tracking-wider text-zinc-400 light:text-zinc-500">
                  Execution fill
                </p>
                <p className="text-xs font-semibold text-white light:text-zinc-900">
                  ES1! <span className="text-emerald-400">BUY</span> 10 @
                  $5,120.50
                </p>
                <p className="text-[10px] text-zinc-400 light:text-zinc-500">
                  0.0ms slippage • Rust Core
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
