import type { Language } from '../data/types';
import { buildIndex, type TreeIndex } from './tree';
import { yearToY, YEAR_MAX } from './timeScale';
import { rand01 } from './hash';

export interface NodeLayout {
  id: string;
  pos: [number, number, number]; // star position (at start year)
  top: [number, number, number]; // end of lifeline (end year or present)
  azimuth: number;
  radius: number;
}

export interface Layout {
  index: TreeIndex;
  nodes: Map<string, NodeLayout>;
  /** ring for contact (non-ie) languages */
  contactIds: string[];
}

const BASE_STEP = 5.2; // radial growth for a real split
const CHAIN_STEP = 1.1; // radial growth along single-child stage chains
const CONTACT_RADIUS = 46;

/**
 * radial-sector layout around the vertical (time) axis.
 * - each subtree owns an azimuth sector proportional to sqrt(leaves)
 * - radius grows with topological depth (less for stage chains), so siblings
 *   of different ages sit at the same radius but different heights -> volume
 * - deterministic per-id jitter, then a light repulsion pass in time bands
 */
export function computeLayout(langs: Language[]): Layout {
  const ieLangs = langs.filter((l) => l.branch !== 'contact');
  const contacts = langs.filter((l) => l.branch === 'contact');
  const index = buildIndex(ieLangs);
  const nodes = new Map<string, NodeLayout>();

  const place = (id: string, a0: number, a1: number, radius: number) => {
    const l = index.byId.get(id)!;
    const ch = index.children.get(id) ?? [];
    const jitterA = (rand01(id, 'a') - 0.5) * (a1 - a0) * 0.35;
    const az = (a0 + a1) / 2 + (ch.length === 0 ? jitterA : jitterA * 0.3);
    const r = radius + (rand01(id, 'r') - 0.5) * 1.6;
    const y = yearToY(l.start);
    nodes.set(id, {
      id,
      pos: [Math.cos(az) * r, y, Math.sin(az) * r],
      top: [0, 0, 0],
      azimuth: az,
      radius: r,
    });
    if (!ch.length) return;
    const weights = ch.map((c) => Math.sqrt(index.leaves.get(c)!));
    const total = weights.reduce((s, w) => s + w, 0);
    // a single child inherits the whole sector (stage chain)
    const step = ch.length === 1 ? CHAIN_STEP : BASE_STEP * (radius === 0 ? 1.25 : 1);
    let acc = a0;
    ch.forEach((c, i) => {
      const span = ((a1 - a0) * weights[i]) / total;
      place(c, acc, acc + span, r + step);
      acc += span;
    });
  };

  for (const root of index.roots) {
    if (index.roots.length === 1) place(root, 0, Math.PI * 2, 0);
    else {
      const i = index.roots.indexOf(root);
      const span = (Math.PI * 2) / index.roots.length;
      place(root, i * span, (i + 1) * span, 4);
    }
  }
  // root sits exactly on axis
  for (const r of index.roots) {
    const n = nodes.get(r)!;
    if (index.roots.length === 1) n.pos = [0, n.pos[1], 0];
  }

  relax(nodes, 3, new Set(index.roots));

  // lifelines: drift slightly outward as they rise
  for (const n of nodes.values()) {
    const l = index.byId.get(n.id)!;
    const endYear = l.end ?? YEAR_MAX;
    const yTop = Math.max(n.pos[1] + 0.4, yearToY(endYear));
    const drift = 1 + 0.06 * (yTop - n.pos[1]) / 10;
    n.top = [n.pos[0] * drift, yTop, n.pos[2] * drift];
  }

  // contact languages: outer ring at their own start height (clamped)
  const contactIds: string[] = [];
  contacts.forEach((l, i) => {
    const az = (i / Math.max(1, contacts.length)) * Math.PI * 2 + 0.3;
    const y = Math.max(yearToY(l.start), yearToY(-1500));
    nodes.set(l.id, {
      id: l.id,
      pos: [Math.cos(az) * CONTACT_RADIUS, y, Math.sin(az) * CONTACT_RADIUS],
      top: [Math.cos(az) * CONTACT_RADIUS, yearToY(l.end ?? YEAR_MAX), Math.sin(az) * CONTACT_RADIUS],
      azimuth: az,
      radius: CONTACT_RADIUS,
    });
    contactIds.push(l.id);
  });

  return { index, nodes, contactIds };
}

/** push apart stars that are too close in 3d (mostly same time band). */
function relax(nodes: Map<string, NodeLayout>, iterations: number, fixed: Set<string>) {
  const arr = [...nodes.values()];
  const minDist = 2.4;
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i].pos;
        const b = arr[j].pos;
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const dz = b[2] - a[2];
        const d = Math.hypot(dx, dy, dz);
        if (d > 0 && d < minDist) {
          // only push horizontally; height encodes time and must stay exact
          const h = Math.hypot(dx, dz) || 1e-3;
          const push = (minDist - d) * 0.5;
          const ux = dx / h;
          const uz = dz / h;
          const fa = fixed.has(arr[i].id);
          const fb = fixed.has(arr[j].id);
          const k = fa || fb ? 2 : 1;
          if (!fa) {
            a[0] -= ux * push * k;
            a[2] -= uz * push * k;
          }
          if (!fb) {
            b[0] += ux * push * k;
            b[2] += uz * push * k;
          }
        }
      }
    }
  }
}
