import { describe, it, expect } from 'vitest';
import { yearToY, yToYear, HEIGHT } from '../timeScale';
import { buildIndex, treePath, lca, ancestors } from '../tree';
import { computeLayout } from '../layout3d';
import type { Language } from '../../data/types';

const L = (id: string, parent: string | null, start: number): Language => ({
  id, name: id, parent, branch: parent ? 'germanic' : 'root', start, end: null, startUncertainty: 0,
  status: 'living', region: { lat: 0, lon: 0, label: '' }, script: '', summary: '',
  features: { cases: 0, genders: 0, wordOrder: 'SVO', morphology: 'fusional', tonal: false, dual: false, articles: false, notes: [] },
  sources: [],
});
const langs = [L('r', null, -4500), L('a', 'r', -2000), L('b', 'r', -1500), L('a1', 'a', 0), L('a2', 'a', 500), L('b1', 'b', 1000)];

describe('timeScale', () => {
  it('maps ends and roundtrips', () => {
    expect(yearToY(-4500)).toBe(0);
    expect(yearToY(2030)).toBeCloseTo(HEIGHT);
    for (const y of [-3000, 0, 1066, 1900]) expect(yToYear(yearToY(y))).toBeCloseTo(y, 6);
  });
  it('is monotonic', () => {
    expect(yearToY(1000)).toBeGreaterThan(yearToY(0));
  });
});

describe('tree', () => {
  const idx = buildIndex(langs);
  it('counts leaves', () => expect(idx.leaves.get('r')).toBe(3));
  it('finds lca and path', () => {
    expect(lca(idx, 'a1', 'b1')).toBe('r');
    expect(treePath(idx, 'a1', 'b1')).toEqual(['a1', 'a', 'r', 'b', 'b1']);
    expect(treePath(idx, 'a1', 'a2')).toEqual(['a1', 'a', 'a2']);
    expect(ancestors(idx, 'a2')).toEqual(['a2', 'a', 'r']);
  });
});

describe('layout', () => {
  it('is deterministic and keeps root on axis and y = time', () => {
    const l1 = computeLayout(langs);
    const l2 = computeLayout([...langs].reverse());
    for (const l of langs) {
      expect(l1.nodes.get(l.id)!.pos).toEqual(l2.nodes.get(l.id)!.pos);
      expect(l1.nodes.get(l.id)!.pos[1]).toBeCloseTo(yearToY(l.start));
    }
    expect(l1.nodes.get('r')!.pos[0]).toBe(0);
  });
});
