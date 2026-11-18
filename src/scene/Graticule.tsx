import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { layout, langById, GLOBE_CENTER, GLOBE_R, latLonDir, nodePos } from './model';
import { U, themedMaterial } from './uniforms';
import { yearToY, HEIGHT, formatYear } from '../lib/timeScale';
import { useStore } from '../store';
import { BRANCH_LABEL, BRANCH_TINT } from '../lib/palette';
import landDots from '../data/landDots.json';
import type { Branch } from '../data/types';

const RING_YEARS = [-4000, -3000, -2000, -1000, 0, 500, 1000, 1500, 2026];

/** ring radius envelope: each ring encloses the crown that exists by its year */
function ringRadii(): number[] {
  const radial = [...layout.nodes.values()]
    .filter((n) => langById.get(n.id)?.branch !== 'contact')
    .map((n) => ({ y: n.pos[1], r: Math.hypot(n.pos[0], n.pos[2]) }));
  let prev = 6;
  return RING_YEARS.map((yr) => {
    const y = yearToY(yr);
    let rmax = 0;
    for (const n of radial) if (n.y <= y + 1.5) rmax = Math.max(rmax, n.r);
    prev = Math.max(prev, rmax + 3.5);
    return prev;
  });
}

const lineMat = (opacity: number, dashed: boolean, fadeWithMorph: 1 | -1) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uMorph: U.uMorph, uGrowY: U.uGrowY, uDay: U.uDay, uOpacity: { value: opacity }, uColor: { value: new THREE.Color('#ece3cc') } },
    vertexShader: /* glsl */ `
      attribute float aDash; attribute float aY;
      varying float vDash; varying float vY; varying float vNear;
      void main() {
        vDash = aDash; vY = aY;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNear = smoothstep(6.0, 34.0, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uMorph; uniform float uGrowY; uniform float uOpacity; uniform vec3 uColor; uniform float uDay;
      varying float vDash; varying float vY; varying float vNear;
      void main() {
        ${dashed ? 'if (fract(vDash) > 0.55) discard;' : ''}
        float m = ${fadeWithMorph === 1 ? '1.0 - uMorph' : 'uMorph'};
        float grow = ${fadeWithMorph === 1 ? 'smoothstep(uGrowY + 1.0, uGrowY - 1.0, vY)' : '1.0'};
        float cov = uOpacity * m * grow * vNear;
        gl_FragColor = uDay > 0.5 ? vec4(mix(vec3(1.0), vec3(0.10, 0.22, 0.42), clamp(cov * 2.6, 0.0, 1.0)), 1.0) : vec4(uColor * cov, 1.0);
      }`,
  });

