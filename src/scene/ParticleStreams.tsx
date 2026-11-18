import { useMemo } from 'react';
import * as THREE from 'three';
import { edges, focusSet } from './model';
import { U, themedMaterial } from './uniforms';
import { BEZ } from './glsl';
import { useStore } from '../store';
import { BRANCH_TINT, INK } from '../lib/palette';

const BUDGET = { low: 26000, medium: 60000, high: 110000 } as const;

const vert = /* glsl */ `
  uniform float uTime; uniform float uGrowY; uniform float uYearY; uniform float uPR; uniform float uMorph;
  uniform float uFocus; uniform float uJourney; uniform float uJourneyY; uniform float uFocusDist;
  attribute vec3 aP0; attribute vec3 aC1; attribute vec3 aC2; attribute vec3 aP3;
  attribute vec3 aG0; attribute vec3 aG1; attribute vec3 aG2; attribute vec3 aG3;
  attribute vec4 aSeed;  // u0, speed, radius, angle
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aGas;  // 1 = large faint nebular sprite
  attribute float aFocus;
  varying vec3 vColor; varying float vAlpha; varying float vSoft;
  ${BEZ}
  void main() {
    float u = fract(aSeed.x + uTime * aSeed.y);
    vec3 pt = bez3(aP0, aC1, aC2, aP3, u);
    vec3 pg = bez3(aG0, aG1, aG2, aG3, u);
    vec3 p = mix(pt, pg, uMorph);
    float ty = pt.y; // time lives in tree space, whatever the view
    vec3 tA = mix(bez3(aP0, aC1, aC2, aP3, min(u + 0.01, 1.0)), bez3(aG0, aG1, aG2, aG3, min(u + 0.01, 1.0)), uMorph);
    vec3 tB = mix(bez3(aP0, aC1, aC2, aP3, max(u - 0.01, 0.0)), bez3(aG0, aG1, aG2, aG3, max(u - 0.01, 0.0)), uMorph);
    vec3 tan = normalize(tA - tB + vec3(1e-5));
    vec3 ax = normalize(cross(tan, abs(tan.y) < 0.9 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
    vec3 bx = cross(tan, ax);
    float ang = aSeed.w + uTime * (0.25 + aSeed.y * 4.0);
    p += (ax * cos(ang) + bx * sin(ang)) * aSeed.z * mix(1.0, 0.5, u);

    float ends = smoothstep(0.0, 0.05, u) * smoothstep(1.0, 0.94, u);
    float grow = smoothstep(uGrowY + 0.6, uGrowY - 0.6, ty);
    float ghost = mix(0.06, 1.0, smoothstep(uYearY + 0.4, uYearY - 0.4, ty));
    float focus = mix(1.0, aFocus > 0.5 ? 1.6 : 0.2, uFocus);
    float front = exp(-pow((ty - uJourneyY) * 1.3, 2.0));
    float reached = smoothstep(uJourneyY + 0.3, uJourneyY - 0.3, ty);
    float journey = mix(1.0, aFocus > 0.5 ? (0.25 + reached * 0.9 + front * 3.5) : 1.0, uJourney);
    vAlpha = ends * grow * ghost * focus * journey * (aGas > 0.5 ? 0.03 : 0.55);
    vColor = aColor + vec3(0.9, 0.75, 0.45) * front * uJourney * aFocus * 0.8;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    // photographic depth of field: out-of-focus motes swell into soft discs
    float depth = -mv.z;
    float coc = clamp(abs(depth - uFocusDist) / max(uFocusDist, 1.0), 0.0, 1.5);
    float base = aSize * uPR * (55.0 / depth) * (aGas > 0.5 ? 1.0 : 0.8);
    float size = base * (1.0 + coc * coc * 1.4);
    vAlpha /= (1.0 + coc * coc * 4.0);
    vSoft = clamp(coc, 0.0, 1.0);
    gl_PointSize = clamp(size, 0.0, (aGas > 0.5 ? 46.0 : 9.0) * uPR);
  }
`;

const frag = /* glsl */ `
  uniform float uDay;
  varying vec3 vColor; varying float vAlpha; varying float vSoft;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    float sharp = smoothstep(1.0, 0.0, d); sharp *= sharp;
    float disc = smoothstep(1.0, 0.75, d) * 0.55 + smoothstep(1.0, 0.0, d) * 0.45;
    float a = mix(sharp, disc, vSoft) * vAlpha;
    if (a < 0.002) discard;
    gl_FragColor = uDay > 0.5 ? vec4(mix(vec3(1.0), vColor * 0.34, clamp(a * 1.5, 0.0, 1.0)), 1.0) : vec4(vColor * a, 1.0);
  }
`;

