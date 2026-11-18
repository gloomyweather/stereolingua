import { useEffect, useRef, useState } from 'react';
import { MARK } from './logoGeometry';
import { useStore, prefersReducedMotion } from '../store';
import { YEAR_MIN, YEAR_MAX } from '../lib/timeScale';

const KEY = 'sl.introSeen';
const seenBefore = (() => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
})();

/**
 * the title plate. phases (first visit ≈ 7 s, later ≈ 2.6 s, reduced motion ≈ static):
 * 0 a plate frame is engraved, a root point lights · 1 the device grows 1 → 3 → 9 as a stereo pair
 * 2 the pair converges into ivory; title, subtitle and Jones's sentence of 1786 appear
 * 3 the plate dissolves while the real sky grows from the root · 4 done
 */
export function IntroOverlay() {
  const setPhase = useStore((s) => s.setPhase);
  const [phase, setP] = useState(0);
  const [gone, setGone] = useState(false);
  // ?intro=slow plays the plate at quarter speed (for checking the animation frame by frame)
  const slow = typeof location !== 'undefined' && /[?&]intro=slow/.test(location.search);
  const speed = slow ? 0.25 : prefersReducedMotion ? 6 : seenBefore ? 2.7 : 1;
  const timers = useRef<number[]>([]);
  const raf = useRef(0);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    useStore.setState({ growYear: YEAR_MAX });
    setPhase('explore');
    setP(4);
    timers.current.push(window.setTimeout(() => setGone(true), 1000));
    try {
      localStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable */
    }
  };

  const grow = (dur: number) => {
    const t0 = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / dur);
      const e = 1 - Math.pow(1 - t, 2.4);
      useStore.setState({ growYear: YEAR_MIN + (YEAR_MAX - YEAR_MIN) * e });
      if (t < 1) raf.current = requestAnimationFrame(step);
      else finish();
    };
    raf.current = requestAnimationFrame(step);
  };

  const skip = () => {
    if (done.current) return;
    timers.current.forEach(clearTimeout);
    cancelAnimationFrame(raf.current);
    finish();
  };

  useEffect(() => {
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms / speed));
    at(500, () => setP(1));
    at(2000, () => setP(2));
    at(4700, () => {
      setP(3);
      grow(prefersReducedMotion ? 10 : 2800 / Math.min(speed, 1.6));
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || done.current) return;
      // the key that skips the plate must not also act on the sky (space would start playback)
      e.preventDefault();
      e.stopImmediatePropagation();
      skip();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      timers.current.forEach(clearTimeout);
      cancelAnimationFrame(raf.current);
      window.removeEventListener('keydown', onKey, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [dims, setDims] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }));
  useEffect(() => {
    const on = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);

  if (gone) return null;
  const inset = Math.max(18, Math.min(dims.w, dims.h) * 0.03);
  const fw = Math.max(10, dims.w - inset * 2);
  const fh = Math.max(10, dims.h - inset * 2);
  const letters = 'Stereolingua'.split('');
  return (
    <div className={`intro intro-p${phase}`} style={{ ['--speed' as string]: String(speed) }} onClick={skip} role="presentation">
      <svg className="plate-frame" width={fw} height={fh} viewBox={`0 0 ${fw} ${fh}`} style={{ inset: 'auto', left: inset, top: inset }} aria-hidden="true">
        <rect className="outer" x={0.5} y={0.5} width={fw - 1} height={fh - 1} pathLength={4000} />
        <rect className="inner" x={6.5} y={6.5} width={fw - 13} height={fh - 13} pathLength={4000} />
      </svg>
      <div className="intro-stage">
        <svg className="intro-mark" viewBox="0 0 100 100" aria-hidden="true">
          {(['l', 'r', 'w'] as const).map((k) => (
            <g key={k} className={`im im-${k}`} fill="none" strokeLinecap="round">
              {MARK.strokes.map((s, i) => (
                <path
                  key={i}
                  d={s.d}
                  strokeWidth={s.level === 0 ? 2.4 : s.level === 1 ? 1.9 : 1.45}
                  style={{ strokeDasharray: s.len, strokeDashoffset: s.len, ['--lv' as string]: s.level }}
                />
              ))}
            </g>
          ))}
          {MARK.forks.map((t, i) => (
            <circle key={'f' + i} cx={t.x} cy={t.y} r={1.5} className="im-fork" style={{ ['--i' as string]: i }} />
          ))}
          {MARK.tips.map((t, i) => (
            <circle key={'t' + i} cx={t.x} cy={t.y} r={1.9} className="im-tip" style={{ ['--i' as string]: i }} />
          ))}
          <circle cx={MARK.root.x} cy={MARK.root.y} r={2.3} className="im-root" />
        </svg>
        <h1 className="intro-word" aria-label="Stereolingua">
          {letters.map((c, i) => (
            <span key={i} style={{ ['--i' as string]: i }}>
              {c}
            </span>
          ))}
        </h1>
        <div className="intro-tag">an atlas of the Indo-European sky</div>
        <blockquote className="intro-quote">
          “…no philologer could examine them all three, without believing them to have sprung from some common source, which,
          perhaps, no longer exists.”
          <cite>Sir William Jones · Calcutta · 1786</cite>
        </blockquote>
      </div>
      <div className="intro-skip">click or press any key</div>
    </div>
  );
}
