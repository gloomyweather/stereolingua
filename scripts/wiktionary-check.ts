// checks every word form against en.wiktionary (existence, language section, gloss).
// run: npm run wikicheck  -> scripts/reports/wiktionary-report.{json,md}
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { languages, words } from '../src/data/index';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'scripts/reports');
const UA = 'stereolingua-data-script/0.1';
const API = 'https://en.wiktionary.org/w/api.php';
const BATCH = 50;
const DELAY_MS = 700; // <= ~1.5 req/s

// ---------------------------------------------------------------- mappings (edit here)

/** our language id -> level-2 header name(s) on wiktionary (first = preferred; others accepted, noted). */
const HEADERS: Record<string, string[]> = {
  'chinese': ['Chinese', 'Mandarin', 'Cantonese'],
  'hokkien': ['Chinese', 'Min Nan', 'Hokkien'],
  'nahuatl': ['Classical Nahuatl', 'Nahuatl'],
  'middle-indo-aryan': ['Prakrit', 'Pali', 'Maharastri Prakrit', 'Sauraseni Prakrit', 'Magadhi Prakrit'],
  'hindustani': ['Hindi', 'Urdu'],
  'vedic-sanskrit': ['Sanskrit'],
  'classical-sanskrit': ['Sanskrit'],
  'kurdish': ['Kurdish', 'Northern Kurdish', 'Kurmanji'],
  'classical-armenian': ['Old Armenian', 'Armenian'],
  'ancient-greek': ['Ancient Greek'],
  'koine-greek': ['Ancient Greek'], // wiktionary has no separate Koine header
  'medieval-greek': ['Ancient Greek', 'Greek', 'Medieval Greek'], // AMBIGUOUS, see AMBIGUOUS below
  'greek': ['Greek'],
  'old-latin': ['Latin'],
  'vulgar-latin': ['Latin'],
  'norwegian': ['Norwegian Bokmål', 'Norwegian Nynorsk', 'Norwegian'],
  'ladino': ['Ladino'],
  'galician-portuguese': ['Galician-Portuguese', 'Old Galician-Portuguese'],
  'old-occitan': ['Old Occitan', 'Old Provençal'],
  'luwian': ['Luwian', 'Hieroglyphic Luwian', 'Cuneiform Luwian'],
  'low-german': ['Low German', 'German Low German'],
  'old-dutch': ['Old Dutch', 'Old Frankish'],
  'middle-persian': ['Middle Persian'],
  'persian': ['Persian'],
  'sinhala': ['Sinhalese', 'Sinhala'],
  'sardinian': ['Sardinian'],
  'serbo-croatian': ['Serbo-Croatian'],
  'primitive-irish': ['Primitive Irish'],
  // proto languages: header on reconstruction pages is the reconstruction language name (see RECON)
};

/** language ids whose mapping is ambiguous: flagged in the note of every matching form. */
const AMBIGUOUS: Record<string, string> = {
  'medieval-greek': 'ambiguous mapping: Byzantine Greek has no own wiktionary header (Ancient Greek vs Greek)',
  'koine-greek': 'mapped to Ancient Greek (no Koine header)',
  'hindustani': 'mapped to Hindi/Urdu',
  'hokkien': 'mapped to Chinese section; dialect not verified',
  'chinese': 'Chinese section; dialect not verified',
  'norwegian': 'Bokmål/Nynorsk variant not checked',
};

/** our language id -> wiktionary reconstruction language name (for '*' forms, and for proto-* ids in general). */
const RECON: Record<string, string> = {
  'pie': 'Proto-Indo-European',
  'proto-germanic': 'Proto-Germanic',
  'proto-slavic': 'Proto-Slavic',
  'proto-celtic': 'Proto-Celtic',
  'proto-italic': 'Proto-Italic',
  'proto-indo-iranian': 'Proto-Indo-Iranian',
  'proto-iranian': 'Proto-Iranian',
  'proto-hellenic': 'Proto-Hellenic',
  'proto-balto-slavic': 'Proto-Balto-Slavic',
  'proto-anatolian': 'Proto-Anatolian',
  'proto-tocharian': 'Proto-Tocharian',
  'proto-indo-aryan': 'Proto-Indo-Aryan',
  'proto-brittonic': 'Proto-Brittonic',
  'proto-norse': 'Proto-Norse', // per brief: may not be a reconstruction language; the plain page is tried too
};

