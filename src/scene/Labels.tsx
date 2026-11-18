import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { layout, langById, starIds, nodePos, wordCarriers } from './model';
import { U } from './uniforms';
import { useStore } from '../store';
import { yearToY } from '../lib/timeScale';

export interface Rect { x: number; y: number; w: number; h: number }
export function overlaps(placed: Rect[], r: Rect): boolean {
  for (const p of placed) if (Math.abs(p.x - r.x) < (p.w + r.w) / 2 && Math.abs(p.y - r.y) < (p.h + r.h) / 2) return true;
  return false;
}

/** philological label: † for extinct, * for reconstructed (as in any etymological dictionary) */
export function labelText(id: string): string {
  const l = langById.get(id);
  if (!l) return id;
  if (l.status === 'proto') return l.name;
  if (l.end !== null && (l.status === 'extinct' || l.status === 'ancient')) return `†${l.name}`;
  return l.name;
}

/**
 * dom labels projected from 3d each frame, with priority-based collision culling.
 * placed rectangles are shared with other label layers through `sharedPlaced`.
 */
export const sharedPlaced: Rect[] = [];

export function Labels() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const els = useRef<Map<string, HTMLDivElement>>(new Map());

  const base = useMemo(
    () =>
      starIds.map((id) => {
        const l = langById.get(id)!;
        const depth = layout.index.depth.get(id) ?? 5;
        const leaves = layout.index.leaves.get(id) ?? 1;
        let prio = 0;
        if (l.branch === 'root') prio = 100;
        else if (depth === 1) prio = 55;
        else if (l.status === 'proto') prio = 38;
        prio += Math.log2(1 + leaves) * 3 + Math.log10(1 + (l.speakers ?? 0)) * 1.4;
        const text = labelText(id);
        return { id, prio, text, kind: l.status, contact: l.branch === 'contact', w: text.length * 6.6 + 8 };
      }),
    [],
  );

  useEffect(() => {
    const root = document.getElementById('labels');
    if (!root) return;
    for (const b of base) {
      const d = document.createElement('div');
      d.className = `label label-${b.kind}${b.contact ? ' label-contact' : ''}`;
      d.textContent = b.text;
      d.style.opacity = '0';
      root.appendChild(d);
      els.current.set(b.id, d);
    }
    return () => {
      for (const d of els.current.values()) d.remove();
      els.current.clear();
    };
  }, [base]);

  const v = new THREE.Vector3();
  // interface furniture the sky labels must keep clear of (re-measured a few times a second)
  const obstacles = useRef<{ t: number; rects: Rect[] }>({ t: 0, rects: [] });
  const measure = () => {
    const now = performance.now();
    if (now - obstacles.current.t < 400) return obstacles.current.rects;
    const rects: Rect[] = [];
    for (const sel of ['.cartouche', '.instruments', '.card', '.scale', '.lineage', '.signs', '.hovercard', '.hint']) {
      document.querySelectorAll(sel).forEach((el) => {
        const r = (el as HTMLElement).getBoundingClientRect();
        if (r.width && r.height) rects.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width + 12, h: r.height + 8 });
      });
    }
    obstacles.current = { t: now, rects };
    return rects;
  };

  useFrame(() => {
    const s = useStore.getState();
    const growY = yearToY(s.growYear);
    const morph = U.uMorph.value;
    const path = new Set<string>();
    if (s.selected) {
      let cur: string | null = s.selected;
      while (cur) {
        path.add(cur);
        cur = langById.get(cur)?.parent ?? null;
      }
      for (const c of layout.index.children.get(s.selected) ?? []) path.add(c);
    }
    // while a word travels, its carriers are labelled by the journey layer instead
    const carriers = s.word ? wordCarriers(s.word).carriers : null;
    const cand = base
      .map((b) => {
        const p = nodePos(b.id, morph);
        const dist = camera.position.distanceTo(p);
        let score = b.prio - dist * 0.85;
        if (path.has(b.id)) score += 200;
        if (b.id === s.selected || b.id === s.hovered) score += 1000;
        return { b, p, dist, score };
      })
      .sort((a, b) => b.score - a.score);
    sharedPlaced.length = 0;
    for (const r of measure()) sharedPlaced.push(r);
    const W = size.width, H = size.height;
    let shown = 0;
    const maxShown = W < 640 ? 12 : 30;
    const yearY = s.year >= 2029 ? 1e9 : yearToY(s.year);
    for (const { b, p, dist, score } of cand) {
      const el = els.current.get(b.id);
      if (!el) continue;
      const ty = layout.nodes.get(b.id)!.pos[1];
      if (carriers?.has(b.id) && b.id !== s.selected && b.id !== s.hovered) {
        if (el.style.opacity !== '0') el.style.opacity = '0';
        continue;
      }
      v.copy(p).project(camera);
      const visible = v.z < 1 && ty <= growY + 0.5 && s.phase === 'explore';
      const x = (v.x * 0.5 + 0.5) * W;
      const y = (-v.y * 0.5 + 0.5) * H;
      const r: Rect = { x, y: y + 14, w: b.w, h: 15 };
      let ok = visible && x > -40 && x < W + 40 && y > -20 && y < H + 20 && (shown < maxShown || score > 500);
      if (ok && overlaps(sharedPlaced, r)) ok = score > 500 ? !obstacles.current.rects.some((o) => overlaps([o], r)) : false;
      if (ok) {
        sharedPlaced.push(r);
        shown++;
        el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y + 9).toFixed(1)}px, 0) translateX(-50%)`;
        const near = Math.max(0.4, Math.min(1, 70 / dist));
        const future = ty > yearY + 0.3 ? 0.25 : 1;
        el.style.opacity = String((score > 500 ? 1 : near) * future);
        el.classList.toggle('is-active', b.id === s.selected);
        el.classList.toggle('is-hover', b.id === s.hovered);
        el.classList.toggle('is-path', path.has(b.id) && b.id !== s.selected);
      } else if (el.style.opacity !== '0') {
        el.style.opacity = '0';
      }
    }
  });

  return null;
}
