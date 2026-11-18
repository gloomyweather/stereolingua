import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { words } from '../data';
import { langById, nodePos, bez, primaryForm, GLOBE_CENTER } from './model';
import { U } from './uniforms';
import { Sparks, arcBetween } from './sparks';
import { useStore, prefersReducedMotion } from '../store';
import { formatYear } from '../lib/timeScale';
import { INK } from '../lib/palette';

interface Meteor {
  arc: ReturnType<typeof arcBetween>;
  t0: number;
  dur: number;
  el: HTMLDivElement;
}

const TRAIL = 34;

/**
 * ambient loanwords: every few seconds a real borrowing crosses the sky as a meteor,
 * with a small caption — the sky teaches while you just watch.
 */
export function Meteors() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const sparks = useMemo(() => new Sparks(3 * (TRAIL + 1)), []);
  const live = useRef<Meteor[]>([]);
  const next = useRef(performance.now() + 9000);
  const lastPick = useRef<string[]>([]);

  const pool = useMemo(
    () =>
      words.flatMap((w) =>
        w.borrowings
          .filter((b) => langById.has(b.from) && langById.has(b.to))
          .map((b) => ({ w, b })),
      ),
    [],
  );

  useEffect(
    () => () => {
      live.current.forEach((m) => m.el.remove());
      live.current = [];
    },
    [],
  );

  const spawn = () => {
    const choices = pool.filter((x) => !lastPick.current.includes(x.w.id + x.b.to));
    const pick = choices[Math.floor(Math.random() * choices.length)];
    if (!pick) return;
    lastPick.current = [...lastPick.current.slice(-12), pick.w.id + pick.b.to];
    const m = U.uMorph.value;
    const p0 = nodePos(pick.b.from, m);
    const p3 = nodePos(pick.b.to, m);
    const center = m > 0.5 ? GLOBE_CENTER : new THREE.Vector3(0, (p0.y + p3.y) / 2, 0);
    const arc = arcBetween(p0, p3, center, m);
    const root = document.getElementById('labels');
    const el = document.createElement('div');
    el.className = 'meteor-caption';
    const fromForm = primaryForm(pick.w.id, pick.b.from);
    const fromName = langById.get(pick.b.from)!.name;
    const toName = langById.get(pick.b.to)!.name;
    el.innerHTML = '';
    const gloss = document.createElement('span');
    gloss.className = 'mc-gloss';
    gloss.textContent = `‘${pick.w.gloss}’`;
    const route = document.createElement('span');
    route.className = 'mc-route';
    const f1 = document.createElement('i');
    f1.textContent = fromForm ? fromForm.translit ?? fromForm.form : '';
    const f2 = document.createElement('i');
    f2.textContent = pick.b.form;
    route.append(`${fromName} `, f1, ' → ', `${toName} `, f2);
    const yr = document.createElement('span');
    yr.className = 'mc-year';
    yr.textContent = formatYear(pick.b.year, true);
    el.append(gloss, route, yr);
    el.style.opacity = '0';
    root?.appendChild(el);
    live.current.push({ arc, t0: performance.now(), dur: 3400, el });
  };

  const v = new THREE.Vector3();
  const head = new THREE.Vector3();
  const gold = new THREE.Color(INK.gilt);
  const white = new THREE.Color('#fff6e4');
  const c = new THREE.Color();

  useFrame(() => {
    const s = useStore.getState();
    const now = performance.now();
    const quiet = s.phase === 'explore' && !s.word && !s.timePlaying && !s.flying && !prefersReducedMotion && !document.hidden;
    if (quiet && now > next.current && live.current.length < 2) {
      spawn();
      next.current = now + 7000 + Math.random() * 6000;
    }
    if (!quiet && now > next.current) next.current = now + 4000;

    sparks.begin();
    live.current = live.current.filter((m) => {
      const p = (now - m.t0) / m.dur;
      if (p >= 1) {
        m.el.remove();
        return false;
      }
      const e = 1 - Math.pow(1 - Math.min(1, p * 1.35), 2.4);
      const fade = Math.min(1, (1 - p) * 4);
      bez(m.arc, e, head);
      sparks.push(head, 1.6 * fade, 9, white);
      for (let k = 1; k <= TRAIL; k++) {
        const t = e - k * 0.012;
        if (t <= 0) break;
        bez(m.arc, t, v);
        const f = Math.pow(1 - k / TRAIL, 1.6);
        c.copy(white).lerp(gold, k / TRAIL);
        sparks.push(v, f * fade * 0.9, 5 * f + 1.2, c);
      }
      // caption rides just below the head
      v.copy(head).project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      const show = v.z < 1 ? Math.min(1, p * 5) * fade : 0;
      m.el.style.opacity = show.toFixed(3);
      // keep the caption on the plate: flip it to the left of the head near the right edge
      const cw = m.el.offsetWidth || 260;
      const cx = x + 14 + cw > size.width - 12 ? x - 14 - cw : x + 14;
      const cy = Math.min(size.height - 70, Math.max(12, y + 10));
      m.el.style.transform = `translate3d(${Math.max(8, cx).toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      return true;
    });
    sparks.end();
  });

  return <primitive object={sparks.points} />;
}
