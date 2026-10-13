'use client';

import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { MotionValue } from 'framer-motion';
import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { Macbook, MacbookStage, useCapabilityGate } from 'rigged-macbook-3d';
import * as THREE from 'three';

import type { ThemeMode } from '@/shared/theme/types';

import { getShowcaseFrame } from './showcase-animation';

interface Macbook3DShowcaseProps {
  progress: MotionValue<number>;
  theme: ThemeMode;
  onReady: () => void;
  onUnavailable: () => void;
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
  onReady,
}: {
  progress: MotionValue<number>;
  theme: ThemeMode;
  isMobile: boolean;
  onReady: () => void;
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

  const handleLoad = useCallback(() => {
    applyFinish();
    onReady();
  }, [applyFinish, onReady]);

  const frameDriver = useCallback(() => frameRef.current, []);

  return (
    <group ref={groupRef} rotation-x={0.06} scale={isMobile ? 0.46 : 0.66}>
      <Macbook
        screen={screen}
        modelSrc="/models/macbook-rigged.glb"
        frameDriver={frameDriver}
        onLoad={handleLoad}
      />
    </group>
  );
}

export function Macbook3DShowcase({
  progress,
  theme,
  onReady,
  onUnavailable,
}: Macbook3DShowcaseProps) {
  const capable = useCapabilityGate();
  const isMobile = useSyncExternalStore(
    subscribeViewport,
    isMobileViewport,
    () => true
  );

  useEffect(() => {
    if (capable === false) onUnavailable();
  }, [capable, onUnavailable]);

  if (!capable) return null;

  return (
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
        onReady={onReady}
      />
    </MacbookStage>
  );
}
