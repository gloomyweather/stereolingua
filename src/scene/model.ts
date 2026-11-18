import * as THREE from 'three';
import { languages, words } from '../data';
import { computeLayout } from '../lib/layout3d';
import { BRANCH_TINT, BRANCH_ABBR } from '../lib/palette';
import { yearToY, HEIGHT, YEAR_MAX } from '../lib/timeScale';
import type { Language, Branch } from '../data/types';

export const layout = computeLayout(languages);
export const langById = new Map<string, Language>(languages.map((l) => [l.id, l]));
export const starIds: string[] = [...layout.nodes.keys()];
export const starIndex = new Map(starIds.map((id, i) => [id, i]));

/* ------------------------------------------------------------------ tree space */

export function treePos(id: string): THREE.Vector3 {
  const n = layout.nodes.get(id);
  return n ? new THREE.Vector3(...n.pos) : new THREE.Vector3();
}
export function treeTop(id: string): THREE.Vector3 {
  const n = layout.nodes.get(id);
  return n ? new THREE.Vector3(...n.top) : new THREE.Vector3();
}

/* ----------------------------------------------------------------- globe space */

export const GLOBE_CENTER = new THREE.Vector3(0, 26, 0);
export const GLOBE_R = 15;
const ALT = 15; // altitude range: time above the surface

export function latLonDir(lat: number, lon: number): THREE.Vector3 {
  const la = THREE.MathUtils.degToRad(lat);
  const lo = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo));
}

/** altitude for a year: the past hugs the ground, the present floats highest */
export function globeRadius(year: number): number {
  return GLOBE_R + 0.6 + (yearToY(year) / HEIGHT) * ALT;
}

export function globePosAt(id: string, year: number): THREE.Vector3 {
  const l = langById.get(id);
  if (!l) return GLOBE_CENTER.clone();
  return latLonDir(l.region.lat, l.region.lon).multiplyScalar(globeRadius(year)).add(GLOBE_CENTER);
}
export const globePos = (id: string) => globePosAt(id, langById.get(id)?.start ?? 0);
export const globeTop = (id: string) => globePosAt(id, langById.get(id)?.end ?? YEAR_MAX);

/** mixed position for the current morph (0 tree … 1 globe) */
export function nodePos(id: string, morph = 0): THREE.Vector3 {
  if (morph <= 0) return treePos(id);
  if (morph >= 1) return globePos(id);
  return treePos(id).lerp(globePos(id), morph);
}

/* --------------------------------------------------------------------- curves */

export interface Bezier {
  p0: THREE.Vector3;
  c1: THREE.Vector3;
  c2: THREE.Vector3;
  p3: THREE.Vector3;
}

export interface Edge {
  id: string; // child id (or own id for lifelines)
  parent: string | null;
  kind: 0 | 1; // 0 branch parent→child, 1 lifeline
  branch: Branch;
  tree: Bezier;
  globe: Bezier;
  weight: number;
}

const UP = new THREE.Vector3(0, 1, 0);

function treeBranchCurve(p0: THREE.Vector3, p3: THREE.Vector3): Bezier {
  const dy = Math.max(p3.y - p0.y, 1.5);
  const horiz = p3.clone().sub(p0).setY(0);
  return {
    p0: p0.clone(),
    c1: p0.clone().addScaledVector(UP, dy * 0.6).addScaledVector(horiz, 0.15),
    c2: p3.clone().addScaledVector(UP, -dy * 0.3).addScaledVector(horiz, -0.1),
    p3: p3.clone(),
  };
}

function globeArc(p0: THREE.Vector3, p3: THREE.Vector3): Bezier {
  const a = p0.clone().sub(GLOBE_CENTER);
  const b = p3.clone().sub(GLOBE_CENTER);
  const span = p0.distanceTo(p3);
  const lift = Math.max(a.length(), b.length()) + span * 0.22;
  const c1 = a.clone().lerp(b, 0.33).setLength(lift).add(GLOBE_CENTER);
  const c2 = a.clone().lerp(b, 0.66).setLength(lift).add(GLOBE_CENTER);
  return { p0: p0.clone(), c1, c2, p3: p3.clone() };
}

