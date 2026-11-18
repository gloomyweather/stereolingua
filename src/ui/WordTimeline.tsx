import { useMemo } from 'react';
import { words } from '../data';
import type { Borrowing, SoundChange } from '../data/types';
import { langById, layout, primaryForm, wordCarriers } from '../scene/model';
import { ancestors } from '../lib/tree';
import { formatYear } from '../lib/timeScale';
import '../styles/word.css';

interface Stage {
  lang: string;
  year: number;
  form?: string;
  translit?: string;
  recon: boolean;
  /** how this stage was reached from the previous one */
  how: 'start' | 'inherited' | 'borrowed';
  borrowing?: Borrowing;
  rules: SoundChange[];
}

/** walk the carrier chain backwards from `langId` to the root; returns stages oldest first.
 *  each stage's `how` / `borrowing` describe the step *into* that stage. */
export function buildStages(wordId: string, langId: string): Stage[] {
  const w = words.find((x) => x.id === wordId);
  if (!w) return [];
  const route = wordCarriers(wordId);
  const rev: Stage[] = [];
  const seen = new Set<string>();
  let cur: string | undefined = langId;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const c = route.carriers.get(cur);
    const pf = primaryForm(wordId, cur);
    const lang = langById.get(cur);
    const borrowed = c?.via === 'borrowed';
    const borrowing = borrowed ? (w.borrowings.find((b) => b.to === cur && b.from === c?.from) ?? w.borrowings.find((b) => b.to === cur)) : undefined;
    rev.push({
      lang: cur,
      year: c?.year ?? lang?.start ?? 0,
      form: pf?.form,
      translit: pf?.translit,
      recon: !!pf && !pf.attested,
      how: borrowed ? 'borrowed' : c?.via === 'inherited' ? 'inherited' : 'start',
      borrowing,
      rules: [],
    });
    if (!c || !c.from || c.via === 'root' || c.via === 'unknown') break;
    cur = c.from;
  }
  const stages = rev.reverse();
  // the first stage is a beginning, whatever way it was reached
  if (stages.length) stages[0] = { ...stages[0], how: 'start' };
  // the step into a stage from a borrowing source we hold no form for: keep the source's name on the link
  const shown = stages.filter((s) => !!s.form);
  const out = shown.length ? shown : stages;
  out.forEach((s, i) => {
    if (i === 0) return;
    if (s.how === 'inherited') {
      const prev = out[i - 1].lang;
      const chain = ancestors(layout.index, s.lang);
      const span = new Set(chain.slice(0, chain.indexOf(prev) + 1));
      if (span.size > 1) s.rules = w.soundChanges.filter((r) => span.has(r.from) && span.has(r.to) && r.from !== r.to);
    }
  });
  return out;
}

export function WordTimeline({ wordId, langId }: { wordId: string; langId: string }) {
  const stages = useMemo(() => buildStages(wordId, langId), [wordId, langId]);
  if (!stages.length) return <p className="wt-empty muted">No route is recorded for this language.</p>;
  return (
    <ol className="wt" aria-label="How the word reached this language">
      {stages.map((s, i) => {
        const lang = langById.get(s.lang);
        const last = i === stages.length - 1;
        const dead = !!lang && lang.end !== null && lang.status !== 'proto';
        const approx = !!lang && (lang.startUncertainty > 0 || lang.status === 'proto' || s.how !== 'start');
        return (
          <li key={s.lang} className={'wt-stage' + (last ? ' is-last' : '')}>
            {i > 0 && (s.how === 'borrowed' || s.rules.length > 0) && (
              <div className="wt-link">
                {s.how === 'borrowed' ? (
                  <span className="wt-borrow">
                    <b className="sc">borrowed</b>
                    {s.borrowing && <span> {formatYear(s.borrowing.year, true)}</span>}
                    {s.borrowing && s.borrowing.from !== stages[i - 1].lang && <span className="muted"> from {langById.get(s.borrowing.from)?.name ?? s.borrowing.from}</span>}
                    {s.borrowing?.note && <span className="muted"> — {s.borrowing.note}</span>}
                  </span>
                ) : (
                  s.rules.map((r, k) => (
                    <span className="wt-rule" key={k}>
                      {r.rule}
                    </span>
                  ))
                )}
              </div>
            )}
            <span className="wt-dot" aria-hidden="true" />
            <div className="wt-head">
              <span className="sc wt-year">{formatYear(s.year, approx)}</span>
              <span className="wt-lang">
                {dead && <span className="dagger">†</span>}
                {lang?.name ?? s.lang}
              </span>
            </div>
            <div className="wt-form form" dir="auto">
              {s.form}
            </div>
            {s.translit && <div className="wt-tr">{s.translit}</div>}
          </li>
        );
      })}
    </ol>
  );
}
