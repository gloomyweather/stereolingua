import { useStore } from '../store';
import { languages, words } from '../data';

/**
 * deep links with plain fragment names (the only form an artifact link passes on):
 * #english opens a language, #w-night opens a word, #globe folds the sky.
 */
const langIds = new Set(languages.map((l) => l.id));
const wordIds = new Set(words.map((w) => w.id));

export function applyHash(hash = location.hash) {
  const h = decodeURIComponent(hash.replace(/^#/, ''));
  if (!h) return;
  const s = useStore.getState();
  if (h === 'globe') s.setView('globe');
  else if (h.startsWith('w-') && wordIds.has(h.slice(2))) s.setWord(h.slice(2));
  else if (langIds.has(h)) s.select(h);
}

export function startHashSync() {
  let writing = false;
  useStore.subscribe((s, p) => {
    if (s.selected === p.selected && s.word === p.word) return;
    const next = s.word ? `#w-${s.word}` : s.selected ? `#${s.selected}` : '';
    if (location.hash === next) return;
    writing = true;
    try {
      history.replaceState(null, '', next || location.pathname + location.search);
    } catch {
      /* some frames refuse; links still work on load */
    }
    writing = false;
  });
  window.addEventListener('hashchange', () => {
    if (!writing) applyHash();
  });
}
