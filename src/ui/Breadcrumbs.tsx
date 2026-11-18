import { useStore } from '../store';
import { ancestors } from '../lib/tree';
import { layout, langById } from '../scene/model';
import { labelText } from '../scene/Labels';

/** the lineage of the selected star, root first */
export function Breadcrumbs() {
  const selected = useStore((s) => s.selected);
  const select = useStore((s) => s.select);
  if (!selected) return null;
  const chain = ancestors(layout.index, selected).reverse();
  return (
    <nav className="lineage" aria-label="Lineage">
      {chain.map((id, i) => (
        <span key={id}>
          {i > 0 && <span className="crumb-sep">›</span>}
          <button
            className={`crumb ${id === selected ? 'is-current' : ''} ${langById.get(id)?.status === 'proto' ? 'is-proto' : ''}`}
            onClick={() => select(id)}
            aria-current={id === selected ? 'true' : undefined}
          >
            {labelText(id)}
          </button>
        </span>
      ))}
    </nav>
  );
}
