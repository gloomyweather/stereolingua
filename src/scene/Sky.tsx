import { useMemo } from 'react';
import * as THREE from 'three';
import { U } from './uniforms';

/** the plate's ground: prussian night with faint nebulosity and a low airglow */
export function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uTime: U.uTime, uMorph: U.uMorph, uDay: U.uDay },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_Position = p.xyww;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform float uMorph;
          uniform float uDay;
          varying vec3 vDir;
          float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
          float noise(vec3 p) {
            vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
            return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)), f.x), mix(hash(i+vec3(0,1,0)), hash(i+vec3(1,1,0)), f.x), f.y),
                       mix(mix(hash(i+vec3(0,0,1)), hash(i+vec3(1,0,1)), f.x), mix(hash(i+vec3(0,1,1)), hash(i+vec3(1,1,1)), f.x), f.y), f.z);
          }
          float fbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
          void main() {
            vec3 d = normalize(vDir);
            float h = d.y;
            // linear-space inks (output is converted to sRGB by the composer)
            vec3 zenith = vec3(0.0016, 0.0026, 0.0078);
            vec3 mid = vec3(0.0026, 0.0040, 0.0118);
            vec3 low = vec3(0.0058, 0.0060, 0.0150);
            vec3 col = mix(low, mid, smoothstep(-0.35, 0.15, h));
            col = mix(col, zenith, smoothstep(0.15, 0.85, h));
            // airglow band
            col += vec3(0.0060, 0.0042, 0.0078) * exp(-pow((h + 0.05) * 5.0, 2.0));
            // faint nebulosity: dust lanes and gas
            float n = fbm(d * 3.1 + vec3(0.0, uTime * 0.004, 0.0));
            float lanes = smoothstep(0.42, 0.75, fbm(d * 6.0 + 7.3));
            col += vec3(0.0030, 0.0038, 0.0085) * smoothstep(0.45, 0.85, n);
            col *= 1.0 - lanes * 0.18;
            // day plate: laid paper with faint foxing (linear space)
            vec3 paper = mix(vec3(0.80, 0.66, 0.44), vec3(0.90, 0.81, 0.60), smoothstep(-0.4, 0.6, h));
            paper *= 1.0 - smoothstep(0.55, 0.9, fbm(d * 4.0 + 3.1)) * 0.07;
            paper *= 1.0 - smoothstep(0.5, 0.85, fbm(d * 16.0 + 1.7)) * 0.03;
            col = mix(col, paper, uDay);
            gl_FragColor = vec4(col, 1.0);
          }`,
      }),
    [],
  );
  return (
    <mesh material={mat} renderOrder={-10} frustumCulled={false} raycast={() => null}>
      <sphereGeometry args={[900, 48, 24]} />
    </mesh>
  );
}
