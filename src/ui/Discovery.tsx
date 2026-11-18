import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { languages } from '../data';
import { BRANCH_LABEL } from '../lib/palette';
import type { Branch } from '../data/types';

const KEY = 'sl.badges';
const ie = languages.filter((l) => l.branch !== 'contact');

function earned(visited: string[]): Map<string, string> {
  const v = new Set(visited);
  const out = new Map<string, string>();
  const n = ie.filter((l) => v.has(l.id)).length;
  if (n >= 1) out.set('first', 'Your first star is charted.');
  for (const k of [10, 25, 50, 100]) if (n >= k) out.set(`n${k}`, `${k} stars charted.`);
  if (n >= ie.length) out.set('all', 'Every star in the atlas charted. A philologer, truly.');
  if (ie.some((l) => v.has(l.id) && l.status === 'proto' && l.id !== 'pie')) out.set('proto', 'You visited a language no one ever wrote down.');
  if (ie.some((l) => v.has(l.id) && l.end !== null && (l.status === 'extinct' || l.status === 'ancient'))) out.set('dead', '† A silent star: attested, but no longer spoken.');
  if (v.has('pie')) out.set('root', 'You stood at the root of it all.');
  const branches = new Set(ie.map((l) => l.branch));
  for (const b of branches) {
    if (b === 'root') continue;
    const members = ie.filter((l) => l.branch === b);
    if (members.length > 1 && members.every((l) => v.has(l.id))) out.set(`b-${b}`, `The whole ${BRANCH_LABEL[b as Branch]} constellation charted.`);
  }
  return out;
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

/** quiet milestones for exploring the sky */
export function Discovery() {
  const visited = useStore((s) => s.visited);
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  const seen = useRef(loadSeen());

  useEffect(() => {
    const now = earned(visited);
    const fresh = [...now.entries()].filter(([k]) => !seen.current.has(k));
    if (!fresh.length) return;
    for (const [k] of fresh) seen.current.add(k);
    try {
      localStorage.setItem(KEY, JSON.stringify([...seen.current]));
    } catch {
      /* storage unavailable */
    }
    setToast({ text: fresh[fresh.length - 1][1], key: Date.now() });
  }, [visited]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4300);
    return () => clearTimeout(t);
  }, [toast]);

  return toast ? (
    <div className="toast" key={toast.key} role="status">
      {toast.text}
    </div>
  ) : null;
}
