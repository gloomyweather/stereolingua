import type { Language } from '../data/types';

export interface TreeIndex {
  byId: Map<string, Language>;
  children: Map<string, string[]>;
  depth: Map<string, number>;
  leaves: Map<string, number>; // number of leaves in subtree
  roots: string[]; // nodes with parent null
}

export function buildIndex(langs: Language[]): TreeIndex {
  const byId = new Map<string, Language>();
  for (const l of langs) byId.set(l.id, l);
  const children = new Map<string, string[]>();
  const roots: string[] = [];
  for (const l of langs) {
    if (l.parent && byId.has(l.parent)) {
      const arr = children.get(l.parent) ?? [];
      arr.push(l.id);
      children.set(l.parent, arr);
    } else roots.push(l.id);
  }
  for (const arr of children.values())
    arr.sort((a, b) => byId.get(a)!.start - byId.get(b)!.start || a.localeCompare(b));
  const depth = new Map<string, number>();
  const leaves = new Map<string, number>();
  const visit = (id: string, d: number): number => {
    depth.set(id, d);
    const ch = children.get(id) ?? [];
    let n = ch.length === 0 ? 1 : 0;
    for (const c of ch) n += visit(c, d + 1);
    leaves.set(id, n);
    return n;
  };
  for (const r of roots) visit(r, 0);
  return { byId, children, depth, leaves, roots };
}

/** ancestors from the node itself up to its root (inclusive). */
export function ancestors(idx: TreeIndex, id: string): string[] {
  const out: string[] = [];
  let cur: string | null | undefined = id;
  const seen = new Set<string>();
  while (cur && idx.byId.has(cur) && !seen.has(cur)) {
    out.push(cur);
    seen.add(cur);
    cur = idx.byId.get(cur)!.parent;
  }
  return out;
}

export function lca(idx: TreeIndex, a: string, b: string): string | null {
  const A = new Set(ancestors(idx, a));
  for (const x of ancestors(idx, b)) if (A.has(x)) return x;
  return null;
}

/** node path a -> lca -> b (inclusive). if no common ancestor, [a, b]. */
export function treePath(idx: TreeIndex, a: string, b: string): string[] {
  if (a === b) return [a];
  const c = lca(idx, a, b);
  if (!c) return [a, b];
  const up = ancestors(idx, a);
  const down = ancestors(idx, b);
  const upPart = up.slice(0, up.indexOf(c) + 1);
  const downPart = down.slice(0, down.indexOf(c)).reverse();
  return [...upPart, ...downPart];
}

export function descendants(idx: TreeIndex, id: string): string[] {
  const out: string[] = [];
  const stack = [...(idx.children.get(id) ?? [])];
  while (stack.length) {
    const x = stack.pop()!;
    out.push(x);
    stack.push(...(idx.children.get(x) ?? []));
  }
  return out;
}

export function siblings(idx: TreeIndex, id: string): string[] {
  const p = idx.byId.get(id)?.parent;
  if (!p) return idx.roots;
  return idx.children.get(p) ?? [id];
}
