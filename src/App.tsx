import { Component, useEffect, useMemo, type ReactNode } from 'react';
import { Scene } from './scene/Scene';
import { IntroOverlay } from './ui/IntroOverlay';
import { TopBar } from './ui/TopBar';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { LanguagePanel } from './ui/LanguagePanel';
import { WordPanel } from './ui/WordPanel';
import { SignsLegend } from './ui/SignsLegend';
import { TimeScale } from './ui/TimeScale';
import { HoverCard } from './ui/HoverCard';
import { Discovery } from './ui/Discovery';
import { Hints } from './ui/Hints';
import { Chronicle } from './ui/Chronicle';
import { IndexOverlay, useIndexShortcut } from './ui/IndexOverlay';
import { OutlineView } from './ui/OutlineView';
import { AboutOverlay } from './ui/AboutOverlay';
import { useStore } from './store';
import { layout, langById } from './scene/model';
import { siblings } from './lib/tree';
import { applyHash, startHashSync } from './lib/hashRouter';
import { soundOn, soundOff, hoverNote, bell, hush } from './audio/ambient';
import { hashString } from './lib/hash';
import { YEAR_MAX, YEAR_MIN } from './lib/timeScale';

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ children: ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onFail();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      if (s.phase !== 'explore') return;
      const t = e.target as HTMLElement | null;
      if (t?.closest('input, textarea, select, [role="slider"]')) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        if (s.overlay) s.setOverlay(null);
        else if (s.word) s.setWord(null);
        else if (s.selected) s.select(null);
        return;
      }
      if (s.overlay) return;
      if (e.key === 'g' || e.key === 'G') {
        s.setView(s.view === 'globe' ? 'tree' : 'globe');
        return;
      }
      if (e.key === ' ') {
        if (t?.closest('button, a, summary')) return;
        e.preventDefault();
        if (s.timePlaying) s.setTimePlaying(false);
        else {
          if (s.year >= 2000) s.setYear(YEAR_MIN);
          s.setTimePlaying(true);
        }
        return;
      }
      const sel = s.selected;
      if (!sel) {
        if (e.key.startsWith('Arrow')) {
          s.select('pie');
          e.preventDefault();
        }
        return;
      }
      const idx = layout.index;
      if (e.key === 'ArrowUp') {
        const ch = idx.children.get(sel) ?? [];
        if (ch.length) s.select([...ch].sort((a, b) => (idx.leaves.get(b) ?? 0) - (idx.leaves.get(a) ?? 0))[0]);
      } else if (e.key === 'ArrowDown') {
        const p = langById.get(sel)?.parent;
        if (p) s.select(p);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const sib = siblings(idx, sel);
        const i = sib.indexOf(sel);
        s.select(sib[(i + (e.key === 'ArrowRight' ? 1 : -1) + sib.length) % sib.length]);
      } else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function useSound() {
  useEffect(
    () =>
      useStore.subscribe((s, p) => {
        if (s.sound !== p.sound) (s.sound ? soundOn : soundOff)();
        if (!s.sound) return;
        if (s.hovered && s.hovered !== p.hovered) {
          const l = langById.get(s.hovered);
          if (l) hoverNote(l.branch, hashString(l.id));
        }
        if (s.selected && s.selected !== p.selected) {
          const l = langById.get(s.selected);
          if (l) bell(l.branch);
        }
        if (s.word && s.word !== p.word) hush();
      }),
    [],
  );
}

export default function App() {
  useKeyboard();
  useSound();
  useIndexShortcut();
  const phase = useStore((s) => s.phase);
  const word = useStore((s) => s.word);
  const selected = useStore((s) => s.selected);
  const overlay = useStore((s) => s.overlay);
  const gl = useMemo(webglAvailable, []);

  // deep links: apply once the title plate has gone, then keep the fragment in step
  useEffect(() => {
    startHashSync();
  }, []);
  useEffect(() => {
    if (phase === 'explore') applyHash();
  }, [phase]);

  // without webgl the atlas still works as a catalogue
  useEffect(() => {
    if (!gl) {
      useStore.setState({ phase: 'explore', growYear: YEAR_MAX, overlay: 'outline' });
    }
  }, [gl]);

  return (
    <div className={`app phase-${phase} ${selected || word ? 'has-card' : ''} ${gl ? '' : 'no-gl'}`}>
      {gl && (
        <SceneBoundary onFail={() => useStore.setState({ overlay: 'outline' })}>
          <Scene />
        </SceneBoundary>
      )}
      <div id="labels" className="labels" aria-hidden="true" />
      <div className="ui">
        <TopBar />
        <Breadcrumbs />
        {word ? <WordPanel /> : <LanguagePanel />}
        <HoverCard />
        <Hints />
        <SignsLegend />
        <TimeScale />
        <Discovery />
        <Chronicle />
      </div>
      {overlay === 'index' && <IndexOverlay />}
      {overlay === 'outline' && <OutlineView />}
      {overlay === 'about' && <AboutOverlay />}
      {!gl && (
        <p className="nogl-note" role="note">
          This browser could not start WebGL, so the sky is shown as a list. Everything else works.
        </p>
      )}
      {gl && <IntroOverlay />}
    </div>
  );
}
