import { languages, words } from '../data';
import type { Language, WordForm, WordSet } from '../data/types';

/* ------------------------------------------------------------------ folding */

const FOLD: Record<string, string> = {
  'ß': 'ss', 'æ': 'ae', 'œ': 'oe', 'þ': 'th', 'ð': 'd', 'ø': 'o', 'ł': 'l', 'đ': 'd', 'ı': 'i', 'ħ': 'h',
  'ʰ': 'h', 'ʷ': 'w', 'ʲ': 'j', 'ʼ': '', '’': '', "'": '',
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
};
const FOLD_RE = new RegExp(`[${Object.keys(FOLD).join('')}]`, 'g');

/** diacritic-insensitive, case-insensitive, punctuation-light form of a string */
export function fold(s: string): string {
  return s
    .toLowerCase()
    .replace(FOLD_RE, (c) => FOLD[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[*†?]/g, '')
    .replace(/[\-–—_/,.()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ------------------------------------------------------------------ scoring */

const EXACT = 100;
const PREFIX = 80;
const WORD_PREFIX = 60;
const SUBSTRING = 40;
const SUBSEQ = 15;

/** score one folded haystack against a folded query; 0 = no match */
function score(q: string, h: string): number {
  if (!h) return 0;
  if (h === q) return EXACT;
  if (h.startsWith(q)) return PREFIX - Math.min(10, (h.length - q.length) * 0.5);
  if (h.includes(' ' + q)) return WORD_PREFIX - Math.min(8, (h.length - q.length) * 0.3);
  // multi-token query: every token must prefix some word of h
  if (q.includes(' ')) {
    const hw = h.split(' ');
    const ok = q.split(' ').every((t) => hw.some((w) => w.startsWith(t)));
    if (ok) return WORD_PREFIX - 6;
  }
  if (h.includes(q)) return SUBSTRING - Math.min(8, (h.length - q.length) * 0.3);
  if (q.length >= 3 && !q.includes(' ')) {
    let j = 0;
    let first = -1;
    for (let i = 0; i < h.length && j < q.length; i++) {
      if (h[i] === q[j]) {
        if (first < 0) first = i;
        j++;
      }
    }
    if (j === q.length) {
      const span = h.lastIndexOf(q[q.length - 1]) - first + 1;
      // cheap span check: compact subsequences only
      if (span <= q.length * 2 + 1 || h.length <= q.length * 2 + 1) return SUBSEQ - Math.min(8, (h.length - q.length) * 0.5);
    }
  }
  return 0;
}

const best = (q: string, hs: (string | undefined)[], weights: number[] = []): number => {
  let b = 0;
  hs.forEach((h, i) => {
    if (!h) return;
    const s = score(q, fold(h)) * (weights[i] ?? 1);
    if (s > b) b = s;
  });
  return b;
};

/* ------------------------------------------------------------------ results */

export interface LanguageResult { kind: 'language'; id: string; score: number; language: Language }
export interface WordResult { kind: 'word'; id: string; score: number; word: WordSet }
export interface FormResult { kind: 'form'; id: string; score: number; wordId: string; langId: string; form: WordForm; word: WordSet; language: Language | undefined }
export type SearchResult = LanguageResult | WordResult | FormResult;

const langById = new Map(languages.map((l) => [l.id, l]));

function languageScore(q: string, l: Language): number {
  let s = best(q, [l.name, l.nativeName, l.nativeNameLatin, l.id], [1, 0.92, 0.92, 0.9]);
  if (l.iso) s = Math.max(s, score(q, fold(l.iso)) >= EXACT ? 90 : 0);
  if (l.glottocode) s = Math.max(s, score(q, fold(l.glottocode)) >= EXACT ? 88 : 0);
  if (!s) return 0;
  // a gentle nudge toward the languages people actually look for
  if (l.speakers) s += Math.min(3, Math.log10(1 + l.speakers) * 0.35);
  if (l.status === 'proto') s -= 0.5;
  return s;
}

export function searchAll(query: string, limit = 24): SearchResult[] {
  const q = fold(query);
  if (!q) return [];
  const out: SearchResult[] = [];

  for (const l of languages) {
    const s = languageScore(q, l);
    if (s > 0) out.push({ kind: 'language', id: l.id, score: s + 2, language: l });
  }

  for (const w of words) {
    const s = best(q, [w.gloss, w.id, w.root], [1, 0.9, 0.95]);
    if (s > 0) out.push({ kind: 'word', id: w.id, score: s + 1, word: w });
    for (const f of w.forms) {
      const fs = best(q, [f.form, f.translit], [1, 0.97]);
      if (fs > 0) {
        out.push({
          kind: 'form', id: `${w.id}:${f.lang}:${f.form}`, score: fs, wordId: w.id, langId: f.lang, form: f, word: w, language: langById.get(f.lang),
        });
      }
    }
  }

  const rank = (r: SearchResult) => (r.kind === 'language' ? 0 : r.kind === 'word' ? 1 : 2);
  const label = (r: SearchResult) => (r.kind === 'language' ? r.language.name : r.kind === 'word' ? r.word.gloss : r.form.form);
  out.sort((a, b) => b.score - a.score || rank(a) - rank(b) || label(a).length - label(b).length || label(a).localeCompare(label(b)));
  return out.slice(0, limit);
}