function straight(p0: THREE.Vector3, p3: THREE.Vector3, wobble = 0): Bezier {
  const side = new THREE.Vector3(-p0.z, 0, p0.x).normalize().multiplyScalar(wobble);
  return {
    p0: p0.clone(),
    c1: p0.clone().lerp(p3, 0.33).add(side),
    c2: p0.clone().lerp(p3, 0.66).sub(side),
    p3: p3.clone(),
  };
}

export function bez(b: Bezier, t: number, out = new THREE.Vector3()): THREE.Vector3 {
  const it = 1 - t;
  return out
    .copy(b.p0)
    .multiplyScalar(it * it * it)
    .addScaledVector(b.c1, 3 * it * it * t)
    .addScaledVector(b.c2, 3 * it * t * t)
    .addScaledVector(b.p3, t * t * t);
}

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function buildEdges(): Edge[] {
  const out: Edge[] = [];
  for (const [id, n] of layout.nodes) {
    const l = langById.get(id)!;
    if (l.branch === 'contact') continue;
    const leaves = layout.index.leaves.get(id) ?? 1;
    const weight = 0.55 + Math.log2(1 + leaves) * 0.45;
    if (l.parent && layout.nodes.has(l.parent)) {
      out.push({
        id,
        parent: l.parent,
        kind: 0,
        branch: l.branch,
        tree: treeBranchCurve(treePos(l.parent), treePos(id)),
        globe: globeArc(globePos(l.parent), globePos(id)),
        weight,
      });
    }
    const top = new THREE.Vector3(...n.top);
    const pos = new THREE.Vector3(...n.pos);
    if (top.y - pos.y > 0.6) {
      out.push({
        id,
        parent: null,
        kind: 1,
        branch: l.branch,
        tree: straight(pos, top, (hash01(id) - 0.5) * 1.4),
        globe: straight(globePos(id), globeTop(id)),
        weight: Math.min(weight, 1.3) * 0.7,
      });
    }
  }
  return out;
}

export const edges = buildEdges();

/* ----------------------------------------------------------------- appearance */

export function branchTint(id: string): THREE.Color {
  const l = langById.get(id);
  return new THREE.Color(l ? BRANCH_TINT[l.branch] : '#ece3cc');
}

/** bayer-style designation inside each branch: α, β, γ … by prominence */
const GREEK = 'αβγδεζηθικλμνξοπρστυφχψω';
export const designation = new Map<string, string>();
{
  const byBranch = new Map<Branch, Language[]>();
  for (const l of languages) {
    if (l.branch === 'root') continue;
    const arr = byBranch.get(l.branch) ?? [];
    arr.push(l);
    byBranch.set(l.branch, arr);
  }
  const prominence = (l: Language) =>
    (l.speakers ? Math.log10(1 + l.speakers) * 2 : 0) + Math.log2(1 + (layout.index.leaves.get(l.id) ?? 1)) * 1.5 + (l.status === 'proto' ? 3 : 0);
  for (const [b, arr] of byBranch) {
    arr.sort((x, y) => prominence(y) - prominence(x) || x.start - y.start);
    arr.forEach((l, i) => {
      const letter = i < GREEK.length ? GREEK[i] : String(i - GREEK.length + 1);
      designation.set(l.id, `${letter} ${BRANCH_ABBR[b]}`);
    });
  }
  designation.set('pie', 'Radix');
}

/* ---------------------------------------------------------------- focus sets */