/** languages that wiktionary titles without length marks / macrons (try diacritic-stripped candidates). */
// (stripped candidates are tried for every non-recon form anyway; matches via them are flagged in the note.)

// ---------------------------------------------------------------- helpers

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const langById = new Map(languages.map((l) => [l.id, l]));

function defaultHeaders(id: string): string[] {
  if (HEADERS[id]) return HEADERS[id];
  const name = langById.get(id)?.name ?? id;
  return [name.replace(/\s*\(.*?\)\s*/g, '').trim()];
}

function stripMarks(s: string): string {
  if (/\p{Script=Cyrillic}/u.test(s)) return s.normalize('NFD').replace(/́/g, '').normalize('NFC');
  // NFD minus combining marks; letters like þ ð æ ø have no decomposition so stay. devanagari etc. left alone.
  if (/\p{Script=Latin}|\p{Script=Greek}|\p{Script=Arabic}|\p{Script=Hebrew}/u.test(s)) {
    return s
      .normalize('NFD')
      .replace(/[̀-ًͯ-ְٰٟ-ׇ]/g, '')
      .normalize('NFC');
  }
  return s;
}

function cleanForm(raw: string): string {
  return raw
    .replace(/\(.*?\)/g, '')
    .replace(/[,;:.!?]+$/g, '')
    .trim();
}

type Kind = 'as-is' | 'lowercase' | 'stripped' | 'stripped-lowercase' | 'translit' | 'translit-stripped' | 'plain-page';
interface Cand {
  title: string;
  kind: Kind;
}

function badTitle(t: string) {
  return !t || /[|#<>\[\]{}_]/.test(t) || new TextEncoder().encode(t).length > 250;
}

function candidates(lang: string, rawForm: string, translit?: string): { cands: Cand[]; recon: boolean } {
  const out: Cand[] = [];
  const seen = new Set<string>();
  const add = (title: string, kind: Kind) => {
    title = title.trim();
    if (badTitle(title) || seen.has(title)) return;
    seen.add(title);
    out.push({ title, kind });
  };
  const form = cleanForm(rawForm);
  const isRecon = form.startsWith('*');
  if (isRecon) {
    const rl = RECON[lang];
    const bare = form.replace(/^\*+/, '');
    if (rl) {
      add(`Reconstruction:${rl}/${bare}`, 'as-is');
      add(`Reconstruction:${rl}/${bare.toLowerCase()}`, 'lowercase');
    }
    // plain page fallback for languages that are not recon languages (e.g. proto-norse runic forms)
    if (!rl || lang === 'proto-norse') {
      add(bare, 'plain-page');
      add(stripMarks(bare), 'plain-page');
    }
    return { cands: out, recon: true };
  }
  add(form, 'as-is');
  add(form.toLowerCase(), 'lowercase');
  const s = stripMarks(form);
  add(s, 'stripped');
  add(s.toLowerCase(), 'stripped-lowercase');
  if (translit) {
    const t = cleanForm(translit);
    add(t, 'translit');
    add(stripMarks(t).toLowerCase(), 'translit-stripped');
  }
  return { cands: out, recon: false };
}

// ---------------------------------------------------------------- api

interface PageInfo {
  exists: boolean;
  /** level-2 header -> definition lines */
  sections: Map<string, string[]>;
  hasContent: boolean;
}

function parsePage(content: string): Map<string, string[]> {
  const sections = new Map<string, string[]>();
  let cur: string | null = null;
  for (const line of content.split('\n')) {
    const m = /^==([^=].*?)==\s*$/.exec(line);
    if (m) {
      cur = m[1].trim();
      if (!sections.has(cur)) sections.set(cur, []);
      continue;
    }
    if (cur && /^#(?![:*;#])/.test(line)) sections.get(cur)!.push(line.replace(/^#\s*/, ''));
  }
  return sections;
}

async function apiGet(params: URLSearchParams): Promise<any> {
  const url = `${API}?${params}`;
  for (let attempt = 1; ; attempt++) {
    await sleep(DELAY_MS);
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, 'api-user-agent': UA, accept: 'application/json' } });
      if (res.status === 429 || res.status >= 500) {
        if (attempt >= 6) throw new Error(`http ${res.status}`);
        await sleep(Math.min(60000, 4000 * 2 ** attempt));
        continue;
      }
      if (!res.ok) throw new Error(`http ${res.status}`);
      return await res.json();
    } catch (e) {
      if (attempt >= 6) throw e;
      await sleep(Math.min(60000, 4000 * 2 ** attempt));
    }
  }
}

