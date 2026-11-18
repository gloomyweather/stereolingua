import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { languages } from '../data';
import { layout, langById, designation } from '../scene/model';
import { formatYear } from '../lib/timeScale';
import { BRANCH_TINT } from '../lib/palette';
import type { Language } from '../data/types';
import '../styles/overlays.css';

const dates = (l: Language) => `${formatYear(l.start, true)} – ${l.end === null ? 'present' : formatYear(l.end, true)}`;
const dead = (l: Language) => l.end !== null && l.status !== 'proto';

const roots = layout.index.roots.filter((id) => langById.get(id)?.branch !== 'contact');
const contacts = languages.filter((l) => l.branch === 'contact').sort((a, b) => a.start - b.start || a.name.localeCompare(b.name));
const kids = (id: string) => layout.index.children.get(id) ?? [];
const branching = languages.filter((l) => kids(l.id).length > 0).map((l) => l.id);

function initialOpen(): Set<string> {
  const open = new Set<string>();
  for (const [id, d] of layout.index.depth) if (d < 2 && kids(id).length) open.add(id);
  // keep the reader's place: open the path down to the selected language
  let at = useStore.getState().selected;
  while (at) {
    const p = langById.get(at)?.parent ?? null;
    if (p) open.add(p);
    at = p;
  }
  return open;
}

export function OutlineView() {
  const overlay = useStore((s) => s.overlay);
  if (overlay !== 'outline') return null;
  return <OutlinePanel />;
}

function OutlinePanel() {
  const { select, setOverlay } = useStore.getState();
  const [open, setOpen] = useState<Set<string>>(initialOpen);

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

  const go = (id: string) => {
    select(id);
    setOverlay(null);
  };
  const toggle = (id: string) =>
    setOpen((o) => {
      const n = new Set(o);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const row = (id: string): JSX.Element | null => {
    const l = langById.get(id);
    if (!l) return null;
    const ch = kids(id);
    const isOpen = open.has(id);
    return (
      <li className="ol-item" key={id}>
        <div className="ol-row">
          {ch.length ? (
            <button
              className="ol-toggle"
              aria-expanded={isOpen}
              aria-controls={`ol-${id}`}
              aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${l.name}, ${ch.length} ${ch.length === 1 ? 'branch' : 'branches'}`}
              onClick={() => toggle(id)}
            >
              <span aria-hidden>{isOpen ? '−' : '+'}</span>
            </button>
          ) : (
            <span className="ol-toggle is-leaf" aria-hidden>·</span>
          )}
          <button className={'ol-name' + (l.status === 'proto' ? ' is-proto' : '')} onClick={() => go(id)}>
            <i className="ix-swatch" style={{ ['--c' as string]: BRANCH_TINT[l.branch] }} aria-hidden />
            {dead(l) && <span className="dagger" aria-label="extinct">†</span>}
            {l.name}
          </button>
          <span className="ix-lead" aria-hidden />
          <span className="ol-dates">{dates(l)}</span>
          <span className="ol-desig" title="designation">{designation.get(id)}</span>
        </div>
        {ch.length > 0 && isOpen && (
          <ul className="ol-list" id={`ol-${id}`}>
            {ch.map(row)}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setOverlay(null)}>
      <div className="overlay-inner ov ol" role="dialog" aria-modal="true" aria-labelledby="outline-title">
        <button className="ov-close" onClick={() => setOverlay(null)} aria-label="Close the outline" autoFocus>×</button>
        <header className="ov-head">
          <h2 id="outline-title" className="card-title">Outline</h2>
          <p className="ov-sub sc">the whole family, in descent</p>
        </header>

        <div className="ol-tools">
          <button className="btn-text" onClick={() => setOpen(new Set(branching))}>open all</button>
          <button className="btn-text" onClick={() => setOpen(new Set(roots))}>close all</button>
        </div>

        <nav aria-label="Family of languages">
          <ul className="ol-list ol-root">
            {roots.map(row)}
          </ul>
        </nav>

        {contacts.length > 0 && (
          <section aria-labelledby="ol-neigh">
            <h3 className="sec-title" id="ol-neigh">Neighbours <small>languages outside the family, lenders of words</small></h3>
            <ul className="ol-list ol-root">
              {contacts.map((l) => (
                <li className="ol-item" key={l.id}>
                  <div className="ol-row">
                    <span className="ol-toggle is-leaf" aria-hidden>·</span>
                    <button className="ol-name" onClick={() => go(l.id)}>
                      <i className="ix-swatch" style={{ ['--c' as string]: BRANCH_TINT.contact }} aria-hidden />
                      {dead(l) && <span className="dagger" aria-label="extinct">†</span>}
                      {l.name}
                    </button>
                    <span className="ix-lead" aria-hidden />
                    <span className="ol-dates">{dates(l)}</span>
                    <span className="ol-desig">{designation.get(l.id)}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
