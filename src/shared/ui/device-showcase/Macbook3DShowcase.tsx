'use client';

import { useFrame } from '@react-three/fiber';
import { Zap } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { Macbook, MacbookStage } from 'rigged-macbook-3d';
import * as THREE from 'three';

import type { ThemeMode } from '@/shared/theme/types';

interface Macbook3DShowcaseProps {
  intro: React.ReactNode;
  theme: ThemeMode;
}

function ControlledMacbook({
  scrollProgressRef,
  isMobile,
  theme,
}: {
  scrollProgressRef: React.RefObject<number>;
  isMobile: boolean;
  theme: ThemeMode;
}) {
  const isLight = theme === 'light';
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef({ open: 0, brightness: 0 });
  const chassisMaterialsRef = useRef<THREE.MeshStandardMaterial[]>([]);
  const currentChassisColor = useRef(new THREE.Color(0.05, 0.05, 0.06));

  useFrame((_, delta) => {
    const p = scrollProgressRef.current ?? 0;

    // Dynamically adjust chassis anodized finish:
    // Dark mode: Refined Apple Space Black / Graphite (#323846) with visible chamfers & depth
    // Light mode: Authentic Apple Space Gray / Gris Sidéral (#a2a7b2)
    const targetColorHex = isLight ? '#a2a7b2' : '#323846';
    const targetMetalness = isLight ? 0.58 : 0.8;
    const targetRoughness = isLight ? 0.38 : 0.4;
    const targetEnvMap = isLight ? 1.25 : 1.4;

    currentChassisColor.current.lerp(new THREE.Color(targetColorHex), 0.12);

    if (groupRef.current) {
      if (chassisMaterialsRef.current.length === 0) {
        groupRef.current.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const mats = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            mats.forEach((m) => {
              if (m && 'color' in m && m.userData?.spaceBlack) {
                if (
                  !chassisMaterialsRef.current.includes(
                    m as THREE.MeshStandardMaterial
                  )
                ) {
                  chassisMaterialsRef.current.push(
                    m as THREE.MeshStandardMaterial
                  );
                }
              }
            });
          }
        });
      }

      for (const mat of chassisMaterialsRef.current) {
        mat.color.copy(currentChassisColor.current);
        mat.metalness = THREE.MathUtils.damp(
          mat.metalness,
          targetMetalness,
          8,
          delta
        );
        mat.roughness = THREE.MathUtils.damp(
          mat.roughness,
          targetRoughness,
          8,
          delta
        );
        if ('envMapIntensity' in mat) {
          mat.envMapIntensity = THREE.MathUtils.damp(
            mat.envMapIntensity,
            targetEnvMap,
            8,
            delta
          );
        }
      }
    }

    // Calculate lid open amount (0 = closed, 1 = fully open)
    // Opens progressively and luxuriously between p = 0.06 and p = 0.64
    const openT = THREE.MathUtils.clamp((p - 0.06) / 0.58, 0, 1);
    // Quintic smootherstep easing for ultra-buttery acceleration and soft landing
    const easedOpen = openT * openT * openT * (openT * (openT * 6 - 15) + 10);

    // Screen brightness: wakes up progressively between 18% and 90% lid opening
    const brightT = THREE.MathUtils.clamp((easedOpen - 0.18) / 0.72, 0, 1);
    const targetBrightness = brightT * brightT * (3 - 2 * brightT);

    // Velvety critically damped interpolation (lambda ~ 5.5 for smooth Apple-like inertia)
    stateRef.current.open = THREE.MathUtils.damp(
      stateRef.current.open,
      easedOpen,
      5.5,
      delta
    );
    stateRef.current.brightness = THREE.MathUtils.damp(
      stateRef.current.brightness,
      targetBrightness,
      6.0,
      delta
    );

    if (groupRef.current) {
      // Laptop is straight facing us ("face à nous simplement droit")
      const currentScale = isMobile ? 0.46 : 0.66;

      // Vertical position smoothly tied to the lid opening:
      // At easedOpen = 0 (closed): +0.12 comfortably below hero CTAs
      // At easedOpen = 1 (open): -0.06 perfectly centered with full screen & keyboard deck visible
      const targetY = THREE.MathUtils.lerp(0.12, -0.06, easedOpen);

      // Pitch is straight with a subtle tilt to reveal keyboard keys
      const targetPitch = 0.06;

      groupRef.current.position.y = THREE.MathUtils.damp(
        groupRef.current.position.y,
        targetY,
        5.5,
        delta
      );
      groupRef.current.position.x = 0;
      groupRef.current.position.z = 0;

      groupRef.current.rotation.x = THREE.MathUtils.damp(
        groupRef.current.rotation.x,
        targetPitch,
        6.0,
        delta
      );
      groupRef.current.rotation.y = 0;
      groupRef.current.rotation.z = 0;

      groupRef.current.scale.setScalar(currentScale);
    }
  });

  return (
    <group ref={groupRef}>
      {!isLight && (
        <>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[0, -2.5, 4]}
            intensity={0.55}
            color="#9cb0d4"
          />
          <directionalLight
            position={[0, 4.5, 3.5]}
            intensity={0.85}
            color="#e2ecff"
          />
          <pointLight position={[-4, 2, 3]} intensity={0.4} color="#60a5fa" />
          <pointLight position={[4, 2, 3]} intensity={0.4} color="#a78bfa" />
        </>
      )}
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

export function Macbook3DShowcase({ intro, theme }: Macbook3DShowcaseProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollProgressRef = useRef<number>(0);

  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

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

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Intro fade calculations (smoothly clears out when scroll begins)
  const introOpacity = Math.max(0, 1 - progress / 0.2);
  const introY = -40 * Math.min(progress / 0.2, 1);
  const introPointerEvents = progress > 0.16 ? 'none' : 'auto';

  // Badges opacity calculations (fade in when laptop is open)
  const badgesVisible = progress >= 0.5 && progress <= 0.88;
  const badgeOpacity = badgesVisible
    ? Math.min((progress - 0.5) / 0.1, 1) *
      Math.min((0.88 - progress) / 0.08, 1)
    : 0;

  const lightingPreset = theme === 'light' ? 'studio-light' : 'studio-dark';

  return (
    <div ref={containerRef} className="relative h-[190vh]">
      <div className="sticky top-0 flex h-screen w-full items-center justify-center overflow-hidden">
        {/* Luminous multi-depth studio stage aura behind laptop */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[75vh] w-[90vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.22),rgba(99,102,241,0.16)_38%,rgba(15,23,42,0.4)_65%,transparent_80%)] blur-3xl opacity-80 dark:opacity-100 transition-opacity"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[45vh] w-[60vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),rgba(56,189,248,0.08)_50%,transparent_75%)] blur-2xl dark:block hidden"
        />

        {/* Real 3D WebGL MacBook Pro Canvas */}
        <div className="absolute inset-0 z-10">
          <MacbookStage
            lighting={lightingPreset}
            lightingIntensity={theme === 'light' ? 1.1 : 1.35}
          >
            <ControlledMacbook
              scrollProgressRef={scrollProgressRef}
              isMobile={isMobile}
              theme={theme}
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
