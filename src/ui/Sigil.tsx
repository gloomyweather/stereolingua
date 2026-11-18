import type { Language } from '../data/types';
import { sigilParams } from '../scene/Stars';

const IVORY = '#ece3cc';

/** the star symbol as an engraved figure: status mark at the centre, grammar around it */
export function SigilSvg({ lang, color, size = 120 }: { lang: Language; color: string; size?: number }) {
  const p = sigilParams(lang);
  const proto = lang.status === 'proto';
  const dead = !proto && (lang.status === 'extinct' || lang.status === 'ancient');
  const rot = -Math.PI / 2;
  const rays = proto
    ? []
    : Array.from({ length: p.rays }, (_, i) => {
        const a = (i / p.rays) * Math.PI * 2 + rot;
        const len = 31 * (1 + p.asym * 0.32 * Math.cos(a - rot));
        return { x1: 50 + Math.cos(a) * 14, y1: 50 + Math.sin(a) * 14, x2: 50 + Math.cos(a) * (14 + len), y2: 50 + Math.sin(a) * (14 + len) };
      });
  const dash = p.morph === 3 ? '2.4 2.2' : undefined;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="sigil" role="img" aria-label={`star symbol of ${lang.name}`}>
      <circle cx="50" cy="50" r="48" fill="none" stroke={IVORY} strokeOpacity="0.12" strokeWidth="0.6" />
      {rays.map((r, i) => (
        <line key={i} {...r} stroke={color} strokeWidth="0.9" strokeLinecap="round" strokeDasharray={dash} />
      ))}
      {!proto && p.rings > 0 && <circle cx="50" cy="50" r="21" fill="none" stroke={color} strokeWidth="0.8" />}
      {!proto &&
        Array.from({ length: p.orbits }, (_, i) => {
          const a = (i / p.orbits) * Math.PI * 2 + 0.6;
          return <circle key={i} cx={50 + Math.cos(a) * 39} cy={50 + Math.sin(a) * 39} r="2.3" fill={color} />;
        })}
      {proto ? (
        <g stroke={IVORY} strokeWidth="2" strokeLinecap="round">
          {[0, 1, 2].map((i) => {
            const a = (i * Math.PI) / 3 + Math.PI / 2;
            return <line key={i} x1={50 - Math.cos(a) * 22} y1={50 - Math.sin(a) * 22} x2={50 + Math.cos(a) * 22} y2={50 + Math.sin(a) * 22} />;
          })}
        </g>
      ) : dead ? (
        <circle cx="50" cy="50" r="8" fill="none" stroke={IVORY} strokeWidth="2" />
      ) : (
        <>
          <circle cx="50" cy="50" r={lang.status === 'medieval' ? 6.5 : 9} fill={IVORY} />
          {lang.status === 'medieval' && <circle cx="50" cy="50" r="12.5" fill="none" stroke={IVORY} strokeWidth="0.9" />}
        </>
      )}
      {!proto && p.dual > 0 && <circle cx="65" cy="50" r="3.2" fill={IVORY} />}
    </svg>
  );
}

export function sigilReading(lang: Language): string[] {
  const p = sigilParams(lang);
  const f = lang.features;
  const out: string[] = [];
  if (lang.status === 'proto') {
    out.push('asterisk: reconstructed, never written down');
    return out;
  }
  out.push(f.cases === null ? 'no rays drawn: its cases are unknown' : f.cases === 0 ? 'no rays: nouns have no cases' : `${p.rays} rays: ${f.cases} noun cases`);
  if (f.genders === null) out.push('no orbiting dots: genders unknown');
  else if (p.orbits) out.push(`${p.orbits} orbiting dot${p.orbits > 1 ? 's' : ''}: ${f.genders} genders`);
  else out.push('no orbiting dots: no grammatical gender');
  if (p.rings) out.push('ring: tone or pitch accent');
  if (p.dual) out.push('twin core: a dual number');
  if (p.asym > 0.01) out.push(`lopsided rays: ${f.wordOrder === 'free' ? 'free word order' : `${f.wordOrder} word order`}`);
  if (f.morphology === 'agglutinative') out.push('beaded rays: words built from beads of suffixes');
  return out;
}
