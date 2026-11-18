import { useMemo } from 'react';
import * as THREE from 'three';
import { edges, bez, focusSet, langById } from './model';
import { U, BRANCH_INDEX, themedMaterial } from './uniforms';
import { useStore } from '../store';
import { BRANCH_TINT, INK } from '../lib/palette';

const SEG = 30; // samples per curve
const GAP = 0.62; // lines stop short of the stars, as on an engraved chart

/**
 * engraved linework: parent→child curves (solid hairlines) and lifelines (dotted).
 * one LineSegments draw call; tree and globe positions are both stored and mixed in the shader.
 */
export function Constellation() {
  const selected = useStore((s) => s.selected);
  const word = useStore((s) => s.word);

  const { geom, owner } = useMemo(() => {
    const pos: number[] = [];
    const pos2: number[] = [];
    const ty: number[] = [];
    const dist: number[] = [];
    const kind: number[] = [];
    const br: number[] = [];
    const col: number[] = [];
    const owner: string[] = []; // per vertex: edge id
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const ga = new THREE.Vector3();
    const gb = new THREE.Vector3();
    const ivory = new THREE.Color(INK.ivory);
    for (const e of edges) {
      // arc length samples in tree space, to trim ends and to drive dashes
      const pts: THREE.Vector3[] = [];
      const gpts: THREE.Vector3[] = [];
      for (let i = 0; i <= SEG; i++) {
        pts.push(bez(e.tree, i / SEG));
        gpts.push(bez(e.globe, i / SEG));
      }
      const cum = [0];
      for (let i = 1; i <= SEG; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
      const total = cum[SEG];
      const gapStart = e.kind === 0 ? GAP : GAP * 0.8;
      const gapEnd = e.kind === 0 ? GAP : 0.05;
      if (total < gapStart + gapEnd + 0.2) continue;
      const tint = new THREE.Color(BRANCH_TINT[e.branch]).lerp(ivory, e.kind === 0 ? 0.55 : 0.7);
      for (let i = 0; i < SEG; i++) {
        if (cum[i] < gapStart || cum[i + 1] > total - gapEnd) continue;
        a.copy(pts[i]);
        b.copy(pts[i + 1]);
        ga.copy(gpts[i]);
        gb.copy(gpts[i + 1]);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        pos2.push(ga.x, ga.y, ga.z, gb.x, gb.y, gb.z);
        ty.push(a.y, b.y);
        dist.push(cum[i], cum[i + 1]);
        kind.push(e.kind, e.kind);
        const bi = BRANCH_INDEX[e.branch] ?? 0;
        br.push(bi, bi);
        col.push(tint.r, tint.g, tint.b, tint.r, tint.g, tint.b);
        owner.push(e.id, e.id);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aPos2', new THREE.Float32BufferAttribute(pos2, 3));
    g.setAttribute('aTreeY', new THREE.Float32BufferAttribute(ty, 1));
    g.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
    g.setAttribute('aBranch', new THREE.Float32BufferAttribute(br, 1));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    g.setAttribute('aFocus', new THREE.Float32BufferAttribute(new Float32Array(pos.length / 3), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 140);
    return { geom: g, owner };
  }, []);

  const mat = useMemo(
    () =>
      themedMaterial(new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uDay: U.uDay,
          uTime: U.uTime,
          uGrowY: U.uGrowY,
          uYearY: U.uYearY,
          uMorph: U.uMorph,
          uFocus: U.uFocus,
          uHiBranch: U.uHiBranch,
          uJourney: U.uJourney,
          uJourneyY: U.uJourneyY,
        },
        vertexShader: /* glsl */ `
          uniform float uMorph;
          attribute vec3 aPos2; attribute float aTreeY; attribute float aDist; attribute float aKind;
          attribute float aBranch; attribute vec3 aColor; attribute float aFocus;
          varying float vTreeY; varying float vDist; varying float vKind; varying float vBranch;
          varying vec3 vColor; varying float vFocus;
          void main() {
            vec3 p = mix(position, aPos2, uMorph);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
            vTreeY = aTreeY; vDist = aDist; vKind = aKind; vBranch = aBranch; vColor = aColor; vFocus = aFocus;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uGrowY; uniform float uYearY; uniform float uFocus; uniform float uHiBranch;
          uniform float uJourney; uniform float uJourneyY; uniform float uDay;
          varying float vTreeY; varying float vDist; varying float vKind; varying float vBranch;
          varying vec3 vColor; varying float vFocus;
          void main() {
            // lifelines are dotted, like the course of a comet on an old chart
            if (vKind > 0.5 && fract(vDist * 1.6) > 0.3) discard;
            float a = vKind > 0.5 ? 0.13 : 0.30;
            a *= smoothstep(uGrowY + 0.3, uGrowY - 0.3, vTreeY);
            a *= mix(0.12, 1.0, smoothstep(uYearY + 0.3, uYearY - 0.3, vTreeY));
            float hi = abs(vBranch - uHiBranch) < 0.5 ? 1.9 : 1.0;
            a *= hi;
            a *= mix(1.0, vFocus > 0.5 ? 2.4 : 0.32, uFocus);
            // the journey front: what the word has reached glows, what it has not stays faint
            float reached = smoothstep(uJourneyY + 0.2, uJourneyY - 0.2, vTreeY);
            a *= mix(1.0, vFocus > 0.5 ? mix(0.35, 1.25, reached) : 1.0, uJourney);
            gl_FragColor = uDay > 0.5 ? vec4(mix(vec3(1.0), vColor * 0.3, clamp(a * 1.7, 0.0, 1.0)), 1.0) : vec4(vColor * a, 1.0);
          }`,
      })),
    [],
  );

  // focus flags per vertex
  useMemo(() => {
    const attr = geom.getAttribute('aFocus') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const fs = focusSet(selected, word);
    for (let i = 0; i < arr.length; i++) arr[i] = fs && fs.has(owner[i]) ? 1 : 0;
    attr.needsUpdate = true;
  }, [selected, word, geom, owner]);

  return <lineSegments geometry={geom} material={mat} frustumCulled={false} raycast={() => null} />;
}

/** index of the branch for hover highlighting */
export function branchIndexOf(id: string | null): number {
  if (!id) return -1;
  const l = langById.get(id);
  return l ? BRANCH_INDEX[l.branch] ?? -1 : -1;
}
