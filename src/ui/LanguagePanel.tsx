import { useMemo } from 'react';
import { useStore } from '../store';
import { langById, layout, designation } from '../scene/model';
import { formsByLang } from '../data';
import { BRANCH_TINT, BRANCH_LABEL } from '../lib/palette';
import { formatYear } from '../lib/timeScale';
import { SigilSvg, sigilReading } from './Sigil';
import { labelText } from '../scene/Labels';
import { isExtinct } from '../lib/status';

const STATUS_LABEL = {
  proto: 'reconstructed',
  ancient: 'ancient, attested',
  medieval: 'medieval stage',
  living: 'spoken today',
  extinct: 'extinct',
} as const;

function fmtSpeakers(n?: number) {
  if (!n) return null;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} billion`;
  if (n >= 1e6) return `${Math.round(n / 1e6)} million`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} thousand`;
  return String(n);
}

function featureMarks(f: import('../data/types').Features): string[] {
  const out: string[] = [];
  if (f.cases !== null) out.push(f.cases === 0 ? 'no noun cases' : `${f.cases} cases`);
  if (f.genders !== null) out.push(f.genders === 0 ? 'no gender' : `${f.genders} genders`);
  if (f.wordOrder !== 'unknown') out.push(f.wordOrder === 'free' ? 'free word order' : f.wordOrder === 'V2' ? 'verb-second' : f.wordOrder);
  out.push(f.morphology);
  if (f.tonal) out.push('tone / pitch accent');
  if (f.dual) out.push('dual number');
  if (f.articles) out.push('articles');
  return out;
}