/** requested title -> info (resolved through normalisation + redirects). also returns resolved title. */
async function lookup(titles: string[]): Promise<Map<string, PageInfo & { finalTitle: string }>> {
  const result = new Map<string, PageInfo & { finalTitle: string }>();
  for (let i = 0; i < titles.length; i += BATCH) {
    const batch = titles.slice(i, i + BATCH);
    const pages = new Map<string, PageInfo>();
    const alias = new Map<string, string>(); // from -> to (normalised/redirects)
    let cont: Record<string, string> = {};
    for (;;) {
      const params = new URLSearchParams({
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        rvslots: 'main',
        format: 'json',
        formatversion: '2',
        redirects: '1',
        titles: batch.join('|'),
        ...cont,
      });
      const j = await apiGet(params);
      for (const n of j.query?.normalized ?? []) alias.set(n.from, n.to);
      for (const r of j.query?.redirects ?? []) alias.set(r.from, r.to);
      for (const p of j.query?.pages ?? []) {
        const prev = pages.get(p.title);
        const content: string | undefined = p.revisions?.[0]?.slots?.main?.content;
        if (content !== undefined) pages.set(p.title, { exists: true, sections: parsePage(content), hasContent: true });
        else if (!prev) pages.set(p.title, { exists: !(p.missing || p.invalid), sections: new Map(), hasContent: false });
      }
      if (j.continue) cont = j.continue;
      else break;
    }
    process.stdout.write(`  fetched ${Math.min(i + BATCH, titles.length)}/${titles.length} titles\n`);
    for (const t of batch) {
      let final = t;
      for (let k = 0; k < 5 && alias.has(final); k++) final = alias.get(final)!; // normalise, then redirects
      const p = pages.get(final);
      result.set(t, { ...(p ?? { exists: false, sections: new Map(), hasContent: false }), finalTitle: final });
    }
  }
  return result;
}

// ---------------------------------------------------------------- gloss check

