'use client';

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import {
  motion,
  type MotionValue,
  useScroll,
  useTransform,
} from 'framer-motion';
import { Zap } from 'lucide-react';
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from 'react';
import { Macbook, MacbookStage, useCapabilityGate } from 'rigged-macbook-3d';
import * as THREE from 'three';

import type { ThemeMode } from '@/shared/theme/types';

import { DeviceFallback } from './DeviceFallback';
import { getShowcaseFrame } from './showcase-animation';

interface Macbook3DShowcaseProps {
  intro: ReactNode;
  theme: ThemeMode;
}

const MOBILE_QUERY = '(max-width: 767px)';

function subscribeViewport(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

const isMobileViewport = () => window.matchMedia(MOBILE_QUERY).matches;

function prepareScreenTexture(texture: THREE.Texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
}

function ControlledMacbook({
  progress,
  theme,
  isMobile,
}: {
  progress: MotionValue<number>;
  theme: ThemeMode;
  isMobile: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const frameRef = useRef({ open: 0, brightness: 0 });
  const invalidate = useThree((state) => state.invalidate);
  // Suspend until the image is ready: a late texture must not wait for a scroll
  // event to appear when the canvas uses on-demand rendering.
  const screen = useTexture('/lab_image.png', prepareScreenTexture);

  useEffect(() => {
    invalidate();
    return progress.on('change', () => invalidate());
  }, [progress, invalidate]);

  // Materials only change on model load or theme change, never on scroll.
  const applyFinish = useCallback(() => {
    const isLight = theme === 'light';
    const materials = new Set<THREE.MeshStandardMaterial>();

    groupRef.current?.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const candidates = Array.isArray(child.material)
        ? child.material
        : [child.material];
      for (const material of candidates) {
        if (
          material instanceof THREE.MeshStandardMaterial &&
          material.userData.spaceBlack
        ) {
          materials.add(material);
        }
      }
    });

    for (const material of materials) {
      material.color.set(isLight ? '#a2a7b2' : '#323846');
      material.metalness = isLight ? 0.58 : 0.8;
      material.roughness = isLight ? 0.38 : 0.4;
      material.envMapIntensity = isLight ? 1.25 : 1.4;
    }
    invalidate();
  }, [theme, invalidate]);

  useEffect(applyFinish, [applyFinish]);

  // Run before Macbook's frameDriver (priority 0) so the lid and pose agree.
  useFrame(() => {
    const frame = getShowcaseFrame(progress.get());
    frameRef.current.open = frame.open;
    frameRef.current.brightness = frame.brightness;
    if (groupRef.current) groupRef.current.position.y = frame.y;
  }, -1);

  const frameDriver = useCallback(() => frameRef.current, []);

  return (
    <group ref={groupRef} rotation-x={0.06} scale={isMobile ? 0.46 : 0.66}>
      <Macbook
        screen={screen}
        modelSrc="/models/macbook-rigged.glb"
        frameDriver={frameDriver}
        onLoad={applyFinish}
      />
    </group>
  );
}

function AnimatedShowcase({ intro, theme }: Macbook3DShowcaseProps) {
  const isMobile = useSyncExternalStore(
    subscribeViewport,
    isMobileViewport,
    () => true
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: progress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const introOpacity = useTransform(progress, [0, 0.2], [1, 0]);
  const introY = useTransform(progress, [0, 0.2], [0, -40]);
  const introPointerEvents = useTransform(progress, (p) =>
    p > 0.16 ? 'none' : 'auto'
  );
  const badgeOpacity = useTransform(progress, [0.5, 0.6], [0, 1]);

  return (
    <div ref={containerRef} className="relative h-[190svh]">
      <div className="sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[75vh] w-[90vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.22),rgba(99,102,241,0.16)_38%,rgba(15,23,42,0.4)_65%,transparent_80%)] sm:blur-3xl opacity-80 dark:opacity-100 transition-opacity"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[45vh] w-[60vw] max-w-4xl -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),rgba(56,189,248,0.08)_50%,transparent_75%)] blur-2xl dark:sm:block hidden"
        />

        <div className="absolute inset-0 z-10" aria-hidden="true">
          <MacbookStage
            lighting={theme === 'light' ? 'studio-light' : 'studio-dark'}
            lightingIntensity={theme === 'light' ? 1.1 : 1.35}
            dpr={isMobile ? 1 : [1, 1.5]}
            frameloop="demand"
          >
            <ControlledMacbook
              progress={progress}
              theme={theme}
              isMobile={isMobile}
            />
          </MacbookStage>
        </div>

        <motion.div
          style={{
            opacity: introOpacity,
            y: introY,
            pointerEvents: introPointerEvents,
          }}
          className="absolute inset-x-0 top-0 z-30 px-4 pt-[clamp(4.5rem,10vh,7rem)] sm:px-6"
        >
          {intro}
        </motion.div>

        <motion.div
          style={{ opacity: badgeOpacity }}
          className="pointer-events-none absolute inset-0 z-20 mx-auto max-w-6xl"
        >
          <div className="absolute right-4 top-[32%] rounded-xl border border-white/10 light:border-black/10 bg-black/60 light:bg-white/80 px-4 py-3 shadow-2xl sm:backdrop-blur-xl sm:right-8 lg:right-12">
            <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 light:text-zinc-500">
              Sharpe ratio
            </p>
            <p className="mt-1 flex items-baseline gap-2 font-mono text-xl tabular-nums text-white light:text-zinc-950">
              <span className="font-bold text-emerald-400">2.41</span>
              <span className="text-xs text-rose-400">Max DD -8.7%</span>
            </p>
          </div>

          <div className="absolute bottom-[16%] left-4 rounded-xl border border-white/10 light:border-black/10 bg-black/60 light:bg-white/80 p-3 shadow-2xl sm:backdrop-blur-xl sm:left-8 lg:left-12">
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
        </motion.div>
      </div>
    </div>
  );
}

export function Macbook3DShowcase(props: Macbook3DShowcaseProps) {
  const capable = useCapabilityGate();
  return capable ? (
    <AnimatedShowcase {...props} />
  ) : (
    <DeviceFallback intro={props.intro} />
  );
}
