import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { words } from '../data';
import { langById, wordCarriers } from '../scene/model';
import { BRANCH_LABEL, BRANCH_TINT } from '../lib/palette';
import { formatYear } from '../lib/timeScale';
import type { Branch } from '../data/types';
import { WordTimeline } from './WordTimeline';
import { UsageChart, hasUsage } from './UsageChart';
import '../styles/word.css';

/** the journey clock changes every frame; the card only needs to hear it ~10 times a second */
function useThrottledJourneyYear(ms = 100) {
  const [y, setY] = useState(() => useStore.getState().journeyYear);
  useEffect(() => {
    let last = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsub = useStore.subscribe((s, prev) => {
      if (s.journeyYear === prev.journeyYear) return;
      const now = performance.now();
      clearTimeout(timer);
      if (now - last >= ms) {
        last = now;
        setY(s.journeyYear);
      } else {
        timer = setTimeout(() => {
          last = performance.now();
          setY(useStore.getState().journeyYear);
        }, ms);
      }
    });
    setY(useStore.getState().journeyYear);
    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, [ms]);
  return y;
}

function Clock() {
  const y = useThrottledJourneyYear();
  const wordId = useStore((s) => s.word)!;
  const playing = useStore((s) => s.journeyPlaying);
  const route = wordCarriers(wordId);
  const span = Math.max(1, route.endYear - route.startYear);
  const f = Math.min(1, Math.max(0, (y - route.startYear) / span));
  return (
    <div className="wj-clock" aria-live="off">
      <span className="wj-year sc">{playing ? formatYear(y, true) : 'journey ended'}</span>
      <span className="wj-track" aria-hidden="true">
        <span className="wj-fill" style={{ width: `${(playing ? f : 1) * 100}%` }} />
      </span>
    </div>
  );
}

const dead = (id: string) => {
  const l = langById.get(id);
  return !!l && l.end !== null && l.status !== 'proto';
};

export function WordPanel() {
  const wordId = useStore((s) => s.word);
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const setWord = useStore((s) => s.setWord);
  const replay = useStore((s) => s.replayJourney);

  const w = useMemo(() => words.find((x) => x.id === wordId), [wordId]);
  const route = useMemo(() => (wordId ? wordCarriers(wordId) : null), [wordId]);

  const living = useMemo(() => {
    if (!w || !route) return [];
    return [...route.carriers.keys()]
      .filter((id) => langById.get(id)?.status === 'living' && w.forms.some((f) => f.lang === id))
      .sort((a, b) => (langById.get(b)?.speakers ?? 0) - (langById.get(a)?.speakers ?? 0));
  }, [w, route]);

  const groups = useMemo(() => {
    if (!w) return [];
    const m = new Map<Branch, typeof w.forms>();
    for (const f of w.forms) {
      const b = langById.get(f.lang)?.branch;
      if (!b) continue;
      m.set(b, [...(m.get(b) ?? []), f]);
    }
    return [...m.entries()];
  }, [w]);

  if (!w || !route) return null;

  const carries = (id: string | null) => !!id && route.carriers.has(id) && w.forms.some((f) => f.lang === id);
  const focus = carries(selected) ? selected! : carries('english') ? 'english' : living[0] ?? null;
  const options = focus && !living.includes(focus) ? [focus, ...living] : living;
  const nLang = new Set(w.forms.map((f) => f.lang)).size;
  const rootLang = langById.get(w.rootLang);
  const hasU = hasUsage(w.id);

  return (
    <aside className="card word-card" key={w.id} aria-label={`Word journey: ${w.gloss}`}>
      <div className="card-eyebrow">
        <span>word journey</span>
        <span className="desig">{w.kind}</span>
        <span>{nLang} languages</span>
      </div>
      <h2 className="card-title">{w.gloss}</h2>
      <div className="card-sub">
        <span className="form" dir="auto">{w.root}</span> <span className="muted">in {rootLang?.name ?? w.rootLang}</span>
      </div>
      <div className="asterism" aria-hidden="true">✳</div>
      <p className="prose lead">{w.blurb}</p>

      <div className="wj-bar">
        <Clock />
        <button className="btn-text" onClick={replay}>replay journey</button>
        <button className="btn-text wj-close" onClick={() => setWord(null)}>close</button>
      </div>

      {focus && (
        <>
          <h3 className="sec-title">
            <span>In {dead(focus) && '† '}{langById.get(focus)?.name ?? focus}</span>
            {options.length > 1 && (
              <select className="wj-select" aria-label="Show the journey into another language" value={focus} onChange={(e) => select(e.target.value)}>
                {options.map((id) => (
                  <option key={id} value={id}>{langById.get(id)?.name ?? id}</option>
                ))}
              </select>
            )}
          </h3>
          <WordTimeline wordId={w.id} langId={focus} />
        </>
      )}

      {hasU && (
        <>
          <h3 className="sec-title"><span>Usage in print</span><small>1600–2019</small></h3>
          <UsageChart wordId={w.id} />
        </>
      )}

      <h3 className="sec-title"><span>All forms</span><small>{nLang}</small></h3>
      <div className="wf">
        {groups.map(([branch, forms]) => (
          <section className="wf-group" key={branch}>
            <h4 className="wf-branch sc"><span className="swatch" style={{ ['--c' as string]: BRANCH_TINT[branch] }} /> {BRANCH_LABEL[branch]}</h4>
            <ul className="wf-list">
              {forms.map((f, i) => {
                const l = langById.get(f.lang);
                const c = route.carriers.get(f.lang);
                const notes: string[] = [];
                if (f.note) notes.push(f.note);
                if (c?.via === 'borrowed') {
                  const b = w.borrowings.find((x) => x.to === f.lang);
                  const src = langById.get(c.from ?? b?.from ?? '')?.name;
                  notes.push(`borrowed${src ? ` from ${src}` : ''}, ${formatYear(b?.year ?? c.year, true)}`);
                }
                return (
                  <li className={'wf-row' + (f.lang === focus ? ' is-on' : '')} key={f.lang + i}>
                    <button className="wf-lang sc" onClick={() => select(f.lang)}>
                      {dead(f.lang) && <span className="dagger">† </span>}
                      {l?.name ?? f.lang}
                    </button>
                    <span className="wf-form">
                      <span className="form" dir="auto">{f.form}</span>
                      {f.translit && <span className="wf-tr"> {f.translit}</span>}
                    </span>
                    {notes.length > 0 && <span className="wf-note muted">{notes.join('; ')}</span>}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div className="sources">
        <em>sources</em> {w.sources.join(' · ')}
      </div>
    </aside>
  );
}