/** ids to highlight: lineage of the selected language, or all carriers of a word */
export function focusSet(selected: string | null, word: string | null): Set<string> | null {
  if (!selected && !word) return null;
  const out = new Set<string>();
  const addLine = (id: string) => {
    let cur: string | null = id;
    while (cur && !out.has(cur)) {
      out.add(cur);
      cur = langById.get(cur)?.parent ?? null;
    }
  };
  if (word) {
    const w = words.find((x) => x.id === word);
    if (w) {
      for (const id of wordCarriers(w.id).edgesTo) out.add(id);
      for (const f of w.forms) out.add(f.lang);
      for (const b of w.borrowings) {
        out.add(b.from);
        out.add(b.to);
      }
    }
  }
  if (selected) {
    addLine(selected);
    if (!word) for (const c of layout.index.children.get(selected) ?? []) out.add(c);
  }
  return out;
}

/* ------------------------------------------------------------- word journeys */

export interface Carrier {
  lang: string;
  year: number; // when the form appears in the journey
  via: 'root' | 'inherited' | 'borrowed' | 'unknown';
  from?: string; // previous carrier (ancestor with a form, or borrowing source)
}

export interface WordRoute {
  carriers: Map<string, Carrier>;
  edgesTo: Set<string>; // child ids of tree edges the word travels along
  startYear: number;
  endYear: number;
}

const routeCache = new Map<string, WordRoute>();

/**
 * how a word reaches each language that has a form:
 * - entries are the root language and every borrowing target
 * - a form is inherited when walking up the tree reaches an entry or a carrier
 * - otherwise its route is unknown; it appears when its language does (or after the first borrowing)
 */
export function wordCarriers(wordId: string): WordRoute {
  const hit = routeCache.get(wordId);
  if (hit) return hit;
  const w = words.find((x) => x.id === wordId)!;
  const carriers = new Map<string, Carrier>();
  const edgesTo = new Set<string>();
  const formLangs = new Set(w.forms.map((f) => f.lang));
  const entries = new Map<string, Carrier>();
  const root = langById.get(w.rootLang);
  const rootYear = root ? root.start : 0;
  entries.set(w.rootLang, { lang: w.rootLang, year: rootYear, via: 'root' });
  const sortedB = [...w.borrowings].sort((a, b) => a.year - b.year);
  for (const b of sortedB) {
    const t = langById.get(b.to);
    if (!t) continue;
    if (!entries.has(b.to)) entries.set(b.to, { lang: b.to, year: Math.max(b.year, t.start), via: 'borrowed', from: b.from });
  }
  for (const [k, v] of entries) carriers.set(k, v);
  const firstBorrow = sortedB.length ? sortedB[0].year : rootYear;
  for (const lang of formLangs) {
    if (carriers.has(lang)) continue;
    // walk up until an entry is met
    const chain: string[] = [];
    let cur: string | null = lang;
    let found: Carrier | null = null;
    while (cur) {
      const e = entries.get(cur);
      if (e && cur !== lang) {
        found = e;
        break;
      }
      chain.push(cur);
      cur = langById.get(cur)?.parent ?? null;
    }
    const l = langById.get(lang);
    if (!l) continue;
    if (found) {
      for (const c of chain) edgesTo.add(c);
      const parentWithForm = chain.slice(1).find((c) => formLangs.has(c));
      carriers.set(lang, {
        lang,
        year: Math.max(l.start, found.year),
        via: 'inherited',
        from: parentWithForm ?? found.lang,
      });
    } else {
      carriers.set(lang, { lang, year: Math.max(l.start, w.kind === 'wanderer' ? firstBorrow : l.start), via: 'unknown' });
    }
  }
  // keep borrowing targets in the edge set when they carry descendants
  const years = [...carriers.values()].map((c) => c.year);
  const route: WordRoute = {
    carriers,
    edgesTo,
    startYear: Math.min(rootYear, ...years),
    endYear: Math.min(YEAR_MAX, Math.max(...years) + 80),
  };
  routeCache.set(wordId, route);
  return route;
}

export function primaryForm(wordId: string, lang: string) {
  const w = words.find((x) => x.id === wordId);
  if (!w) return undefined;
  const all = w.forms.filter((f) => f.lang === lang);
  return all.find((f) => !/digit|archaic|poetic/i.test(f.note ?? '')) ?? all[0];
}