/** starlight dust flowing root → crown along every lineage, with nebular gas on the big branches */
export function ParticleStreams() {
  const quality = useStore((s) => s.quality);
  const selected = useStore((s) => s.selected);
  const word = useStore((s) => s.word);

  const geom = useMemo(() => {
    const budget = BUDGET[quality];
    const lens = edges.map((e) => e.tree.p0.distanceTo(e.tree.p3) * e.weight * (e.kind === 1 ? 0.55 : 1));
    const total = lens.reduce((a, b) => a + b, 0);
    const counts = lens.map((l) => Math.max(10, Math.round((l / total) * budget)));
    const N = counts.reduce((a, b) => a + b, 0);
    const A = (n: number) => new Float32Array(N * n);
    const P0 = A(3), C1 = A(3), C2 = A(3), P3 = A(3), G0 = A(3), G1 = A(3), G2 = A(3), G3 = A(3);
    const seed = A(4), col = A(3), size = A(1), gas = A(1), focus = A(1), pos = A(3);
    const segOf = new Uint16Array(N);
    let k = 0;
    let r = 98765;
    const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
    const ivory = new THREE.Color(INK.ivory);
    edges.forEach((e, si) => {
      const tint = new THREE.Color(BRANCH_TINT[e.branch]);
      for (let i = 0; i < counts[si]; i++, k++) {
        e.tree.p0.toArray(P0, k * 3); e.tree.c1.toArray(C1, k * 3); e.tree.c2.toArray(C2, k * 3); e.tree.p3.toArray(P3, k * 3);
        e.globe.p0.toArray(G0, k * 3); e.globe.c1.toArray(G1, k * 3); e.globe.c2.toArray(G2, k * 3); e.globe.p3.toArray(G3, k * 3);
        e.tree.p0.toArray(pos, k * 3);
        const isGas = e.kind === 0 && e.weight > 1.2 && rnd() < 0.05;
        const spread = (e.kind === 0 ? 0.62 : 0.26) * e.weight * (isGas ? 1.8 : 1);
        seed[k * 4] = rnd();
        seed[k * 4 + 1] = (0.006 + rnd() * 0.016) * (e.kind === 1 ? 0.5 : 1);
        seed[k * 4 + 2] = Math.pow(rnd(), 1.7) * spread;
        seed[k * 4 + 3] = rnd() * Math.PI * 2;
        // mostly starlight; the branch colour is a wash, not a neon
        const c = tint.clone().lerp(ivory, isGas ? 0.25 : 0.45 + rnd() * 0.35);
        if (rnd() < 0.08) c.lerp(new THREE.Color('#ffd9a8'), 0.5);
        c.toArray(col, k * 3);
        size[k] = isGas ? 9 + rnd() * 9 : 0.45 + Math.pow(rnd(), 5) * 2.4;
        gas[k] = isGas ? 1 : 0;
        segOf[k] = si;
      }
    });
    const g = new THREE.BufferGeometry();
    const set = (n: string, a: Float32Array, s: number) => g.setAttribute(n, new THREE.BufferAttribute(a, s));
    set('position', pos, 3);
    set('aP0', P0, 3); set('aC1', C1, 3); set('aC2', C2, 3); set('aP3', P3, 3);
    set('aG0', G0, 3); set('aG1', G1, 3); set('aG2', G2, 3); set('aG3', G3, 3);
    set('aSeed', seed, 4); set('aColor', col, 3); set('aSize', size, 1); set('aGas', gas, 1); set('aFocus', focus, 1);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 160);
    return { g, segOf };
  }, [quality]);

  const mat = useMemo(
    () =>
      themedMaterial(new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: U.uTime, uGrowY: U.uGrowY, uYearY: U.uYearY, uPR: U.uPR, uMorph: U.uMorph,
          uFocus: U.uFocus, uJourney: U.uJourney, uJourneyY: U.uJourneyY, uFocusDist: U.uFocusDist, uDay: U.uDay,
        },
      })),
    [],
  );

  useMemo(() => {
    const attr = geom.g.getAttribute('aFocus') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const fs = focusSet(selected, word);
    for (let i = 0; i < arr.length; i++) arr[i] = fs && fs.has(edges[geom.segOf[i]].id) ? 1 : 0;
    attr.needsUpdate = true;
  }, [selected, word, geom]);

  return <points geometry={geom.g} material={mat} frustumCulled={false} raycast={() => null} />;
}
