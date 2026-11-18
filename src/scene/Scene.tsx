import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { Sky } from './Sky';
import { Starfield } from './Starfield';
import { Graticule } from './Graticule';
import { Constellation, branchIndexOf } from './Constellation';
import { ParticleStreams } from './ParticleStreams';
import { Stars } from './Stars';
import { LineageTrace } from './LineageTrace';
import { Labels } from './Labels';
import { Journey } from './Journey';
import { Meteors } from './Meteors';
import { CameraRig, OVERVIEW_POS } from './CameraRig';
import { Driver } from './Driver';
import { Effects } from './Effects';
import { U } from './uniforms';
import { useStore } from '../store';
import { INK } from '../lib/palette';

// hovered branch drives the constellation highlight
useStore.subscribe((s, p) => {
  if (s.hovered !== p.hovered) U.uHiBranch.value = branchIndexOf(s.hovered);
});

export function Scene() {
  const setQuality = useStore((s) => s.setQuality);
  const select = useStore((s) => s.select);
  const quality = useStore((s) => s.quality);
  return (
    <Canvas
      className="scene-canvas"
      camera={{ position: OVERVIEW_POS.toArray(), fov: 48, near: 0.1, far: 2000 }}
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
      raycaster={{ params: { Points: { threshold: 0.9 } } as never }}
      onCreated={({ gl }) => gl.setClearColor(INK.night)}
      onPointerMissed={() => {
        const s = useStore.getState();
        if (!s.flying && s.phase === 'explore') select(null);
      }}
    >
      <PerformanceMonitor
        onDecline={() => {
          const q = useStore.getState().quality;
          if (q === 'high') setQuality('medium');
          else if (q === 'medium') setQuality('low');
        }}
      />
      <AdaptiveDpr pixelated={false} />
      <Driver />
      <Sky />
      <Starfield count={quality === 'low' ? 3000 : 6500} />
      <Graticule />
      <Constellation />
      <ParticleStreams />
      <Stars />
      <LineageTrace />
      <Labels />
      <Journey />
      <Meteors />
      <CameraRig />
      <Effects />
    </Canvas>
  );
}
