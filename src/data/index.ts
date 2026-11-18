import type { Language, WordSet, WordForm } from './types';
import type { FormsByWord } from './forms/index';
import { wordMeta } from './words/index';

const langModules = import.meta.glob<{ default: Language[] }>('./languages/*.ts', { eager: true });
const formModules = import.meta.glob<{ default: FormsByWord }>('./forms/*.ts', { eager: true });

export const languages: Language[] = Object.values(langModules).flatMap((m) => m.default);

const allForms: Record<string, WordForm[]> = {};
for (const [path, m] of Object.entries(formModules)) {
  if (path.endsWith('/index.ts')) continue;
  for (const [word, list] of Object.entries(m.default ?? {})) {
    (allForms[word] ??= []).push(...list);
  }
}

export const words: WordSet[] = wordMeta.map((m) => ({ ...m, forms: allForms[m.id] ?? [] }));

/** forms keyed by language id -> [{word, form}] for the language panel */
export const formsByLang: Map<string, { word: WordSet; form: WordForm }[]> = new Map();
for (const w of words)
  for (const f of w.forms) {
    const arr = formsByLang.get(f.lang) ?? [];
    arr.push({ word: w, form: f });
    formsByLang.set(f.lang, arr);
  }

export const unknownFormWords = Object.keys(allForms).filter((k) => !wordMeta.some((m) => m.id === k));
