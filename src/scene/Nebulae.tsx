import { useMemo } from 'react';
import * as THREE from 'three';
import { langById, starIds, branchTint, treePos, globePos } from './model';
import { U, themedMaterial, BRANCH_INDEX } from './uniforms';
import { useStore } from '../store';

/**
 * each branch sits in its own nebula: soft, slowly churning clouds in the branch's tint,
 * seeded around its stars. at night they glow (additive light); on the day plate they become
 * watercolour washes laid under the engraving (multiplied ink).
 */

const vert = /* glsl */ `
  uniform float uTime; uniform float uPR; uniform float uGrowY; uniform float uMorph; uniform float uFocus; uniform float uHiBranch;
  attribute vec3 aPosT; attribute vec3 aPos2; attribute vec3 aColor; attribute float aSize; attribute float aSeed;
  attribute float aTreeY; attribute float aBranch;
  varying vec3 vColor; varying float vAlpha; varying float vSeed;
  void main() {
    vec3 p = mix(aPosT, aPos2, uMorph);
    // a slow drift, so the clouds breathe instead of sitting still
    p += vec3(sin(uTime * 0.05 + aSeed * 6.3), cos(uTime * 0.04 + aSeed * 4.1) * 0.5, cos(uTime * 0.05 + aSeed * 2.7)) * 0.9;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float grow = smoothstep(uGrowY + 1.5, uGrowY - 3.0, aTreeY);
    float hi = abs(aBranch - uHiBranch) < 0.5 ? 1.7 : 1.0;
    vAlpha = grow * hi * mix(1.0, 0.45, uFocus) * mix(1.0, 0.55, uMorph);
    gl_PointSize = min(aSize * uPR * (300.0 / -mv.z), 560.0 * uPR);
    vColor = aColor; vSeed = aSeed;
  }
`;

const frag = /* glsl */ `
  uniform float uTime; uniform float uDay;
  varying vec3 vColor; varying float vAlpha; varying float vSeed;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.07 + 3.1; a *= 0.5; } return s; }
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r = length(c);
    if (r > 1.0) discard;
    vec2 q = c * 2.2 + vSeed * 17.0;
    float n = fbm(q + vec2(uTime * 0.012, -uTime * 0.009));
    float wisps = smoothstep(0.32, 0.85, fbm(q * 1.7 + n * 1.6));
    float body = pow(1.0 - r, 2.2);
    float a = body * (0.35 + 0.95 * wisps) * vAlpha;
    if (uDay > 0.5) {
      // watercolour wash: pigment pools at the cloud's ragged edge, as wet paint dries
      vec3 pigment = pow(vColor, vec3(1.6)) * 0.95;
      float edge = smoothstep(0.25, 0.6, wisps) * (1.0 - smoothstep(0.75, 1.0, r));
      float k = clamp(a * 1.5 + edge * 0.16 * vAlpha, 0.0, 0.42);
      gl_FragColor = vec4(mix(vec3(1.0), pigment, k), 1.0);
      return;
    }
    gl_FragColor = vec4(vColor * a * 0.13, 1.0);
  }
`;

export function Nebulae() {
  const quality = useStore((s) => s.quality);
  // weak devices keep the clouds, but only around the proto-languages (a tenth of the sprites)
  const perStar = quality === 'high' ? 2 : quality === 'medium' ? 1 : 0;

  const geom = useMemo(() => {
    let seed = 11;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const ids = starIds.filter((id) => {
      const l = langById.get(id);
      return l && l.branch !== 'root' && l.branch !== 'contact';
    });
    const pos: number[] = [], pos2: number[] = [], col: number[] = [], size: number[] = [];
    const seeds: number[] = [], ty: number[] = [], br: number[] = [];
    for (const id of ids) {
      const l = langById.get(id)!;
      const t = treePos(id), g = globePos(id), c = branchTint(id);
      const n = l.status === 'proto' ? perStar + 1 : perStar;
      const big = perStar === 0 ? 1.6 : 1;
      for (let k = 0; k < n; k++) {
        const j = new THREE.Vector3(rnd() - 0.5, (rnd() - 0.5) * 0.6, rnd() - 0.5).multiplyScalar(7);
        pos.push(t.x + j.x, t.y + j.y, t.z + j.z);
        pos2.push(g.x + j.x * 0.4, g.y + j.y * 0.4, g.z + j.z * 0.4);
        col.push(c.r, c.g, c.b);
        size.push((16 + rnd() * 22 + (l.status === 'proto' ? 10 : 0)) * big);
        seeds.push(rnd());
        ty.push(t.y);
        br.push(BRANCH_INDEX[l.branch] ?? -1);
      }
    }
    const geo = new THREE.BufferGeometry();
    const set = (k: string, a: number[], s: number) => geo.setAttribute(k, new THREE.BufferAttribute(new Float32Array(a), s));
    set('position', pos, 3); set('aPosT', pos, 3); set('aPos2', pos2, 3); set('aColor', col, 3); set('aSize', size, 1);
    set('aSeed', seeds, 1); set('aTreeY', ty, 1); set('aBranch', br, 1);
    geo.computeBoundingSphere();
    geo.boundingSphere!.radius += 60;
    return geo;
  }, [perStar]);

  const mat = useMemo(
    () =>
      themedMaterial(
        new THREE.ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag,
          transparent: true,
          depthWrite: false,
          depthTest: false,
          uniforms: {
            uTime: U.uTime, uPR: U.uPR, uGrowY: U.uGrowY, uMorph: U.uMorph, uFocus: U.uFocus,
            uHiBranch: U.uHiBranch, uDay: U.uDay,
          },
        }),
      ),
    [],
  );

  return <points geometry={geom} material={mat} frustumCulled={false} raycast={() => null} renderOrder={-4} />;
}
