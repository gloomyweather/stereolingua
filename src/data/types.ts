/**
 * data contract for stereolingua.
 * years: integers, negative = bce (e.g. -4500 = 4500 bce). no year 0 semantics needed.
 */

export type Status =
  | 'proto' // reconstructed ancestor, never written (proto-indo-european, proto-germanic)
  | 'ancient' // attested, extinct before ~500 ce, or ancient stage of a living lineage
  | 'medieval' // attested medieval stage (old english, old church slavonic, middle persian)
  | 'living' // spoken today
  | 'extinct'; // attested language that died without (living) descendants, post-antiquity

/** major branch key — drives colour and grouping. */
export type Branch =
  | 'root'
  | 'anatolian'
  | 'tocharian'
  | 'indo-iranian'
  | 'greek'
  | 'armenian'
  | 'albanian'
  | 'italic'
  | 'celtic'
  | 'germanic'
  | 'balto-slavic'
  | 'paleo-balkan'
  | 'contact'; // non-indo-european source languages for borrowings (outer ring)

export type WordOrder = 'SOV' | 'SVO' | 'VSO' | 'VOS' | 'free' | 'V2' | 'unknown';
export type Morphology = 'isolating' | 'analytic' | 'fusional' | 'agglutinative' | 'mixed';

export interface Features {
  /** number of grammatical cases in nouns (0 = none). null = unknown/unreconstructable */
  cases: number | null;
  /** number of grammatical genders (0 = none) */
  genders: number | null;
  wordOrder: WordOrder;
  morphology: Morphology;
  /** has lexical tone or pitch accent contrast */
  tonal: boolean;
  /** has grammatical dual number */
  dual: boolean;
  /** has definite article */
  articles: boolean;
  /** free-form notable traits, shown as chips, each <= 40 chars */
  notes: string[];
}

export interface Language {
  id: string; // kebab-case, unique, stable (used in urls)
  name: string; // english name
  nativeName?: string; // endonym in native script
  nativeNameLatin?: string; // romanisation of endonym if non-latin
  parent: string | null; // null only for the root (and contact languages)
  branch: Branch;
  /** strong non-genetic influences: ids of languages this one borrowed heavily from */
  contacts?: string[];
  start: number; // approx year the variety emerges as distinct
  end: number | null; // null = still spoken
  /** +- years of uncertainty on start */
  startUncertainty: number;
  status: Status;
  region: { lat: number; lon: number; label: string };
  /** native speakers, living languages only */
  speakers?: number;
  script: string; // e.g. "Latin", "Cyrillic", "Devanagari", "none (reconstructed)"
  summary: string; // 2–3 sentences, plain english
  features: Features;
  funFact?: string;
  iso?: string; // iso 639-3
  glottocode?: string;
  /** set when placement/grouping is disputed */
  contested?: string;
  sources: string[];
}

export interface WordForm {
  lang: string; // language id
  form: string; // in native script; reconstructions start with '*'
  translit?: string; // latin transliteration if form is non-latin
  ipa?: string;
  /** false for reconstructed forms */
  attested: boolean;
  /** meaning if it drifted from the gloss, or other note */
  note?: string;
}

export interface Borrowing {
  from: string; // language id (can be a contact language)
  to: string;
  year: number; // approx year of borrowing
  form: string; // the form as it entered `to`
  note?: string;
}

export interface SoundChange {
  from: string; // language id
  to: string; // language id
  rule: string; // short label, e.g. "grimm's law: *k → h"
}

export interface WordSet {
  id: string; // kebab-case
  gloss: string; // english meaning
  kind: 'inherited' | 'wanderer';
  root: string; // e.g. "*nókʷts"
  rootLang: string; // language id where the journey starts
  blurb: string; // 1–2 sentences on the story of the word
  forms: WordForm[];
  borrowings: Borrowing[];
  soundChanges: SoundChange[];
  sources: string[];
}

export interface UsageSeries {
  forms: string[];
  points: { year: number; value: number }[]; // value normalised 0..1 to peak within language
  source: 'ngram' | 'estimate';
  note?: string;
}

export type Usage = Record<string, Record<string, UsageSeries>>; // wordId -> langId -> series

export interface HistEvent {
  year: number;
  label: string; // <= 60 chars
  detail?: string;
  langs?: string[]; // related languages
}
