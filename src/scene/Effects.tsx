import { EffectComposer, Bloom, Noise, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { useStore } from '../store';

/** restrained optics: a soft bloom for the stars, a plate-like vignette, a whisper of grain against banding */
export function Effects() {
  const quality = useStore((s) => s.quality);
  const plate = useStore((s) => s.plate);
  if (plate === 'day') {
    // paper does not glow: no bloom, an aged-paper vignette and grain
    return (
      <EffectComposer multisampling={0}>
        <Vignette eskil={false} offset={0.35} darkness={0.35} />
        <Noise premultiply opacity={0.3} blendFunction={BlendFunction.SOFT_LIGHT} />
      </EffectComposer>
    );
  }
  if (quality === 'low') {
    return (
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.3} luminanceSmoothing={0.35} />
      </EffectComposer>
    );
  }
  return (
    <EffectComposer multisampling={0}>
      <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.22} luminanceSmoothing={0.4} radius={0.7} />
      <Vignette eskil={false} offset={0.3} darkness={0.6} />
      <Noise premultiply opacity={0.22} blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  );
}
