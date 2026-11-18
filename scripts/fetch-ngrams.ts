// fetches google books ngram series for the word forms of 6 languages -> src/data/usage.json (+ usage-meta.json)
// run: npm run ngrams   (cache: scripts/.cache/ngram/)
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { words } from '../src/data/index';
import type { Usage } from '../src/data/types';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(ROOT, 'scripts/.cache/ngram');
const UA = 'stereolingua-data-script/0.1';
const SMOOTHING = 3;
const Y0 = 1600;
const Y1 = 2019;
const DELAY_MS = 1500;

const CORPORA: Record<string, string> = {
  english: 'en-2019',
  french: 'fr-2019',
  german: 'de-2019',
  russian: 'ru-2019',
  spanish: 'es-2019',
  italian: 'it-2019',
};

/** Russian case forms, added ONLY where certain. key: word id -> list of forms to sum (include the base form). */
const RU_VARIANTS: Record<string, string[]> = {
  mother: ['мать', 'матери', 'матерью'],
  father: ['отец', 'отца', 'отцу', 'отцом', 'отце'],
  brother: ['брат', 'брата', 'брату', 'братом', 'брате'],
  night: ['ночь', 'ночи', 'ночью'],
  heart: ['сердце', 'сердца', 'сердцу', 'сердцем', 'сердце'],
  star: ['звезда', 'звезды', 'звезде', 'звезду', 'звездой'],
  name: ['имя', 'имени', 'именем'],
  water: ['вода', 'воды', 'воде', 'воду', 'водой'],
  wolf: ['волк', 'волка', 'волку', 'волком', 'волке'],
  sugar: ['сахар', 'сахара', 'сахару', 'сахаром', 'сахаре'],
  orange: ['апельсин', 'апельсина', 'апельсину', 'апельсином', 'апельсине'],
  tea: ['чай', 'чая', 'чаю', 'чаем', 'чае'],
  chocolate: ['шоколад', 'шоколада', 'шоколаду', 'шоколадом', 'шоколаде'],
  robot: ['робот', 'робота', 'роботу', 'роботом', 'роботе'],
  algebra: ['алгебра', 'алгебры', 'алгебре', 'алгебру', 'алгеброй'],
};

/** forms whose note marks a secondary sense; a language's primary form avoids these when possible. */
const SECONDARY_NOTE = /digit|archaic|poetic|diminutive/i;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** split a form into clean query parts: handles "a/b", trailing notes "(…)", punctuation. */
function cleanForms(form: string): string[] {
  const out: string[] = [];
  for (const part of form.split('/')) {
    const p = part
      .replace(/\(.*?\)/g, '')
      .replace(/[,;:.!?]+$/g, '')
      .trim();
    if (p && !p.startsWith('*') && !out.includes(p)) out.push(p);
  }
  return out;
}

const sampleYears: number[] = [];
for (let y = 1600; y <= 2015; y += 5) sampleYears.push(y);
sampleYears.push(2019);

interface Fetched {
  ok: boolean;
  series?: number[];
  error?: string;
}

async function fetchNgram(forms: string[], corpus: string): Promise<Fetched> {
  const content = forms.join('+');
  const url =
    `https://books.google.com/ngrams/json?content=${encodeURIComponent(content)}` +
    `&year_start=${Y0}&year_end=${Y1}&corpus=${corpus}&smoothing=${SMOOTHING}&case_insensitive=true`;
  const key = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const file = resolve(CACHE, `${corpus}-${key}.json`);
  let body: unknown;
  if (existsSync(file)) {
    body = JSON.parse(readFileSync(file, 'utf8')).body;
  } else {
    let attempt = 0;
    for (;;) {
      attempt++;
      await sleep(DELAY_MS);
      try {
        const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
        if (res.status === 429 || res.status >= 500) {
          if (attempt >= 6) return { ok: false, error: `http ${res.status} after retries` };
          await sleep(Math.min(60000, 4000 * 2 ** attempt));
          continue;
        }
        const text = await res.text();
        try {
          body = JSON.parse(text);
        } catch {
          return { ok: false, error: `non-json response (http ${res.status})` };
        }
        break;
      } catch (e) {
        if (attempt >= 6) return { ok: false, error: `network: ${(e as Error).message}` };
        await sleep(Math.min(60000, 4000 * 2 ** attempt));
      }
    }
    writeFileSync(file, JSON.stringify({ url, body }));
  }
  if (!Array.isArray(body) || body.length === 0) return { ok: false, error: 'no ngram data returned' };
  type Entry = { type?: string; timeseries?: number[] };
  const entries = body as Entry[];
  // with case_insensitive the "(All)" entry is already the sum over case variants; EXPANSION entries are its parts.
  let chosen = entries.filter((e) => e.type === 'CASE_INSENSITIVE');
  if (!chosen.length) chosen = entries.filter((e) => e.type !== 'EXPANSION');
  if (!chosen.length) return { ok: false, error: 'no usable entry' };
  const len = Y1 - Y0 + 1;
  const sum = new Array<number>(len).fill(0);
  for (const e of chosen) {
    if (!e.timeseries || e.timeseries.length !== len) return { ok: false, error: 'unexpected series length' };
    e.timeseries.forEach((v, i) => (sum[i] += v));
  }
  return { ok: true, series: sum };
}

