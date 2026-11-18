import { useCallback, useRef } from 'react';
import { useStore } from '../store';
import { yearToY, yToYear, HEIGHT, YEAR_MIN, YEAR_MAX, formatYear } from '../lib/timeScale';
import { events } from '../data/events';

const MAJOR = [-4000, -3000, -2000, -1000, 0, 500, 1000, 1500, 2000];
const MINOR = [-3500, -2500, -1500, -500, 250, 750, 1250, 1750];

/** fraction from the bottom of the scale: the same nonlinear scale the sky uses for height */
const frac = (year: number) => yearToY(year) / HEIGHT;

function short(y: number) {
  if (y < 0) return `${-y} BCE`;
  if (y === 0) return '1 CE';
  return String(y);
}

/** the scale of years: drag to set the horizon, play to watch history grow */
export function TimeScale() {
  const year = useStore((s) => s.year);
  const playing = useStore((s) => s.timePlaying);
  const setYear = useStore((s) => s.setYear);
  const setPlaying = useStore((s) => s.setTimePlaying);
  const word = useStore((s) => s.word);
  const journeyYear = useStore((s) => (s.word ? Math.round(s.journeyYear / 10) * 10 : 0));
  const track = useRef<HTMLDivElement>(null);
  const all = year >= YEAR_MAX - 1;

  const fromPointer = useCallback(
    (clientY: number) => {
      const el = track.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const f = Math.min(1, Math.max(0, 1 - (clientY - r.top) / r.height));
      const y = yToYear(f * HEIGHT);
      setYear(f > 0.995 ? YEAR_MAX : Math.round(y / 10) * 10);
    },
    [setYear],
  );

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setPlaying(false);
    fromPointer(e.clientY);
  };
  const onMove = (e: React.PointerEvent) => {
    if (e.buttons & 1) fromPointer(e.clientY);
  };
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 500 : year < 0 ? 250 : 50;
    const cur = all ? YEAR_MAX : year;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') setYear(Math.min(YEAR_MAX, cur + step));
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') setYear(Math.max(YEAR_MIN, cur - step));
    else if (e.key === 'Home') setYear(YEAR_MIN);
    else if (e.key === 'End') setYear(YEAR_MAX);
    else return;
    e.preventDefault();
    e.stopPropagation();
  };

  const toggle = () => {
    if (playing) setPlaying(false);
    else {
      if (all || year > 2000) setYear(YEAR_MIN);
      setPlaying(true);
    }
  };

  const markerYear = all ? YEAR_MAX : year;
  return (
    <div className="scale" aria-label="Scale of years">
      <div className="scale-head">years</div>
      <div
        className="scale-track"
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Year horizon"
        aria-valuemin={YEAR_MIN}
        aria-valuemax={YEAR_MAX}
        aria-valuenow={Math.round(markerYear)}
        aria-valuetext={all ? 'all of history' : formatYear(markerYear, true)}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onKeyDown={onKey}
      >
        <div className="scale-axis" />
        {MAJOR.map((y) => (
          <div key={y}>
            <div className="scale-tick major" style={{ bottom: `${frac(y) * 100}%` }} />
            <div className="scale-num" style={{ bottom: `calc(${frac(y) * 100}% - 7px)`, transform: 'none' }}>
              {short(y)}
            </div>
          </div>
        ))}
        {MINOR.map((y) => (
          <div key={y} className="scale-tick minor" style={{ bottom: `${frac(y) * 100}%` }} />
        ))}
        {events.map((e) => (
          <div
            key={e.year}
            className="scale-event"
            style={{ bottom: `${frac(e.year) * 100}%` }}
            title={`${formatYear(e.year, !!e.approx)} · ${e.label}`}
            onPointerDown={(ev) => {
              ev.stopPropagation();
              setPlaying(false);
              setYear(e.year);
            }}
          />
        ))}
        {word && (
          <div className="scale-marker is-journey" style={{ bottom: `${frac(journeyYear) * 100}%` }} aria-hidden="true">
            <span>{formatYear(journeyYear, true)}</span>
          </div>
        )}
        {!word && (
          <div className="scale-marker" style={{ bottom: `${frac(markerYear) * 100}%` }} aria-hidden="true">
            <span>{all ? 'today' : formatYear(markerYear, true)}</span>
          </div>
        )}
      </div>
      <div>
        <button className="scale-play" onClick={toggle} aria-pressed={playing} title="Play history (Space)">
          {playing ? 'pause' : 'play history'}
        </button>
        {!all && !playing && (
          <button className="scale-clear" onClick={() => setYear(YEAR_MAX)}>
            all
          </button>
        )}
      </div>
    </div>
  );
}
