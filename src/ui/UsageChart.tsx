import { useEffect, useMemo, useRef, useState } from 'react';
import usage from '../data/usage.json';
import type { Usage } from '../data/types';
import { langById } from '../scene/model';
import '../styles/word.css';

const RAW = usage as unknown as Usage;

/**
 * a 25-year centred moving average, then re-normalised to the series' own peak:
 * the early corpora are small and spiky, and the point here is the long shape of a word's life.
 */
function smooth(points: { year: number; value: number }[]) {
  const out = points.map((p, i) => {
    let sum = 0, n = 0;
    for (let k = -2; k <= 2; k++) {
      const q = points[i + k];
      if (q && Math.abs(q.year - p.year) <= 12) {
        const wgt = 3 - Math.abs(k);
        sum += q.value * wgt;
        n += wgt;
      }
    }
    return { year: p.year, value: n ? sum / n : p.value };
  });
  const peak = Math.max(...out.map((p) => p.value), 1e-6);
  return out.map((p) => ({ year: p.year, value: Math.round((p.value / peak) * 100) / 100 }));
}

const DATA: Usage = Object.fromEntries(
  Object.entries(RAW).map(([w, langs]) => [w, Object.fromEntries(Object.entries(langs).map(([l, ser]) => [l, { ...ser, points: smooth(ser.points) }]))]),
);

/** validated against #0b1122; branch tints of the atlas, so a colour means the same language family here as in the sky */
const SERIES: { id: string; color: string }[] = [
  { id: 'english', color: 'var(--uc-english)' },
  { id: 'german', color: 'var(--uc-german)' },
  { id: 'french', color: 'var(--uc-french)' },
  { id: 'spanish', color: 'var(--uc-spanish)' },
  { id: 'italian', color: 'var(--uc-italian)' },
  { id: 'russian', color: 'var(--uc-russian)' },
];
const X0 = 1600;
const X1 = 2019;
const GRID = [1700, 1800, 1900, 2000];
const M = { l: 24, r: 66, t: 12, b: 22 };

