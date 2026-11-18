import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { events } from '../data/events';
import { formatYear } from '../lib/timeScale';

/** while history plays, each event rises as a title as its year passes */
export function Chronicle() {
  const [current, setCurrent] = useState<(typeof events)[number] | null>(null);
  const last = useRef<number | null>(null);
  const timer = useRef(0);

  useEffect(
    () =>
      useStore.subscribe((s, p) => {
        if (!s.timePlaying) {
          last.current = null;
          return;
        }
        const prev = last.current ?? p.year;
        last.current = s.year;
        if (s.year <= prev) return;
        const passed = events.filter((e) => e.year > prev && e.year <= s.year);
        if (!passed.length) return;
        setCurrent(passed[passed.length - 1]);
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => setCurrent(null), 4200);
      }),
    [],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);

  if (!current) return null;
  return (
    <div className="chronicle" key={current.year} role="status" aria-live="polite">
      <span className="ch-year">{formatYear(current.year, !!current.approx)}</span>
      <span className="ch-text">{current.label}</span>
    </div>
  );
}
