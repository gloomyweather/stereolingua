import { create } from 'zustand';
import { YEAR_MAX, YEAR_MIN } from './lib/timeScale';

export type Phase = 'intro' | 'explore';
export type Quality = 'low' | 'medium' | 'high';
export type View = 'tree' | 'globe';
export type Overlay = null | 'index' | 'about' | 'outline';
export type Plate = 'night' | 'day';

interface State {
  phase: Phase;
  selected: string | null;
  previous: string | null;
  hovered: string | null;
  word: string | null;
  /** journey clock of the open word (year); animated imperatively */
  journeyYear: number;
  journeyPlaying: boolean;
  /** year horizon; YEAR_MAX means "everything visible" */
  year: number;
  timePlaying: boolean;
  flying: boolean;
  quality: Quality;
  view: View;
  /** 0 tree … 1 globe, animated imperatively */
  morph: number;
  overlay: Overlay;
  sound: boolean;
  /** growth of the tree during intro: y-cutoff year, animated imperatively */
  growYear: number;
  visited: string[];
  plate: Plate;
  setPlate: (p: Plate) => void;
  setPhase: (p: Phase) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setWord: (id: string | null) => void;
  replayJourney: () => void;
  setYear: (y: number) => void;
  setTimePlaying: (p: boolean) => void;
  setFlying: (f: boolean) => void;
  setQuality: (q: Quality) => void;
  setView: (v: View) => void;
  setOverlay: (o: Overlay) => void;
  setSound: (s: boolean) => void;
}

const mm = (q: string) => typeof window !== 'undefined' && !!window.matchMedia?.(q).matches;
const reduced = mm('(prefers-reduced-motion: reduce)');
const coarse = mm('(pointer: coarse)');

const VISITED_KEY = 'sl.visited';
function loadVisited(): string[] {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
function saveVisited(v: string[]) {
  try {
    localStorage.setItem(VISITED_KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable: progress lives for this visit only */
  }
}

const PLATE_KEY = 'sl.plate';
function initialPlate(): Plate {
  try {
    const saved = localStorage.getItem(PLATE_KEY);
    if (saved === 'day' || saved === 'night') return saved;
  } catch {
    /* storage unavailable */
  }
  // honour an explicit light choice made in the host; the night plate is the default otherwise
  if (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light') return 'day';
  return 'night';
}

export const useStore = create<State>((set, get) => ({
  phase: 'intro',
  selected: null,
  previous: null,
  hovered: null,
  word: null,
  journeyYear: YEAR_MIN,
  journeyPlaying: false,
  year: YEAR_MAX,
  timePlaying: false,
  flying: false,
  quality: coarse ? 'medium' : 'high',
  view: 'tree',
  morph: 0,
  overlay: null,
  sound: false,
  growYear: reduced ? YEAR_MAX : YEAR_MIN,
  visited: loadVisited(),
  plate: initialPlate(),
  setPlate: (plate) => {
    try {
      localStorage.setItem(PLATE_KEY, plate);
    } catch {
      /* storage unavailable */
    }
    set({ plate });
  },
  setPhase: (phase) => set({ phase }),
  select: (id) => {
    const s = get();
    if (id === s.selected) return;
    const patch: Partial<State> = { selected: id, previous: s.selected };
    if (id && !s.visited.includes(id)) {
      patch.visited = [...s.visited, id];
      saveVisited(patch.visited);
    }
    set(patch);
  },
  hover: (hovered) => set({ hovered }),
  setWord: (word) => {
    const s = get();
    // opening a word pauses the history playback: one clock at a time
    set({ word, journeyPlaying: !!word, journeyYear: YEAR_MIN, timePlaying: word ? false : s.timePlaying, year: word ? YEAR_MAX : s.year });
  },
  replayJourney: () => set({ journeyPlaying: true, journeyYear: YEAR_MIN }),
  setYear: (year) => set({ year }),
  setTimePlaying: (timePlaying) => set(timePlaying ? { timePlaying, word: null, journeyPlaying: false } : { timePlaying }),
  setFlying: (flying) => set({ flying }),
  setQuality: (quality) => set({ quality }),
  setView: (view) => set({ view }),
  setOverlay: (overlay) => set({ overlay }),
  setSound: (sound) => set({ sound }),
}));

export const prefersReducedMotion = reduced;
export const isCoarsePointer = coarse;
