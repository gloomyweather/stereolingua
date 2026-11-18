import { useStore } from '../store';
import { langById, designation } from '../scene/model';
import { formatYear } from '../lib/timeScale';
import { labelText } from '../scene/Labels';

/** a whisper of information when a star is under the pointer */
export function HoverCard() {
  const hovered = useStore((s) => s.hovered);
  const selected = useStore((s) => s.selected);
  if (!hovered || hovered === selected) return null;
  const l = langById.get(hovered);
  if (!l) return null;
  return (
    <div className="hovercard" role="status">
      <span className="hc-name">{labelText(hovered)}</span>
      <span className="hc-years">
        {formatYear(l.start, true)} – {l.end === null ? 'today' : formatYear(l.end, true)}
      </span>
      <span className="muted"><i>{designation.get(hovered)}</i></span>
    </div>
  );
}
