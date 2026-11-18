import { BRANCH_TINT, BRANCH_LABEL } from '../lib/palette';
import { layout, langById } from '../scene/model';
import { useStore } from '../store';
import type { Branch } from '../data/types';

const I = '#ece3cc';

function Glyph({ kind }: { kind: 'proto' | 'living' | 'medieval' | 'dead' | 'rays' | 'ring' | 'orbit' | 'line' | 'life' | 'meteor' }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      {kind === 'proto' && (
        <g stroke={I} strokeWidth="1.3" strokeLinecap="round">
          <line x1="11" y1="4" x2="11" y2="18" /><line x1="5" y1="7.5" x2="17" y2="14.5" /><line x1="5" y1="14.5" x2="17" y2="7.5" />
        </g>
      )}
      {kind === 'living' && <circle cx="11" cy="11" r="4" fill={I} />}
      {kind === 'medieval' && (<><circle cx="11" cy="11" r="3" fill={I} /><circle cx="11" cy="11" r="6" fill="none" stroke={I} strokeWidth="0.8" /></>)}
      {kind === 'dead' && <circle cx="11" cy="11" r="4" fill="none" stroke={I} strokeWidth="1.3" />}
      {kind === 'rays' && (
        <g stroke={I} strokeWidth="0.9">{[0, 1, 2, 3, 4, 5].map((i) => { const a = (i / 6) * Math.PI * 2; return <line key={i} x1={11 + Math.cos(a) * 4} y1={11 + Math.sin(a) * 4} x2={11 + Math.cos(a) * 10} y2={11 + Math.sin(a) * 10} />; })}<circle cx="11" cy="11" r="2.4" fill={I} /></g>
      )}
      {kind === 'ring' && (<><circle cx="11" cy="11" r="2.4" fill={I} /><circle cx="11" cy="11" r="7" fill="none" stroke={I} strokeWidth="0.9" /></>)}
      {kind === 'orbit' && (<><circle cx="11" cy="11" r="2.4" fill={I} /><circle cx="18" cy="11" r="1.6" fill={I} /><circle cx="4" cy="11" r="1.6" fill={I} /></>)}
      {kind === 'line' && <path d="M3 18 C 8 12, 12 8, 19 4" stroke={I} strokeWidth="0.9" fill="none" />}
      {kind === 'life' && <line x1="11" y1="20" x2="11" y2="2" stroke={I} strokeWidth="1.1" strokeDasharray="1.4 2.4" />}
      {kind === 'meteor' && (<><path d="M2 18 Q 10 4 20 6" stroke="#d8b56d" strokeWidth="0.9" fill="none" strokeDasharray="1 2" /><circle cx="20" cy="6" r="2" fill="#fff4dc" /></>)}
    </svg>
  );
}

/** "explanation of signs", as printed in the corner of an atlas plate */
export function SignsLegend() {
  const select = useStore((s) => s.select);
  const byBranch = new Map<Branch, string>();
  for (const id of layout.index.children.get('pie') ?? []) {
    const b = langById.get(id)!.branch;
    const cur = byBranch.get(b);
    if (!cur || (layout.index.leaves.get(id) ?? 0) > (layout.index.leaves.get(cur) ?? 0)) byBranch.set(b, id);
  }
  return (
    <details className="signs">
      <summary>explanation of signs</summary>
      <div className="signs-body">
        <dl className="sign-list">
          <dt><Glyph kind="proto" /></dt><dd>reconstructed (<i>*</i>), never written down</dd>
          <dt><Glyph kind="living" /></dt><dd>spoken today</dd>
          <dt><Glyph kind="medieval" /></dt><dd>an earlier stage of a living line</dd>
          <dt><Glyph kind="dead" /></dt><dd>attested, now extinct (†)</dd>
          <dt><Glyph kind="rays" /></dt><dd>rays: noun cases</dd>
          <dt><Glyph kind="ring" /></dt><dd>ring: tone or pitch accent</dd>
          <dt><Glyph kind="orbit" /></dt><dd>orbiting dots: genders</dd>
          <dt><Glyph kind="line" /></dt><dd>line of descent</dd>
          <dt><Glyph kind="life" /></dt><dd>a language’s lifetime</dd>
          <dt><Glyph kind="meteor" /></dt><dd>a loanword in flight</dd>
        </dl>
        <div>
          <div className="sec-title" style={{ margin: '0 0 6px' }}>constellations · height is time</div>
          <div className="branch-list">
            {[...byBranch.entries()].map(([b, id]) => (
              <button key={b} className="branch-btn" onClick={() => select(id)}>
                <span className="swatch" style={{ ['--c' as string]: BRANCH_TINT[b] }} />
                {BRANCH_LABEL[b]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </details>
  );
}
