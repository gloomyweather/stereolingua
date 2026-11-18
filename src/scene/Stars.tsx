import { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { layout, langById, starIds, starIndex, branchTint, focusSet, globePos, wordCarriers } from './model';
import { U, themedMaterial } from './uniforms';
import { useStore } from '../store';
import { yearToY } from '../lib/timeScale';
import { INK } from '../lib/palette';
import type { Language } from '../data/types';

const STATUS = { proto: 0, ancient: 1, medieval: 2, living: 3, extinct: 4 } as const;
const MORPH = { isolating: 0, analytic: 1, fusional: 2, agglutinative: 3, mixed: 2 } as const;
const ORDER_ASYM: Record<string, number> = { SOV: 0.35, SVO: 0.0, VSO: 0.6, VOS: 0.6, V2: 0.2, free: 0.9, unknown: 0.0 };

/** typological sigil parameters, shared with the panel's drawing */
export function sigilParams(l: Language) {
  const f = l.features;
  return {
    rays: Math.min(f.cases ?? 0, 16),
    rings: f.tonal ? 1 : 0,
    orbits: Math.min(f.genders ?? 0, 4),
    asym: ORDER_ASYM[f.wordOrder] ?? 0,
    morph: MORPH[f.morphology] ?? 2,
    dual: f.dual ? 1 : 0,
  };
}

const vert = /* glsl */ `
  uniform float uTime; uniform float uPR; uniform float uGrowY; uniform float uYearY; uniform float uFocus;
  uniform float uMorph; uniform float uJourney; uniform float uJourneyY;
  attribute vec3 aPosT; attribute vec3 aPos2; attribute vec3 aColor; attribute float aSize; attribute vec4 aSig; attribute vec3 aSig2;
  attribute float aHi; attribute float aTreeY; attribute float aEndY; attribute float aCarrier;
  varying vec3 vColor; varying vec4 vSig; varying vec3 vSig2; varying float vHi; varying float vAlpha;
  varying float vSeed; varying float vSize; varying float vFlare;
  void main() {
    vec3 p = mix(aPosT, aPos2, uMorph);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float grow = smoothstep(uGrowY + 0.2, uGrowY - 0.5, aTreeY);
    float ghost = mix(0.14, 1.0, smoothstep(uYearY + 0.25, uYearY - 0.25, aTreeY));
    float gone = uYearY < 999.0 ? mix(1.0, 0.45, step(aEndY, uYearY)) : 1.0;
    float focus = mix(1.0, aHi > 0.5 ? 1.0 : 0.3, uFocus);
    // birth flares: a star flashes as the growth front, the year horizon or a word's journey reaches it
    float dg = uGrowY - aTreeY; float dy = uYearY - aTreeY; float dj = uJourneyY - aTreeY;
    float flare = max(dg > 0.0 ? exp(-dg * 1.4) : 0.0, (uYearY < 999.0 && dy > 0.0) ? exp(-dy * 2.0) : 0.0);
    flare = max(flare, aCarrier * uJourney * (dj > 0.0 ? exp(-dj * 1.6) : 0.0));
    vFlare = flare;
    float journeyDim = mix(1.0, aCarrier > 0.5 ? smoothstep(-0.1, 0.4, dj) * 0.9 + 0.1 : 1.0, uJourney);
    vAlpha = grow * ghost * gone * focus * journeyDim;
    float s = aSize * (1.0 + 0.55 * step(1.5, aHi) + 0.2 * step(2.5, aHi)) * (1.0 + flare * 0.8);
    vSize = min(s * uPR * (240.0 / -mv.z), 170.0 * uPR);
    gl_PointSize = vSize;
    vColor = aColor; vSig = aSig; vSig2 = aSig2; vHi = aHi;
    vSeed = fract(sin(dot(aPosT.xz, vec2(12.9898, 78.233))) * 43758.5453);
  }
`;

const frag = /* glsl */ `
  uniform float uTime;
  uniform vec3 uIvory;
  uniform float uDay;
  varying vec3 vColor; varying vec4 vSig; varying vec3 vSig2; varying float vHi; varying float vAlpha;
  varying float vSeed; varying float vSize; varying float vFlare;
  #define PI 3.14159265
  float lineAA(float d, float w, float px) { return smoothstep(w + px, w - px * 0.5, d); }
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    c.y = -c.y;
    float r = length(c);
    if (r > 1.0) discard;
    float px = 2.4 / max(vSize, 1.0);
    float a = atan(c.y, c.x);
    float t = uTime;
    float status = vSig2.y; float morph = vSig2.x;
    float rays = vSig.x, rings = vSig.y, orbits = vSig.z, asym = vSig.w;
    bool proto = status < 0.5;
    bool dead = status > 3.5 || (status > 0.5 && status < 1.5);
    bool medieval = status > 1.5 && status < 2.5;

    float ink = 0.0;   // ivory engraving
    float tintA = 0.0; // tinted parts
    // --- the star symbol
    if (proto) {
      // reconstructed: an asterisk, the philologist's mark for an unattested form
      float arms = 0.0;
      for (int i = 0; i < 3; i++) {
        float ang = float(i) * PI / 3.0 + PI / 2.0 + t * 0.03;
        vec2 dir = vec2(cos(ang), sin(ang));
        float along = dot(c, dir);
        float across = abs(dot(c, vec2(-dir.y, dir.x)));
        arms = max(arms, lineAA(across, 0.045 * (1.0 - abs(along) * 0.6), px) * step(abs(along), 0.52));
      }
      ink += arms;
      tintA += exp(-r * 3.2) * 0.35; // nebulous halo
    } else if (dead) {
      ink += lineAA(abs(r - 0.17), 0.04, px);   // hollow: attested, but no longer spoken
    } else {
      ink += lineAA(r, medieval ? 0.13 : 0.18, px);
      if (medieval) ink += lineAA(abs(r - 0.25), 0.02, px) * 0.8;
    }
    // --- grammar sigil: rays = cases, ring = tone, orbiting dots = genders, twin core = dual
    if (!proto) {
      if (rays > 0.5) {
        float rot = vSeed * 6.283;
        float k = rays;
        float sector = 2.0 * PI / k;
        float aa = mod(a - rot + sector * 0.5, sector) - sector * 0.5;
        float across = abs(sin(aa)) * r;
        float len = 0.66 * (1.0 + asym * 0.32 * cos(a - rot));
        if (morph > 1.5 && morph < 2.5) len *= 0.94 + 0.06 * sin(t * 2.2 + a * 3.0);
        float seg = morph > 2.5 ? step(0.42, fract(r * 9.0)) : 1.0;
        float ray = lineAA(across, 0.012 + 0.006 * (1.0 - r), px) * step(0.27, r) * smoothstep(len, len - 0.08, r) * seg;
        tintA += ray * 0.95;
      }
      if (rings > 0.5) tintA += lineAA(abs(r - 0.42), 0.012, px) * 0.9;
      for (int i = 0; i < 4; i++) {
        if (float(i) >= orbits) break;
        float ang = t * 0.35 + float(i) * 2.0 * PI / max(orbits, 1.0) + vSeed * 3.0;
        vec2 o = vec2(cos(ang), sin(ang)) * 0.78;
        tintA += lineAA(length(c - o), 0.045, px);
      }
      if (vSig2.z > 0.5) ink += lineAA(length(c - vec2(0.3, 0.0)), 0.065, px) * 0.9;
    }
    float glow = exp(-r * 5.0) * (proto ? 0.15 : 0.32) + vFlare * exp(-r * 2.5) * 0.9;
    // living languages breathe: a slow pulse of light, each star on its own rhythm
    bool living = status > 2.5 && status < 3.5;
    if (living) {
      float beat = 0.5 + 0.5 * sin(t * (0.9 + vSeed * 0.7) + vSeed * 6.283);
      glow *= 0.75 + 0.75 * beat;
      tintA += lineAA(abs(r - (0.86 + 0.06 * beat)), 0.008, px) * 0.35 * beat;
    }
    vec3 tinted = mix(vColor, uIvory, 0.25);
    vec3 col = uIvory * ink + tinted * (tintA + glow);
    if (dead) col *= vec3(0.86, 0.84, 0.8);
    // selection: a fine gilt circle, as an engraver would ring a star of note
    if (vHi > 1.5) col += vec3(0.85, 0.71, 0.43) * lineAA(abs(r - 0.92), 0.018, px) * 1.2;
    if (vHi > 2.5) col += uIvory * lineAA(abs(r - 0.92), 0.012, px) * 0.6;
    float edgeA = vAlpha * smoothstep(1.0, 0.9, r);
    if (uDay > 0.5) {
      // ink on paper: the symbol in iron-gall black, grammar in the branch's tint, a gilt ring for the chosen star
      vec3 inkC = vec3(0.10, 0.11, 0.15);
      vec3 tintC = pow(vColor, vec3(2.6)) * 0.72;
      vec3 outD = mix(vec3(1.0), inkC, clamp(ink + vFlare * exp(-r * 3.0) * 0.5, 0.0, 1.0));
      outD *= mix(vec3(1.0), tintC, clamp(tintA * 1.5 + glow * 0.6, 0.0, 1.0));
      if (vHi > 1.5) outD *= mix(vec3(1.0), vec3(0.55, 0.38, 0.1), lineAA(abs(r - 0.92), 0.022, px));
      gl_FragColor = vec4(mix(vec3(1.0), outD, edgeA), 1.0);
      return;
    }
    gl_FragColor = vec4(col * edgeA, 1.0);
  }
`;

export function Stars() {
  const hover = useStore((s) => s.hover);
  const select = useStore((s) => s.select);
  const selected = useStore((s) => s.selected);
  const hovered = useStore((s) => s.hovered);
  const word = useStore((s) => s.word);
  const invalidate = useThree((s) => s.invalidate);

  const geom = useMemo(() => {
    const N = starIds.length;
    const F = (n: number) => new Float32Array(N * n);
    const pos = F(3), pos2 = F(3), col = F(3), size = F(1), sig = F(4), sig2 = F(3), hi = F(1), ty = F(1), endY = F(1), carrier = F(1);
    starIds.forEach((id, i) => {
      const n = layout.nodes.get(id)!;
      const l = langById.get(id)!;
      pos.set(n.pos, i * 3);
      globePos(id).toArray(pos2, i * 3);
      branchTint(id).toArray(col, i * 3);
      const leaves = layout.index.leaves.get(id) ?? 1;
      size[i] =
        (l.status === 'proto' ? 2.2 : 1.5) +
        Math.log2(1 + leaves) * 0.32 +
        (l.speakers ? Math.log10(1 + l.speakers) * 0.11 : 0) +
        (l.branch === 'root' ? 2.2 : 0);
      const p = sigilParams(l);
      sig.set([p.rays, p.rings, p.orbits, p.asym], i * 4);
      sig2.set([p.morph, STATUS[l.status], p.dual], i * 3);
      ty[i] = n.pos[1];
      endY[i] = l.end === null ? 9999 : yearToY(l.end);
    });
    const g = new THREE.BufferGeometry();
    const set = (k: string, a: Float32Array, s: number) => g.setAttribute(k, new THREE.BufferAttribute(a, s));
    set('position', pos.slice(), 3); set('aPosT', pos, 3); set('aPos2', pos2, 3); set('aColor', col, 3); set('aSize', size, 1);
    set('aSig', sig, 4); set('aSig2', sig2, 3); set('aHi', hi, 1); set('aTreeY', ty, 1); set('aEndY', endY, 1);
    set('aCarrier', carrier, 1);
    g.computeBoundingSphere();
    g.boundingSphere!.radius += 40;
    return g;
  }, []);

  const mat = useMemo(
    () =>
      themedMaterial(new THREE.ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: U.uTime, uPR: U.uPR, uGrowY: U.uGrowY, uYearY: U.uYearY, uFocus: U.uFocus, uMorph: U.uMorph,
          uJourney: U.uJourney, uJourneyY: U.uJourneyY, uIvory: { value: new THREE.Color(INK.ivory) }, uDay: U.uDay,
        },
      })),
    [],
  );

  // highlight flags
  useMemo(() => {
    const attr = geom.getAttribute('aHi') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    arr.fill(0);
    const fs = focusSet(selected, word);
    if (fs) for (const id of fs) { const i = starIndex.get(id); if (i !== undefined) arr[i] = 1; }
    if (selected && starIndex.has(selected)) arr[starIndex.get(selected)!] = 2;
    if (hovered && starIndex.has(hovered)) arr[starIndex.get(hovered)!] = Math.max(arr[starIndex.get(hovered)!], 3);
    attr.needsUpdate = true;
    invalidate();
  }, [selected, hovered, word, geom, invalidate]);

  // carriers of the open word flare when its journey reaches them
  useMemo(() => {
    const attr = geom.getAttribute('aCarrier') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    arr.fill(0);
    if (word) for (const id of wordCarriers(word).carriers.keys()) { const i = starIndex.get(id); if (i !== undefined) arr[i] = 1; }
    attr.needsUpdate = true;
  }, [word, geom]);

  // keep the cpu-side positions (used for picking) in step with the tree/globe morph
  const last = { m: -1 };
  useFrame(() => {
    const m = U.uMorph.value;
    if (Math.abs(m - last.m) < 1e-4) return;
    last.m = m;
    const P = geom.getAttribute('position') as THREE.BufferAttribute;
    const T = (geom.getAttribute('aPosT') as THREE.BufferAttribute).array as Float32Array;
    const G = (geom.getAttribute('aPos2') as THREE.BufferAttribute).array as Float32Array;
    const out = P.array as Float32Array;
    for (let i = 0; i < out.length; i++) out[i] = T[i] + (G[i] - T[i]) * m;
    P.needsUpdate = true;
    geom.computeBoundingSphere();
  });

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const id = e.index !== undefined ? starIds[e.index] : null;
    if (id && id !== useStore.getState().hovered) hover(id);
    document.body.style.cursor = 'pointer';
  };
  const onOut = () => {
    hover(null);
    document.body.style.cursor = '';
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.index === undefined) return;
    const id = starIds[e.index];
    // touch: first tap previews, second opens
    const coarse = (e.nativeEvent as PointerEvent).pointerType === 'touch';
    if (coarse && useStore.getState().hovered !== id) {
      hover(id);
      return;
    }
    select(id);
  };

  return <points geometry={geom} material={mat} onPointerMove={onMove} onPointerOut={onOut} onClick={onClick} />;
}
