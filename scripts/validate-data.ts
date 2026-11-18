import { languages, words, unknownFormWords } from '../src/data/index';

const errors: string[] = [];
const warns: string[] = [];
const ids = new Map<string, number>();
for (const l of languages) ids.set(l.id, (ids.get(l.id) ?? 0) + 1);
for (const [id, n] of ids) if (n > 1) errors.push(`duplicate language id: ${id}`);
const byId = new Map(languages.map((l) => [l.id, l]));

for (const l of languages) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(l.id)) errors.push(`bad id: ${l.id}`);
  if (l.parent && !byId.has(l.parent)) errors.push(`${l.id}: parent ${l.parent} missing`);
  if (!l.parent && l.branch !== 'root' && l.branch !== 'contact') errors.push(`${l.id}: no parent`);
  const p = l.parent ? byId.get(l.parent) : undefined;
  if (p && l.start < p.start - l.startUncertainty) errors.push(`${l.id}: starts (${l.start}) before parent ${p.id} (${p.start})`);
  if (l.end !== null && l.end < l.start) errors.push(`${l.id}: end before start`);
  if (l.status === 'living' && l.end !== null) errors.push(`${l.id}: living but has end`);
  if (l.status !== 'living' && l.end === null && l.branch !== 'contact') errors.push(`${l.id}: not living but end null`);
  if (Math.abs(l.region.lat) > 90 || Math.abs(l.region.lon) > 180) errors.push(`${l.id}: bad coords`);
  for (const c of l.contacts ?? []) if (!byId.has(c)) warns.push(`${l.id}: contact ${c} not in data`);
  // cycles
  const seen = new Set<string>();
  let cur: string | null = l.id;
  while (cur) {
    if (seen.has(cur)) { errors.push(`${l.id}: cycle`); break; }
    seen.add(cur);
    cur = byId.get(cur)?.parent ?? null;
  }
}

const perLang = new Map<string, number>();
for (const w of words) {
  if (!byId.has(w.rootLang)) errors.push(`word ${w.id}: rootLang ${w.rootLang} missing`);
  for (const f of w.forms) {
    if (!byId.has(f.lang)) errors.push(`word ${w.id}: form lang ${f.lang} missing`);
    const star = f.form.startsWith('*');
    if (star && f.attested) errors.push(`word ${w.id} ${f.lang}: '*' form marked attested`);
    if (!star && !f.attested && w.kind === 'inherited' && byId.get(f.lang)?.status === 'proto')
      warns.push(`word ${w.id} ${f.lang}: proto form without '*'`);
    perLang.set(f.lang, (perLang.get(f.lang) ?? 0) + 1);
  }
  for (const b of w.borrowings) {
    if (!byId.has(b.from)) errors.push(`word ${w.id}: borrowing from ${b.from} missing`);
    if (!byId.has(b.to)) errors.push(`word ${w.id}: borrowing to ${b.to} missing`);
  }
  for (const s of w.soundChanges) {
    if (!byId.has(s.from) || !byId.has(s.to)) errors.push(`word ${w.id}: soundChange ${s.from}->${s.to} missing lang`);
  }
}
for (const l of languages) {
  const n = perLang.get(l.id) ?? 0;
  if ((l.status === 'living' || l.status === 'medieval') && l.branch !== 'contact' && n < 4)
    warns.push(`${l.id}: only ${n} word forms`);
}
for (const k of unknownFormWords) errors.push(`forms for unknown word id: ${k}`);

console.log(`languages: ${languages.length}, words: ${words.length}, forms: ${words.reduce((s, w) => s + w.forms.length, 0)}`);
for (const w of warns) console.log('warn  ' + w);
for (const e of errors) console.log('ERROR ' + e);
if (errors.length) process.exit(1);
console.log('ok');