export function hasUsage(wordId: string): boolean {
  return !!DATA[wordId] && SERIES.some((s) => DATA[wordId][s.id]);
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function UsageChart({ wordId }: { wordId: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(380);
  const [hover, setHover] = useState<number | null>(null); // index into points

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(240, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const series = useMemo(
    () => SERIES.filter((s) => DATA[wordId]?.[s.id]).map((s) => ({ ...s, d: DATA[wordId][s.id], name: langById.get(s.id)?.name ?? s.id })),
    [wordId],
  );

  const h = Math.round(w * 0.58);
  const iw = w - M.l - M.r;
  const ih = h - M.t - M.b;
  const x = (yr: number) => M.l + ((Math.min(X1, Math.max(X0, yr)) - X0) / (X1 - X0)) * iw;
  const y = (v: number) => M.t + (1 - Math.min(1, Math.max(0, v))) * ih;

  const paths = useMemo(
    () => series.map((s) => s.d.points.filter((p) => p.year <= X1).map((p, i) => `${i ? 'L' : 'M'}${x(p.year).toFixed(1)} ${y(p.value).toFixed(1)}`).join('')),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, w],
  );

  // end labels, nudged apart
  const labels = useMemo(() => {
    const L = series.map((s, i) => {
      const pts = s.d.points.filter((p) => p.year <= X1);
      const last = pts[pts.length - 1];
      return { i, y: y(last?.value ?? 0) };
    });
    L.sort((a, b) => a.y - b.y);
    const gap = 13;
    for (let k = 1; k < L.length; k++) if (L[k].y - L[k - 1].y < gap) L[k].y = L[k - 1].y + gap;
    const over = L.length ? L[L.length - 1].y - (h - M.b + 2) : 0;
    if (over > 0) {
      L[L.length - 1].y -= over;
      for (let k = L.length - 2; k >= 0; k--) if (L[k + 1].y - L[k].y < gap) L[k].y = L[k + 1].y - gap;
    }
    const out: number[] = [];
    L.forEach((l) => (out[l.i] = l.y));
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, w]);

  const ref = series[0]?.d.points ?? [];
  const idxAt = (clientX: number) => {
    const r = wrap.current!.getBoundingClientRect();
    const yr = X0 + ((clientX - r.left - M.l) / iw) * (X1 - X0);
    let best = 0;
    for (let i = 0; i < ref.length; i++) if (Math.abs(ref[i].year - yr) < Math.abs(ref[best].year - yr)) best = i;
    return best;
  };
  const onMove = (e: React.PointerEvent) => setHover(idxAt(e.clientX));
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    setHover((cur) => Math.min(ref.length - 1, Math.max(0, (cur ?? ref.length - 1) + (e.key === 'ArrowRight' ? 1 : -1))));
  };

  if (!series.length) return null;
  const hy = hover !== null ? ref[hover]?.year : null;
  const tipRight = hy !== null && x(hy!) < M.l + iw * 0.55;
  const dashed = series.some((s) => /not a cognate|not cognate/i.test(s.d.note ?? ''));

  const tableYears = [...new Set([...Array.from({ length: 9 }, (_, k) => X0 + k * 50), ref[ref.length - 1]?.year])].filter((v): v is number => !!v);
  const valAt = (s: (typeof series)[number], yr: number) => s.d.points.find((p) => p.year === yr)?.value;

  return (
    <figure className="uc">
      <div className="uc-wrap" ref={wrap}>
        <svg
          width={w}
          height={h}
          role="img"
          aria-label={`Relative frequency of the word in print, ${X0} to ${X1}, for ${series.map((s) => s.name).join(', ')}. A table follows.`}
          tabIndex={0}
          onKeyDown={onKey}
          onBlur={() => setHover(null)}
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(null)}
          style={{ touchAction: 'pan-y' }}
        >
          {GRID.map((g) => (
            <g key={g}>
              <line x1={x(g)} x2={x(g)} y1={M.t} y2={M.t + ih} className="uc-grid" />
              <text x={x(g)} y={h - 6} textAnchor="middle" className="uc-ax">{g}</text>
            </g>
          ))}
          <text x={M.l} y={h - 6} textAnchor="start" className="uc-ax">{X0}</text>
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line x1={M.l} x2={M.l + iw} y1={y(v)} y2={y(v)} className={v === 0 ? 'uc-base' : 'uc-grid'} />
              <text x={M.l - 6} y={y(v) + 3.5} textAnchor="end" className="uc-ax">{v === 0 ? '0' : v === 1 ? 'peak' : '½'}</text>
            </g>
          ))}
          {series.map((s, i) => {
            const dash = /not cognate/i.test(s.d.note ?? '');
            return (
              <g key={s.id}>
                <path d={paths[i]} fill="none" style={{ stroke: s.color }} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash ? '4 3' : undefined} />
                <line x1={M.l + iw + 3} x2={M.l + iw + 11} y1={labels[i]} y2={labels[i]} style={{ stroke: s.color }} strokeWidth={1.5} strokeDasharray={dash ? '3 2' : undefined} />
                <text x={M.l + iw + 15} y={labels[i] + 3.5} className="uc-lab">{s.name}</text>
              </g>
            );
          })}
          {hover !== null && hy !== null && (
            <g pointerEvents="none">
              <line x1={x(hy)} x2={x(hy)} y1={M.t} y2={M.t + ih} style={{ stroke: 'var(--gilt)' }} strokeWidth={1} />
              {series.map((s) => {
                const v = valAt(s, hy);
                return v === undefined ? null : <circle key={s.id} cx={x(hy)} cy={y(v)} r={3} style={{ fill: s.color, stroke: 'var(--night-2)' }} strokeWidth={2} />;
              })}
            </g>
          )}
        </svg>
        {hover !== null && hy !== null && (
          <div className="uc-tip" style={{ top: 6, ...(tipRight ? { left: x(hy) + 10 } : { right: w - x(hy) + 10 }) }} aria-hidden="true">
            <div className="sc uc-tip-year">{hy}</div>
            {series.map((s) => {
              const v = valAt(s, hy);
              return (
                <div className="uc-tip-row" key={s.id}>
                  <i className="uc-key" style={{ background: s.color }} />
                  <span className="uc-tip-lang">{s.name}</span>
                  <span className="form uc-tip-form" dir="auto">{s.d.forms.slice(0, 2).join(', ')}</span>
                  <span className="uc-tip-v">{v === undefined ? '–' : pct(v)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <figcaption className="uc-cap">
        Each line relative to its own peak, smoothed over 25 years; Google Books Ngram, 2019 corpora. Before 1800 the corpora are thin and the curves uncertain; there is no data before 1600.
        {dashed && ' Dashed lines mark a word for the concept that is not a cognate.'}
        {series.some((s) => s.d.note === 'summed over case forms') && ' Russian is summed over case forms.'}
      </figcaption>
      <table className="sr-only">
        <caption>Relative frequency in print (1 = the language's own peak)</caption>
        <thead>
          <tr><th>Year</th>{series.map((s) => <th key={s.id}>{s.name}: {s.d.forms.join(', ')}</th>)}</tr>
        </thead>
        <tbody>
          {tableYears.map((yr) => (
            <tr key={yr}>
              <th>{yr}</th>
              {series.map((s) => <td key={s.id}>{valAt(s, yr)?.toFixed(2) ?? 'n/a'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
