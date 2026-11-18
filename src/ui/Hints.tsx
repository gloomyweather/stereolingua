import { useEffect, useState } from 'react';
import { useStore } from '../store';

const KEY = 'sl.hints';
const HINTS = [
  { id: 'star', text: 'Click any star — or press ↑ to start at the root.' },
  { id: 'word', text: 'Choose a word in the lexicon to watch it travel through time.' },
  { id: 'time', text: 'Drag the scale of years, or play history from the beginning.' },
] as const;

function load(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

/** three gentle first-visit hints, each shown once, each dismissed by doing the thing */
export function Hints() {
  const phase = useStore((s) => s.phase);
  const selected = useStore((s) => s.selected);
  const word = useStore((s) => s.word);
  const hovered = useStore((s) => s.hovered);
  const [done, setDone] = useState<string[]>(load);

  const mark = (id: string) =>
    setDone((d) => {
      if (d.includes(id)) return d;
      const n = [...d, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(n));
      } catch {
        /* storage unavailable */
      }
      return n;
    });

  useEffect(() => {
    if (selected) mark('star');
  }, [selected]);
  useEffect(() => {
    if (word) mark('word');
  }, [word]);
  useEffect(
    () =>
      useStore.subscribe((s, p) => {
        if (s.year !== p.year || s.timePlaying) mark('time');
      }),
    [],
  );

  if (phase !== 'explore' || hovered) return null;
  let hint: (typeof HINTS)[number] | undefined;
  if (!done.includes('star')) hint = HINTS[0];
  else if (selected && !done.includes('word')) hint = HINTS[1];
  else if (done.includes('word') && !word && !done.includes('time')) hint = HINTS[2];
  if (!hint) return null;
  return (
    <div className="hint" role="note" key={hint.id}>
      <span aria-hidden>✳</span> {hint.text}
    </div>
  );
}
