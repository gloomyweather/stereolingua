import { useStore } from '../store';
import { Mark } from './Logo';
import { languages } from '../data';

const charted = languages.filter((l) => l.branch !== 'contact').length;

/** title cartouche (left) and the instrument row (right) */
export function TopBar() {
  const select = useStore((s) => s.select);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const sound = useStore((s) => s.sound);
  const setSound = useStore((s) => s.setSound);
  const setOverlay = useStore((s) => s.setOverlay);
  const plate = useStore((s) => s.plate);
  const setPlate = useStore((s) => s.setPlate);
  const visited = useStore((s) => s.visited.filter((id) => languages.some((l) => l.id === id && l.branch !== 'contact')).length);

  const random = () => {
    const s = useStore.getState();
    const unseen = languages.filter((l) => l.branch !== 'contact' && l.id !== s.selected && !s.visited.includes(l.id));
    const pool = unseen.length ? unseen : languages.filter((l) => l.branch !== 'contact' && l.id !== s.selected);
    select(pool[Math.floor(Math.random() * pool.length)].id);
  };

  return (
    <>
      <header className="cartouche">
        <button className="brand" onClick={() => { useStore.getState().setWord(null); select(null); }} aria-label="Stereolingua — back to the whole sky">
          <Mark size={34} />
          <span className="brand-word">Stereolingua</span>
        </button>
        <div className="brand-sub">
          an atlas of the Indo-European sky · <b>{visited}</b> of {charted} stars visited
        </div>
      </header>
      <nav className="instruments" aria-label="Instruments">
        <button className="inst" onClick={() => setOverlay('index')} title="Search languages, words and forms (⌘K)">
          index<span className="kbd">⌘K</span>
        </button>
        <span className="inst-sep" aria-hidden />
        <button className="inst" aria-pressed={view === 'globe'} onClick={() => setView(view === 'globe' ? 'tree' : 'globe')} title="Fold the sky onto the globe (G)">
          {view === 'globe' ? 'sky' : 'globe'}
        </button>
        <span className="inst-sep" aria-hidden />
        <button className="inst" onClick={random} title="Fly to a star you have not visited">
          <span className="label-long">random </span>star
        </button>
        <span className="inst-sep" aria-hidden />
        <button className="inst" aria-pressed={sound} onClick={() => setSound(!sound)} title="Ambient sound">
          sound
        </button>
        <span className="inst-sep" aria-hidden />
        <button className="inst" onClick={() => setPlate(plate === 'day' ? 'night' : 'day')} title="Switch between the night plate and the day plate">
          {plate === 'day' ? 'night' : 'day'}
        </button>
        <span className="inst-sep" aria-hidden />
        <button className="inst" onClick={() => setOverlay('about')} title="About this atlas">
          about
        </button>
      </nav>
    </>
  );
}
