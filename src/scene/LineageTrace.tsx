import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { Line2, LineGeometry, LineMaterial } from 'three-stdlib';
import { edges, langById, bez, type Edge } from './model';
import { U } from './uniforms';
import { useStore, prefersReducedMotion } from '../store';
import { INK } from '../lib/palette';

const SAMPLES = 22;

/** the selected language's ancestry, traced in gilt from the root outward, like an engraver's burin */
export function LineageTrace() {
  const selected = useStore((s) => s.selected);
  const size = useThree((s) => s.size);
  const t0 = useRef(0);
  const lastMorph = useRef(-1);

  const chain = useMemo<Edge[]>(() => {
    if (!selected) return [];
    const ids: string[] = [];
    let cur: string | null = selected;
    while (cur) {
      ids.unshift(cur);
      cur = langById.get(cur)?.parent ?? null;
    }
    const out: Edge[] = [];
    for (const id of ids.slice(1)) {
      const e = edges.find((x) => x.kind === 0 && x.id === id);
      if (e) out.push(e);
    }
    return out;
  }, [selected]);

  const line = useMemo(() => {
    const geom = new LineGeometry();
    const mat = new LineMaterial({
      color: new THREE.Color(INK.gilt).getHex(),
      linewidth: 1.8,
      transparent: true,
      opacity: 0.95,
      dashed: true,
      dashSize: 1,
      gapSize: 1,
      depthWrite: false,
    });
    mat.blending = THREE.AdditiveBlending;
    const l = new Line2(geom, mat);
    l.frustumCulled = false;
    l.raycast = () => null;
    return l;
  }, []);

  const total = useRef(1);

  const rebuild = (m: number) => {
    const pts: number[] = [];
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    for (const e of chain) {
      for (let i = 0; i <= SAMPLES; i++) {
        if (pts.length && i === 0) continue;
        bez(e.tree, i / SAMPLES, a);
        bez(e.globe, i / SAMPLES, b);
        a.lerp(b, m);
        pts.push(a.x, a.y, a.z);
      }
    }
    if (pts.length < 6) {
      line.visible = false;
      return;
    }
    line.visible = true;
    line.geometry.dispose();
    const g = new LineGeometry();
    g.setPositions(pts);
    line.geometry = g;
    line.computeLineDistances();
    let len = 0;
    for (let i = 3; i < pts.length; i += 3) len += Math.hypot(pts[i] - pts[i - 3], pts[i + 1] - pts[i - 2], pts[i + 2] - pts[i - 1]);
    total.current = len || 1;
    line.material.dashSize = total.current;
    line.material.gapSize = total.current;
  };

  useEffect(() => {
    t0.current = performance.now();
    lastMorph.current = -1;
  }, [chain]);

  useFrame(() => {
    line.material.resolution.set(size.width, size.height);
    const day = U.uDay.value > 0.5;
    const wantBlend = day ? THREE.NormalBlending : THREE.AdditiveBlending;
    if (line.material.blending !== wantBlend) {
      line.material.blending = wantBlend;
      line.material.color.set(day ? '#8a5a14' : INK.gilt);
      line.material.needsUpdate = true;
    }
    const m = U.uMorph.value;
    if (Math.abs(m - lastMorph.current) > 1e-3) {
      lastMorph.current = m;
      rebuild(m);
    }
    if (!chain.length) {
      line.visible = false;
      return;
    }
    const dur = prefersReducedMotion ? 1 : Math.min(2200, 500 + chain.length * 260);
    const p = Math.min(1, (performance.now() - t0.current) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    line.material.dashOffset = total.current * (1 - e);
    line.material.opacity = 0.55 + 0.4 * U.uFocus.value;
  });

  return <primitive object={line} />;
}