/** the catalogue card: an entry in the atlas's catalogue, set like an etymological dictionary */
export function LanguagePanel() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  const word = useStore((s) => s.word);
  const setWord = useStore((s) => s.setWord);
  const lang = selected ? langById.get(selected) : null;

  const forms = useMemo(() => {
    if (!selected) return [];
    const list = formsByLang.get(selected) ?? [];
    const seen = new Set<string>();
    const out = [];
    for (const kind of ['inherited', 'wanderer'] as const)
      for (const x of list)
        if (x.word.kind === kind && !seen.has(x.word.id)) {
          seen.add(x.word.id);
          out.push(x);
        }
    return out;
  }, [selected]);

  if (!lang) return null;
  const tint = BRANCH_TINT[lang.branch];
  const approx = lang.startUncertainty > 0 || lang.status === 'proto';
  const children = layout.index.children.get(lang.id) ?? [];
  const parent = lang.parent ? langById.get(lang.parent) : null;
  const dead = isExtinct(lang);
  const contacts = (lang.contacts ?? []).filter((c) => langById.has(c));

  return (
    <aside className="card" key={lang.id} aria-label={`${lang.name}: catalogue entry`}>
      <button className="card-close" onClick={() => select(null)} aria-label="Close">×</button>
      <div className="card-eyebrow">
        <span className="desig">{designation.get(lang.id)}</span>
        <span>
          <span className="swatch" style={{ ['--c' as string]: tint }} /> {BRANCH_LABEL[lang.branch]}
        </span>
        <span>{STATUS_LABEL[lang.status]}</span>
      </div>
      <h1 className="card-title">
        {dead && <span className="dagger">†</span>}
        {lang.status === 'proto' ? <i>{lang.name}</i> : lang.name}
      </h1>
      {lang.nativeName && lang.nativeName !== lang.name && (
        <div className="card-sub" dir="auto">
          {lang.nativeName}
          {lang.nativeNameLatin && <span className="muted"> · {lang.nativeNameLatin}</span>}
        </div>
      )}

      <div className="asterism" aria-hidden="true">⁂</div>

      <dl className="facts">
        <dt>epoch</dt>
        <dd>
          {formatYear(lang.start, approx)}
          {lang.startUncertainty > 0 && <span className="muted"> ± {lang.startUncertainty}</span>}
          {' – '}
          {lang.end === null ? 'today' : formatYear(lang.end, true)}
        </dd>
        <dt>region</dt>
        <dd>{lang.region.label}</dd>
        {lang.speakers ? (
          <>
            <dt>speakers</dt>
            <dd>{fmtSpeakers(lang.speakers)}</dd>
          </>
        ) : null}
        <dt>script</dt>
        <dd>{lang.script}</dd>
        {(lang.iso || lang.glottocode) && (
          <>
            <dt>catalogue</dt>
            <dd className="muted">
              {lang.iso && <>ISO {lang.iso}</>}
              {lang.iso && lang.glottocode && ' · '}
              {lang.glottocode && <>Glottolog {lang.glottocode}</>}
            </dd>
          </>
        )}
      </dl>

      <p className="prose" style={{ marginTop: 16 }}>{lang.summary}</p>
      {lang.contested && (
        <p className="contested">
          <span className="rubric">contested</span>
          {lang.contested}
        </p>
      )}

      {forms.length === 0 && (
        <section>
          <h2 className="sec-title">lexicon</h2>
          <p className="prose muted lex-empty">
            No forms of the atlas’s words are recorded for {lang.status === 'proto' ? 'this reconstruction' : 'this stage'}
            {children.length > 0 ? ', but they can be followed in its daughters:' : '.'}
          </p>
          {children.length > 0 && (
            <div className="kin">
              {children.map((c) => (
                <button key={c} className={`btn-line ${langById.get(c)?.status === 'proto' ? 'is-proto' : ''}`} onClick={() => select(c)}>
                  {labelText(c)}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {forms.length > 0 && (
        <section>
          <h2 className="sec-title">
            lexicon <small>tap a word to follow its journey</small>
          </h2>
          <ul className="lex">
            {forms.map(({ word: w, form }) => {
              const nc = form.note && /not cognate/i.test(form.note);
              return (
                <li key={w.id}>
                  <button className={`lex-row ${word === w.id ? 'is-on' : ''}`} onClick={() => setWord(word === w.id ? null : w.id)} aria-pressed={word === w.id}>
                    <span className="lex-form" dir="auto">{form.form}</span>
                    <span className="lex-gloss">{w.gloss}</span>
                    {(form.translit || form.ipa || nc || (form.note && !nc)) && (
                      <span className="lex-meta">
                        {form.translit && <span className="tr">{form.translit}</span>}
                        {form.ipa && <span className="ipa">/{form.ipa.replace(/^\/|\/$/g, '')}/</span>}
                        {nc && <span className="nc">not cognate</span>}
                        {form.note && !nc && <span>{form.note}</span>}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <h2 className="sec-title">grammar, as drawn in its star</h2>
        <div className="sigil-row">
          <SigilSvg lang={lang} color={tint} size={92} />
          <ul className="sigil-read">
            {sigilReading(lang).map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="marks" style={{ marginTop: 10 }}>
          {featureMarks(lang.features).map((m) => (
            <span key={m}>{m}</span>
          ))}
          {lang.features.notes.map((n) => (
            <span key={n}>{n}</span>
          ))}
        </div>
      </section>

      {lang.funFact && (
        <section>
          <h2 className="sec-title">nota bene</h2>
          <p className="note">{lang.funFact}</p>
        </section>
      )}

      {(parent || children.length > 0 || contacts.length > 0) && (
        <section>
          <h2 className="sec-title">kin</h2>
          <dl className="facts">
            {parent && (
              <>
                <dt>from</dt>
                <dd className="kin">
                  <button className={`btn-line ${parent.status === 'proto' ? 'is-proto' : ''}`} onClick={() => select(parent.id)}>
                    {labelText(parent.id)}
                  </button>
                </dd>
              </>
            )}
            {children.length > 0 && (
              <>
                <dt>gave</dt>
                <dd className="kin">
                  {children.map((c) => (
                    <button key={c} className={`btn-line ${langById.get(c)?.status === 'proto' ? 'is-proto' : ''}`} onClick={() => select(c)}>
                      {labelText(c)}
                    </button>
                  ))}
                </dd>
              </>
            )}
            {contacts.length > 0 && (
              <>
                <dt>borrowed from</dt>
                <dd className="kin">
                  {contacts.map((c) => (
                    <button key={c} className="btn-line" onClick={() => select(c)}>
                      {labelText(c)}
                    </button>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </section>
      )}

      <footer className="sources">
        <em>sources</em> {lang.sources.join(' · ')}
      </footer>
    </aside>
  );
}
