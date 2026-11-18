import { describe, it, expect } from 'vitest';
import { fold, searchAll } from '../search';

describe('fold', () => {
  it('strips diacritics and folds ligatures and subscripts', () => {
    expect(fold('Māter')).toBe('mater');
    expect(fold('Straße')).toBe('strasse');
    expect(fold('þing ðæt Øl Łódź')).toBe('thing daet ol lodz');
    expect(fold('*méh₂tēr')).toBe('meh2ter');
    expect(fold('Proto-Germanic')).toBe('proto germanic');
  });
});

describe('searchAll', () => {
  it('returns nothing for an empty query', () => {
    expect(searchAll('  ')).toEqual([]);
  });

  it('finds German Nacht for "nacht"', () => {
    const r = searchAll('nacht', 40);
    const hit = r.find((x) => x.kind === 'form' && x.langId === 'german' && x.wordId === 'night');
    expect(hit).toBeTruthy();
    expect(hit && hit.kind === 'form' && hit.form.form).toBe('Nacht');
  });

  it('finds proto-germanic for "proto germ"', () => {
    const r = searchAll('proto germ');
    expect(r[0].kind).toBe('language');
    expect(r.some((x) => x.kind === 'language' && x.id === 'proto-germanic')).toBe(true);
  });

  it('finds Latin māter for "mater"', () => {
    const r = searchAll('mater', 40);
    expect(r.some((x) => x.kind === 'form' && x.langId === 'latin' && x.form.form === 'māter')).toBe(true);
  });

  it('ranks English first for "eng"', () => {
    const r = searchAll('eng');
    expect(r[0].kind).toBe('language');
    expect(r[0].id).toBe('english');
  });

  it('finds the PIE root of mother by reconstruction spelling', () => {
    for (const q of ['*mehter', 'meh2ter', 'meh₂ter']) {
      const r = searchAll(q, 40);
      expect(r.some((x) => x.kind === 'word' && x.id === 'mother'), q).toBe(true);
    }
  });

  it('respects the limit', () => {
    expect(searchAll('a', 5).length).toBeLessThanOrEqual(5);
  });
});
