import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { words } from '../data';
import { edges, langById, nodePos, bez, wordCarriers, primaryForm, GLOBE_CENTER, layout, type Edge, type Carrier } from './model';
import { U } from './uniforms';
import { Sparks, arcBetween, MORPHABLE } from './sparks';
import { useStore, prefersReducedMotion } from '../store';
import { yearToY } from '../lib/timeScale';
import { INK } from '../lib/palette';
import { sharedPlaced, overlaps, type Rect } from './Labels';

/** find t on a tree-space curve whose height equals y (curves rise monotonically) */
function tAtY(e: Edge, y: number): number {
  let lo = 0, hi = 1;
  const v = new THREE.Vector3();
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    bez(e.tree, mid, v);
    if (v.y < y) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

interface ArcState {
  from: string;
  to: string;
  year: number;
  form: string;
  fired: number; // wall clock when the arc started, 0 = not yet
}

interface LabelState {
  carrier: Carrier;
  el: HTMLDivElement;
  formEl: HTMLSpanElement;
  text: string;
  shownAt: number; // wall clock, 0 = hidden
  fromText: string;
  morphable: boolean;
  prio: number;
}

/**
 * a word's journey: a wavefront of light climbs its lineages through time (tree-space height is time),
 * comets ride the front along every branch it travels, loans leap between branches as dotted arcs,
 * and each language's form appears next to its star, morphing out of the form it came from.
 */
export function Journey() {
  const word = useStore((s) => s.word);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const sparks = useMemo(() => new Sparks(4200), []);
  const arcs = useRef<ArcState[]>([]);
  const labels = useRef<LabelState[]>([]);
  const lastJourneyY = useRef(-100);

  const route = useMemo(() => (word ? wordCarriers(word) : null), [word]);
  const w = useMemo(() => (word ? words.find((x) => x.id === word) ?? null : null), [word]);
  const travelled = useMemo(() => (route ? edges.filter((e) => e.kind === 0 && route.edgesTo.has(e.id)) : []), [route]);

  // build arcs and labels for the open word
  useEffect(() => {
    arcs.current = [];
    labels.current.forEach((l) => l.el.remove());
    labels.current = [];
    if (!w || !route) return;
    arcs.current = [...w.borrowings]
      .filter((b) => langById.has(b.from) && langById.has(b.to))
      .sort((a, b) => a.year - b.year)
      .map((b) => ({ from: b.from, to: b.to, year: b.year, form: b.form, fired: 0 }));
    const root = document.getElementById('labels');
    const sel = useStore.getState().selected;
    const lineage = new Set<string>();
    let cur: string | null = sel;
    while (cur) {
      lineage.add(cur);
      cur = langById.get(cur)?.parent ?? null;
    }
    for (const c of route.carriers.values()) {
      const f = primaryForm(w.id, c.lang);
      const text = f ? f.form : w.borrowings.find((b) => b.to === c.lang)?.form ?? '';
      if (!text) continue;
      const el = document.createElement('div');
      el.className = 'jlabel' + (text.startsWith('*') ? ' is-recon' : '') + (f?.note && /not cognate/i.test(f.note) ? ' is-other' : '');
      const formEl = document.createElement('span');
      formEl.className = 'jl-form';
      formEl.dir = 'auto';
      const langEl = document.createElement('span');
      langEl.className = 'jl-lang';
      langEl.textContent = langById.get(c.lang)?.name ?? c.lang;
      el.append(formEl, langEl);
      el.style.opacity = '0';
      root?.appendChild(el);
      const fromF = c.from ? primaryForm(w.id, c.from) : undefined;
      const fromText = fromF?.form ?? '';
      const l = langById.get(c.lang)!;
      const prio =
        (lineage.has(c.lang) ? 300 : 0) +
        (c.via === 'root' ? 120 : 0) +
        (c.via === 'borrowed' ? 40 : 0) +
        (l.status === 'proto' ? 25 : 0) +
        Math.log10(1 + (l.speakers ?? 0)) * 4 +
        Math.log2(1 + (layout.index.leaves.get(c.lang) ?? 1)) * 2;
      labels.current.push({ carrier: c, el, formEl, text, shownAt: 0, fromText, morphable: MORPHABLE.test(text) && MORPHABLE.test(fromText), prio });
    }
    labels.current.sort((a, b) => b.prio - a.prio);
    lastJourneyY.current = -100;
  }, [w, route]);

  useEffect(() => () => labels.current.forEach((l) => l.el.remove()), []);

  const head = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  const tmpG = new THREE.Vector3();
  const v = new THREE.Vector3();
  const gold = new THREE.Color(INK.gilt);
  const white = new THREE.Color('#fff4dc');
  const col = new THREE.Color();

  useFrame(() => {
    sparks.begin();
    const s = useStore.getState();
    if (!w || !route || U.uJourney.value < 0.02) {
      sparks.end();
      return;
    }
    const now = performance.now();
    const jy = U.uJourneyY.value;
    const m = U.uMorph.value;
    const fade = U.uJourney.value;
    // replay detection: front went backwards
    if (jy < lastJourneyY.current - 0.5) {
      arcs.current.forEach((a) => (a.fired = 0));
      labels.current.forEach((l) => {
        l.shownAt = 0;
        l.el.style.opacity = '0';
      });
    }
    lastJourneyY.current = jy;

    // comets on the wavefront
    for (const e of travelled) {
      if (jy < e.tree.p0.y || jy > e.tree.p3.y) continue;
      const t = tAtY(e, jy);
      bez(e.tree, t, head).lerp(bez(e.globe, t, tmpG), m);
      sparks.push(head, 1.3 * fade, 10, white);
      for (let k = 1; k <= 14; k++) {
        const tt = t - k * 0.018;
        if (tt <= 0) break;
        bez(e.tree, tt, tmp).lerp(bez(e.globe, tt, tmpG), m);
        const f = 1 - k / 14;
        col.copy(white).lerp(gold, k / 14);
        sparks.push(tmp, f * f * 0.9 * fade, 4 + f * 4, col);
      }
    }

    // loanword arcs: dotted routes, as on an old trade map
    for (const a of arcs.current) {
      const yY = yearToY(a.year);
      if (jy < yY) continue;
      if (!a.fired) a.fired = now;
      const p0 = nodePos(a.from, m);
      const p3 = nodePos(a.to, m);
      const center = m > 0.5 ? GLOBE_CENTER : new THREE.Vector3(0, (p0.y + p3.y) / 2, 0);
      const arc = arcBetween(p0, p3, center, m);
      const q = prefersReducedMotion ? 1 : Math.min(1, (now - a.fired) / 1500);
      const qe = 1 - Math.pow(1 - q, 2.2);
      const n = 48;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        if (t > qe) break;
        bez(arc, t, tmp);
        sparks.push(tmp, (i % 2 === 0 ? 0.55 : 0.0) * fade, 3.2, gold);
      }
      if (q < 1) {
        bez(arc, qe, head);
        sparks.push(head, 1.4 * fade, 11, white);
      }
    }
    sparks.end();

    // forms next to their stars
    const W = size.width, H = size.height;
    const maxShown = W < 640 ? 10 : 26;
    let shown = 0;
    for (const l of labels.current) {
      const c = l.carrier;
      const reached = jy >= yearToY(c.year) - 0.05;
      if (!reached) {
        if (l.shownAt) {
          l.shownAt = 0;
          l.el.style.opacity = '0';
        }
        continue;
      }
      if (!l.shownAt) {
        l.shownAt = now;
        l.formEl.textContent = l.morphable ? l.fromText : l.text;
      }
      // letter-by-letter morph from the parent form
      const age = now - l.shownAt;
      if (l.morphable && l.fromText !== l.text) {
        const p = prefersReducedMotion ? 1 : Math.min(1, age / 900);
        const a = [...l.fromText];
        const b = [...l.text];
        const len = Math.max(a.length, b.length);
        const k = Math.floor(p * (len + 1));
        let out = '';
        for (let i = 0; i < len; i++) out += i < k ? b[i] ?? '' : a[i] ?? '';
        if (l.formEl.textContent !== out) l.formEl.textContent = out;
        l.el.classList.toggle('is-morphing', p < 1);
      } else if (l.formEl.textContent !== l.text) l.formEl.textContent = l.text;

      v.copy(nodePos(c.lang, m)).project(camera);
      const x = (v.x * 0.5 + 0.5) * W;
      const y = (-v.y * 0.5 + 0.5) * H;
      const r: Rect = { x, y: y - 20, w: Math.max(l.text.length, 6) * 8 + 12, h: 30 };
      let ok = v.z < 1 && x > -60 && x < W + 60 && y > -30 && y < H + 30 && shown < maxShown;
      if (ok && l.carrier.lang !== s.selected && overlaps(sharedPlaced, r)) ok = false;
      if (ok) {
        sharedPlaced.push(r);
        shown++;
        const appear = prefersReducedMotion ? 1 : Math.min(1, age / 350);
        l.el.style.opacity = (appear * fade).toFixed(3);
        l.el.style.transform = `translate3d(${x.toFixed(1)}px, ${(y - 12).toFixed(1)}px, 0) translate(-50%, -100%)`;
      } else if (l.el.style.opacity !== '0') l.el.style.opacity = '0';
    }
  });

  return <primitive object={sparks.points} />;
}