/** time rings around the axis, a polar axis with ticks, and (in globe view) meridians, parallels and land */
export function Graticule() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const radii = useMemo(ringRadii, []);

  const rings = useMemo(() => {
    const pos: number[] = [], dash: number[] = [], ys: number[] = [];
    RING_YEARS.forEach((yr, i) => {
      const y = yearToY(yr);
      const r = radii[i];
      const n = 160;
      for (let k = 0; k < n; k++) {
        const a0 = (k / n) * Math.PI * 2, a1 = ((k + 1) / n) * Math.PI * 2;
        pos.push(Math.cos(a0) * r, y, Math.sin(a0) * r, Math.cos(a1) * r, y, Math.sin(a1) * r);
        const circ = 2 * Math.PI * r;
        dash.push((k / n) * circ * 0.7, ((k + 1) / n) * circ * 0.7);
        ys.push(y, y);
      }
    });
    // polar axis with tick marks at every ring
    pos.push(0, -1.5, 0, 0, HEIGHT + 3, 0);
    dash.push(0, 0);
    ys.push(-1.5, HEIGHT + 3);
    RING_YEARS.forEach((yr) => {
      const y = yearToY(yr);
      pos.push(-0.6, y, 0, 0.6, y, 0, 0, y, -0.6, 0, y, 0.6);
      dash.push(0, 0, 0, 0);
      ys.push(y, y, y, y);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aDash', new THREE.Float32BufferAttribute(dash, 1));
    g.setAttribute('aY', new THREE.Float32BufferAttribute(ys, 1));
    return g;
  }, [radii]);

  const globeLines = useMemo(() => {
    const pos: number[] = [], dash: number[] = [], ys: number[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3, d0: number, d1: number) => {
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      dash.push(d0, d1);
      ys.push(0, 0);
    };
    const R = GLOBE_R;
    for (let lat = -60; lat <= 75; lat += 15) {
      for (let k = 0; k < 120; k++) {
        const a = latLonDir(lat, (k / 120) * 360 - 180).multiplyScalar(R).add(GLOBE_CENTER);
        const b = latLonDir(lat, ((k + 1) / 120) * 360 - 180).multiplyScalar(R).add(GLOBE_CENTER);
        push(a, b, k * 0.9, (k + 1) * 0.9);
      }
    }
    for (let lon = -180; lon < 180; lon += 15) {
      for (let k = 0; k < 60; k++) {
        const la0 = -80 + (k / 60) * 160, la1 = -80 + ((k + 1) / 60) * 160;
        push(latLonDir(la0, lon).multiplyScalar(R).add(GLOBE_CENTER), latLonDir(la1, lon).multiplyScalar(R).add(GLOBE_CENTER), k * 0.9, (k + 1) * 0.9);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aDash', new THREE.Float32BufferAttribute(dash, 1));
    g.setAttribute('aY', new THREE.Float32BufferAttribute(ys, 1));
    return g;
  }, []);

  const land = useMemo(() => {
    const arr = landDots as number[];
    const n = arr.length / 2;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) latLonDir(arr[i * 2] / 10, arr[i * 2 + 1] / 10).multiplyScalar(GLOBE_R).add(GLOBE_CENTER).toArray(pos, i * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uMorph: U.uMorph, uPR: U.uPR, uDay: U.uDay, uCenter: { value: GLOBE_CENTER } },
      vertexShader: /* glsl */ `
        uniform float uPR; uniform vec3 uCenter; varying float vFace;
        void main() {
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_Position = projectionMatrix * mv;
          // dots on the far hemisphere fade, so the globe reads as solid
          vec3 n = normalize(position - uCenter);
          vec3 toCam = normalize(cameraPosition - position);
          vFace = smoothstep(-0.2, 0.35, dot(n, toCam));
          gl_PointSize = 2.2 * uPR * (60.0 / -mv.z);
        }`,
      fragmentShader: /* glsl */ `
        uniform float uMorph; uniform float uDay; varying float vFace;
        void main() {
          float d = length(gl_PointCoord - 0.5) * 2.0;
          float a = smoothstep(1.0, 0.4, d) * uMorph * mix(0.08, 0.55, vFace);
          if (a < 0.004) discard;
          gl_FragColor = uDay > 0.5 ? vec4(mix(vec3(1.0), vec3(0.12, 0.25, 0.45), clamp(a * 1.6, 0.0, 1.0)), 1.0) : vec4(vec3(0.93, 0.89, 0.8) * a, 1.0);
        }`,
    });
    return { g, m: themedMaterial(m) };
  }, []);

  const ringMat = useMemo(() => themedMaterial(lineMat(0.16, true, 1)), []);
  const globeMat = useMemo(() => themedMaterial(lineMat(0.07, true, -1)), []);

  // ring labels: years on the left edge of each ring, branch names over their constellations
  const ringEls = useRef<HTMLDivElement[]>([]);
  const branchEls = useRef<Map<string, HTMLDivElement>>(new Map());
  const branches = useMemo(() => {
    const acc = new Map<Branch, { ids: string[] }>();
    for (const [id] of layout.nodes) {
      const l = langById.get(id)!;
      if (l.branch === 'root' || l.branch === 'contact') continue;
      if ((layout.index.children.get(id) ?? []).length) continue; // leaves only: the crown
      const a = acc.get(l.branch) ?? { ids: [] };
      a.ids.push(id);
      acc.set(l.branch, a);
    }
    return [...acc.entries()]
      .map(([b, v]) => ({ branch: b, ids: v.ids }))
      .sort((x, y) => y.ids.length - x.ids.length);
  }, []);

  useEffect(() => {
    const root = document.getElementById('labels');
    if (!root) return;
    ringEls.current = RING_YEARS.map((yr) => {
      const d = document.createElement('div');
      d.className = 'ring-label' + (yr === 2026 ? ' is-now' : '');
      d.textContent = yr === 2026 ? 'today' : formatYear(yr);
      d.style.opacity = '0';
      root.appendChild(d);
      return d;
    });
    for (const b of branches) {
      const d = document.createElement('div');
      d.className = 'branch-name';
      d.style.setProperty('--tint', BRANCH_TINT[b.branch]);
      d.textContent = BRANCH_LABEL[b.branch];
      d.style.opacity = '0';
      root.appendChild(d);
      branchEls.current.set(b.branch, d);
    }
    return () => {
      ringEls.current.forEach((d) => d.remove());
      for (const d of branchEls.current.values()) d.remove();
      branchEls.current.clear();
    };
  }, [branches]);

  const v = new THREE.Vector3();
  const c = new THREE.Vector3();
  useFrame(() => {
    const s = useStore.getState();
    const morph = U.uMorph.value;
    const W = size.width, H = size.height;
    const explore = s.phase === 'explore';
    // years
    RING_YEARS.forEach((yr, i) => {
      const el = ringEls.current[i];
      if (!el) return;
      const y = yearToY(yr);
      const r = radii[i];
      let best = { x: Infinity, y: 0, z: 1 };
      for (let k = 0; k < 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        v.set(Math.cos(a) * r, y, Math.sin(a) * r).project(camera);
        if (v.z < 1 && v.x < best.x) best = { x: v.x, y: v.y, z: v.z };
      }
      const vis = explore && best.x !== Infinity && morph < 0.5;
      el.style.opacity = vis ? String(0.9 * (1 - morph * 2)) : '0';
      if (vis) el.style.transform = `translate3d(${((best.x * 0.5 + 0.5) * W - 10).toFixed(1)}px, ${((-best.y * 0.5 + 0.5) * H - 8).toFixed(1)}px, 0) translateX(-100%)`;
    });
    // constellation names: centroid of each branch, readable from afar
    const camDist = camera.position.distanceTo(new THREE.Vector3(0, 30, 0));
    const far = THREE.MathUtils.smoothstep(camDist, 45, 85);
    const taken: { x: number; y: number; w: number }[] = [];
    for (const b of branches) {
      const el = branchEls.current.get(b.branch);
      if (!el) continue;
      c.set(0, 0, 0);
      for (const id of b.ids) c.add(nodePos(id, morph));
      c.divideScalar(b.ids.length);
      v.copy(c).project(camera);
      const sx = (v.x * 0.5 + 0.5) * W;
      const sy = (-v.y * 0.5 + 0.5) * H - 26;
      const w = el.textContent!.length * 13;
      const clash = taken.some((t) => Math.abs(t.x - sx) < (t.w + w) / 2 && Math.abs(t.y - sy) < 26);
      const vis = explore && v.z < 1 && !s.selected && !s.word && !clash;
      const o = vis ? far * 0.42 : 0;
      if (vis) taken.push({ x: sx, y: sy, w });
      el.style.opacity = o.toFixed(3);
      if (o > 0) el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -50%)`;
    }
  });

  return (
    <group>
      <lineSegments geometry={rings} material={ringMat} frustumCulled={false} raycast={() => null} />
      <lineSegments geometry={globeLines} material={globeMat} frustumCulled={false} raycast={() => null} />
      <points geometry={land.g} material={land.m} frustumCulled={false} raycast={() => null} />
    </group>
  );
}