const FORM_OF = /\{\{\s*(inflection of|infl of|form of|alternative (form|spelling|case form) of|alt (form|sp) of|[\w -]*(form|spelling|participle|plural|genitive|dative|accusative|case) of|[\w -]*misspelling of|obsolete (form|spelling) of|standard spelling of|romanization of|transliteration of|abbreviation of|synonym of)\b/i;

function glossCheck(defs: string[], gloss: string, title: string): boolean | 'unknown' {
  const g = gloss.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${g}(s|es)?\\b`, 'i');
  if (title.toLowerCase() === gloss.toLowerCase()) return true; // entry for the gloss word itself (english)
  if (!defs.length) return 'unknown';
  if (defs.some((d) => re.test(d))) return true;
  if (defs.every((d) => FORM_OF.test(d))) return 'unknown'; // inflected form: gloss lives on the lemma
  return false;
}

// ---------------------------------------------------------------- main

type Status = 'ok' | 'page-missing' | 'language-missing' | 'gloss-mismatch' | 'skipped';
interface Row {
  wordId: string;
  lang: string;
  langName: string;
  form: string;
  status: Status;
  matchedTitle: string | null;
  matchedBy: Kind | null;
  header: string | null;
  gloss_ok: boolean | 'unknown' | null;
  note: string;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  interface Job {
    wordId: string;
    gloss: string;
    lang: string;
    form: string;
    translit?: string;
    cands: Cand[];
    recon: boolean;
  }
  const jobs: Job[] = [];
  const rows: Row[] = [];
  const mk = (w: { id: string }, lang: string, form: string): Omit<Row, 'status' | 'note'> => ({
    wordId: w.id, lang, langName: langById.get(lang)?.name ?? lang, form,
    matchedTitle: null, matchedBy: null, header: null, gloss_ok: null,
  });
  // optional filters for checking a batch of new data: WIKI_LANGS=a,b WIKI_WORDS=x,y (report gets a -partial suffix)
  const onlyLangs = process.env.WIKI_LANGS?.split(',');
  const onlyWords = process.env.WIKI_WORDS?.split(',');
  for (const w of words) {
    if (onlyWords && !onlyWords.includes(w.id)) continue;
    for (const f of w.forms) {
      if (onlyLangs && !onlyLangs.includes(f.lang)) continue;
      const cleaned = cleanForm(f.form);
      if (!cleaned || cleaned === '*' || !langById.has(f.lang)) {
        rows.push({ ...mk(w, f.lang, f.form), status: 'skipped', note: !langById.has(f.lang) ? 'unknown language id' : 'empty form' });
        continue;
      }
      // "a/b" alternatives are separate forms for matching purposes
      const parts = cleaned.includes('/') && !cleaned.startsWith('*') ? cleaned.split('/') : [cleaned];
      const cands: Cand[] = [];
      let recon = false;
      for (const p of parts) {
        const c = candidates(f.lang, p, parts.length === 1 ? f.translit : undefined);
        recon ||= c.recon;
        for (const x of c.cands) if (!cands.some((y) => y.title === x.title)) cands.push(x);
      }
      if (!cands.length) {
        rows.push({ ...mk(w, f.lang, f.form), status: 'skipped', note: 'no usable title candidate' });
        continue;
      }
      jobs.push({ wordId: w.id, gloss: w.gloss, lang: f.lang, form: f.form, translit: f.translit, cands, recon });
    }
  }
  const allTitles = [...new Set(jobs.flatMap((j) => j.cands.map((c) => c.title)))];
  console.log(`${jobs.length} forms, ${allTitles.length} distinct titles`);
  const pages = await lookup(allTitles);

  for (const job of jobs) {
    const base = mk({ id: job.wordId }, job.lang, job.form);
    const headers = job.recon
      ? [RECON[job.lang] ?? defaultHeaders(job.lang)[0], ...(job.lang === 'proto-norse' ? ['Proto-Norse', 'Old Norse'] : [])]
      : defaultHeaders(job.lang);
    const notes: string[] = [];
    let existing = 0;
    type Match = { c: Cand; header: string; defs: string[]; final: string; implied: boolean };
    let match: Match | null = null;
    const matches: Match[] = [];
    for (const c of job.cands) {
      const p = pages.get(c.title)!;
      if (!p.exists) continue;
      existing++;
      let hit: { header: string; defs: string[]; implied: boolean } | null = null;
      for (const h of headers) {
        if (p.sections.has(h)) { hit = { header: h, defs: p.sections.get(h)!, implied: false }; break; }
      }
      // reconstruction pages: language is implied by the title even if the header is missing/odd
      if (!hit && job.recon && c.kind !== 'plain-page' && c.title.startsWith('Reconstruction:') && p.hasContent) {
        const first = [...p.sections.entries()][0];
        hit = { header: first?.[0] ?? headers[0], defs: first?.[1] ?? [], implied: true };
      }
      if (hit) matches.push({ c, ...hit, final: p.finalTitle });
    }
    // prefer first match whose gloss is ok, else first match
    for (const m of matches) {
      if (glossCheck(m.defs, job.gloss, m.final) === true) { match = m; break; }
    }
    match ??= matches[0] ?? null;

    if (!match) {
      const row: Row = existing
        ? { ...base, status: 'language-missing', note: `page(s) exist (${job.cands.filter((c) => pages.get(c.title)!.exists).map((c) => pages.get(c.title)!.finalTitle).join(', ')}) but no ==${headers.join('== / ==')}== section` }
        : { ...base, status: 'page-missing', note: `tried: ${job.cands.map((c) => c.title).join(' | ')}` };
      rows.push(row);
      continue;
    }
    const g = glossCheck(match.defs, job.gloss, match.final);
    if (match.c.kind !== 'as-is' && match.c.kind !== 'plain-page') notes.push(`matched via ${match.c.kind} candidate`);
    if (match.c.kind === 'plain-page') notes.push('matched plain (non-reconstruction) page');
    if (match.implied) notes.push('reconstruction page: language implied (no matching header)');
    if (match.header !== headers[0]) notes.push(`matched alternative header "${match.header}"`);
    if (AMBIGUOUS[job.lang]) notes.push(AMBIGUOUS[job.lang]);
    if (match.final !== match.c.title) notes.push(`redirect from ${match.c.title}`);
    if (g === 'unknown') notes.push('gloss unknown (inflected form, no definitions, or non-english-gloss)');
    if (g === false) notes.push(`gloss "${job.gloss}" not in definitions: ${match.defs.slice(0, 3).join(' / ').slice(0, 160)}`);
    rows.push({
      ...base,
      status: g === false ? 'gloss-mismatch' : 'ok',
      matchedTitle: match.final,
      matchedBy: match.c.kind,
      header: match.header,
      gloss_ok: g,
      note: notes.join('; '),
    });
  }

  rows.sort((a, b) => a.langName.localeCompare(b.langName) || a.wordId.localeCompare(b.wordId));
  const counts: Record<string, number> = {};
  const byLang: Record<string, Record<string, number>> = {};
  for (const r of rows) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
    (byLang[r.langName] ??= {})[r.status] = (byLang[r.langName][r.status] ?? 0) + 1;
  }
  const glossUnknown = rows.filter((r) => r.status === 'ok' && r.gloss_ok === 'unknown').length;
  const generated = new Date().toISOString();
  writeFileSync(
    resolve(OUT, `wiktionary-report${process.env.WIKI_LANGS || process.env.WIKI_WORDS ? '-partial' : ''}.json`),
    JSON.stringify({ generated, total: rows.length, counts, glossUnknownAmongOk: glossUnknown, byLang, results: rows }, null, 1),
  );

  const statuses: Status[] = ['ok', 'gloss-mismatch', 'language-missing', 'page-missing', 'skipped'];
  const md: string[] = [];
  md.push('# wiktionary check', '', `generated ${generated} · ${rows.length} forms`, '');
  md.push('| status | count |', '|---|---|');
  for (const s of statuses) md.push(`| ${s} | ${counts[s] ?? 0} |`);
  md.push('', `ok with gloss unknown: ${glossUnknown}`, '');
  md.push('## per language', '', '| language | ' + statuses.join(' | ') + ' |', '|---|' + statuses.map(() => '---').join('|') + '|');
  for (const [l, c] of Object.entries(byLang).sort()) md.push(`| ${l} | ${statuses.map((s) => c[s] ?? 0).join(' | ')} |`);
  md.push('', '## not ok, by language', '');
  const bad = rows.filter((r) => r.status !== 'ok');
  const groups = new Map<string, Row[]>();
  for (const r of bad) (groups.get(r.langName) ?? groups.set(r.langName, []).get(r.langName)!).push(r);
  for (const [l, list] of [...groups.entries()].sort()) {
    md.push(`### ${l} (${list.length})`, '');
    for (const r of list) {
      md.push(`- **${r.wordId}** \`${r.form}\` — ${r.status}${r.matchedTitle ? ` (${r.matchedTitle})` : ''}${r.note ? ` — ${r.note}` : ''}`);
    }
    md.push('');
  }
  writeFileSync(resolve(OUT, `wiktionary-report${process.env.WIKI_LANGS || process.env.WIKI_WORDS ? '-partial' : ''}.md`), md.join('\n'));
  console.log(JSON.stringify(counts), `gloss-unknown-among-ok=${glossUnknown}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
