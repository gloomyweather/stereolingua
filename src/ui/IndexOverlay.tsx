import { isExtinct } from '../lib/status';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import { languages, words } from '../data';
import { searchAll, type SearchResult } from '../lib/search';
import { formatYear } from '../lib/timeScale';
import { BRANCH_TINT } from '../lib/palette';
import type { Language } from '../data/types';
import '../styles/overlays.css';

/* ------------------------------------------------------------- shortcut */

function isTyping(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable;
}

/** opens the index on ⌘K / Ctrl+K or "/", and toggles it closed on the same keys */
export function useIndexShortcut() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { overlay, setOverlay } = useStore.getState();
      const isK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey) && !e.altKey;
      const isSlash = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping(e.target);
      if (!isK && !isSlash) return;
      e.preventDefault();
      setOverlay(overlay === 'index' ? null : 'index');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

/* ------------------------------------------------------------- helpers */

const span = (l: Language) => `${formatYear(l.start, true)} – ${l.end === null ? 'present' : formatYear(l.end, true)}`;
const isDead = isExtinct;

function pick<T>(arr: T[], n: number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

const CAP = { language: 8, word: 8, form: 14 } as const;
const langName = new Map(languages.map((l) => [l.id, l]));

function LangName({ l }: { l: Language }) {
  return (
    <span className={'ix-name' + (l.status === 'proto' ? ' is-proto' : '')}>
      <i className="ix-swatch" style={{ ['--c' as string]: BRANCH_TINT[l.branch] }} aria-hidden />
      {isDead(l) && <span className="dagger" aria-label="extinct">†</span>}
      {l.name}
    </span>
  );
}

/* ------------------------------------------------------------- overlay */

export function IndexOverlay() {
  const overlay = useStore((s) => s.overlay);
  if (overlay !== 'index') return null;
  return <IndexPanel />;
}

function IndexPanel() {
  const { select, setWord, setOverlay } = useStore.getState();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // stable per open: the panel mounts only while the index is shown
  const suggestions = useMemo(
    () => ({ langs: pick(languages.filter((l) => l.branch !== 'contact'), 6), words: pick(words, 6) }),
    [],
  );

  const sections = useMemo(() => {
    const query = q.trim();
    if (!query) {
      return {
        query,
        langs: suggestions.langs.map((l) => ({ kind: 'language' as const, id: l.id, score: 0, language: l })),
        words: suggestions.words.map((w) => ({ kind: 'word' as const, id: w.id, score: 0, word: w })),
        forms: [] as SearchResult[],
      };
    }
    const all = searchAll(query, 120);
    return {
      query,
      langs: all.filter((r) => r.kind === 'language').slice(0, CAP.language) as Extract<SearchResult, { kind: 'language' }>[],
      words: all.filter((r) => r.kind === 'word').slice(0, CAP.word) as Extract<SearchResult, { kind: 'word' }>[],
      forms: all.filter((r) => r.kind === 'form').slice(0, CAP.form),
    };
  }, [q, suggestions]);

  const flat: SearchResult[] = useMemo(() => [...sections.langs, ...sections.words, ...sections.forms], [sections]);

  useEffect(() => setActive(0), [q]);

  const open = (r: SearchResult | undefined) => {
    if (!r) return;
    if (r.kind === 'language') select(r.id);
    else if (r.kind === 'word') setWord(r.id);
    else {
      select(r.langId);
      setWord(r.wordId);
    }
    setOverlay(null);
  };

  // Esc closes, even if focus has wandered
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      setOverlay(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [setOverlay]);

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, flat]);

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Home' && e.ctrlKey) {
      setActive(0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      open(flat[active]);
    }
  };

  let n = -1;
  const rowProps = (r: SearchResult) => {
    const i = ++n;
    return {
      id: `index-opt-${i}`,
      role: 'option' as const,
      'aria-selected': i === active,
      className: 'ix-row' + (i === active ? ' is-active' : ''),
      onMouseMove: () => i !== active && setActive(i),
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      onClick: () => open(r),
    };
  };

  const empty = sections.query && flat.length === 0;

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setOverlay(null)}>
      <div className="overlay-inner ov ix" role="dialog" aria-modal="true" aria-labelledby="index-title">
        <button className="ov-close" onClick={() => setOverlay(null)} aria-label="Close the index">×</button>
        <header className="ov-head">
          <h2 id="index-title" className="card-title">Index</h2>
          <p className="ov-sub sc">of tongues, words and forms</p>
        </header>

        <input
          id="index-q"
          className="ix-input"
          type="text"
          role="combobox"
          aria-expanded="true"
          aria-autocomplete="list"
          aria-controls="index-list"
          aria-activedescendant={flat.length ? `index-opt-${active}` : undefined}
          aria-label="Search the index"
          placeholder="a language, a word, or any form — try ‘nacht’"
          autoFocus
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onInputKey}
        />

        <div id="index-list" className="ix-list" role="listbox" aria-label={sections.query ? 'Results' : 'Suggestions'} ref={listRef}>
          {empty && (
            <p className="ix-none">
              Nothing is entered under ‘{sections.query}’. <span className="muted">Try a shorter stem, or a spelling without diacritics.</span>
            </p>
          )}

          {sections.langs.length > 0 && (
            <div role="group" aria-labelledby="ix-h-lang">
              <h3 className="sec-title" id="ix-h-lang">Languages{!sections.query && <small>suggested</small>}</h3>
              {sections.langs.map((r) => {
                const l = (r as Extract<SearchResult, { kind: 'language' }>).language;
                return (
                  <div key={r.id} {...rowProps(r)}>
                    <LangName l={l} />
                    <span className="ix-lead" aria-hidden />
                    <span className="ix-detail">{span(l)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {sections.words.length > 0 && (
            <div role="group" aria-labelledby="ix-h-word">
              <h3 className="sec-title" id="ix-h-word">Words{!sections.query && <small>suggested</small>}</h3>
              {sections.words.map((r) => {
                const w = (r as Extract<SearchResult, { kind: 'word' }>).word;
                return (
                  <div key={r.id} {...rowProps(r)}>
                    <span className="ix-name"><span className="gloss">{w.gloss}</span></span>
                    <span className="ix-lead" aria-hidden />
                    <span className="ix-detail form">{w.root}</span>
                  </div>
                );
              })}
            </div>
          )}

          {sections.forms.length > 0 && (
            <div role="group" aria-labelledby="ix-h-form">
              <h3 className="sec-title" id="ix-h-form">Forms</h3>
              {sections.forms.map((r) => {
                if (r.kind !== 'form') return null;
                const lang = langName.get(r.langId);
                return (
                  <div key={r.id} {...rowProps(r)}>
                    <span className="ix-name">
                      <span className="form ix-form">{r.form.form}</span>
                      {r.form.translit && r.form.translit !== r.form.form && <span className="ix-tr form muted"> {r.form.translit}</span>}
                    </span>
                    <span className="ix-lead" aria-hidden />
                    <span className="ix-detail">
                      {lang ? (isDead(lang) ? '† ' : '') + lang.name : r.langId} · <span className="gloss">{r.word.gloss}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="ix-foot muted" aria-hidden>
          <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
        </footer>
        <p className="sr-only" role="status" aria-live="polite">
          {sections.query ? (flat.length ? `${flat.length} entries` : 'no entries') : ''}
        </p>
      </div>
    </div>
  );
}