async function main() {
  mkdirSync(CACHE, { recursive: true });
  const usage: Usage = {};
  const peaks: Record<string, Record<string, number>> = {};
  const failures: string[] = [];
  let fetched = 0;
  // one primary form per (word, language): first form whose note is not a secondary sense, else the first form.
  const primaryOf = (list: (typeof words)[number]['forms']) =>
    list.find((g) => !SECONDARY_NOTE.test(g.note ?? '')) ?? list[0];
  const primaries = words.map((w) => {
    const byLang = new Map<string, (typeof w.forms)[number][]>();
    for (const f of w.forms) {
      if (!(f.lang in CORPORA)) continue;
      byLang.set(f.lang, [...(byLang.get(f.lang) ?? []), f]);
    }
    return { w, forms: [...byLang.values()].map(primaryOf) };
  });
  const total = primaries.reduce((n, p) => n + p.forms.length, 0);
  let i = 0;
  for (const { w, forms: picked } of primaries) {
    for (const f of picked) {
      const corpus = CORPORA[f.lang];
      if (!corpus) continue;
      i++;
      let forms = cleanForms(f.form);
      if (!forms.length) {
        failures.push(`${w.id}/${f.lang}: no usable form (${f.form})`);
        continue;
      }
      let note: string | undefined;
      if (f.lang === 'russian' && RU_VARIANTS[w.id] && RU_VARIANTS[w.id][0] === forms[0]) {
        forms = [...new Set(RU_VARIANTS[w.id])];
        note = 'summed over case forms';
      }
      if (/not cognate/i.test(f.note ?? '')) {
        note = [note, 'word for the concept, not a cognate'].filter(Boolean).join('; ');
      }
      const r = await fetchNgram(forms, corpus);
      process.stdout.write(`[${i}/${total}] ${w.id}/${f.lang} ${forms.join('+')} ${r.ok ? 'ok' : 'FAIL ' + r.error}\n`);
      if (!r.ok || !r.series) {
        failures.push(`${w.id}/${f.lang} (${forms.join('+')}): ${r.error}`);
        continue;
      }
      const peak = Math.max(...r.series);
      if (!(peak > 0)) {
        failures.push(`${w.id}/${f.lang} (${forms.join('+')}): all zero`);
        continue;
      }
      fetched++;
      const points = sampleYears.map((y) => ({
        year: y,
        value: Math.round((r.series![y - Y0] / peak) * 100) / 100,
      }));
      (usage[w.id] ??= {})[f.lang] = { forms, points, source: 'ngram', ...(note ? { note } : {}) };
      (peaks[w.id] ??= {})[f.lang] = Number(peak.toPrecision(4));
    }
  }
  const out = resolve(ROOT, 'src/data/usage.json');
  const json = JSON.stringify(usage);
  writeFileSync(out, json);
  writeFileSync(
    resolve(ROOT, 'src/data/usage-meta.json'),
    JSON.stringify(
      { generated: new Date().toISOString(), corpora: CORPORA, smoothing: SMOOTHING, peaks }, null, 1),
  );
  console.log(`\nseries written: ${fetched}, failed: ${failures.length}, usage.json ${(json.length / 1024).toFixed(1)} KB`);
  for (const f of failures) console.log('  FAIL ' + f);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
