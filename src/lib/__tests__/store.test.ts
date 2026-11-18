import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../store';
import { YEAR_MAX, YEAR_MIN } from '../timeScale';

const reset = () =>
  useStore.setState({ selected: null, previous: null, word: null, timePlaying: false, year: YEAR_MAX, journeyPlaying: false, visited: [] });

describe('mode rules', () => {
  beforeEach(reset);

  it('opening a word pauses history playback and shows all years', () => {
    useStore.setState({ timePlaying: true, year: 500 });
    useStore.getState().setWord('night');
    const s = useStore.getState();
    expect(s.word).toBe('night');
    expect(s.timePlaying).toBe(false);
    expect(s.year).toBe(YEAR_MAX);
    expect(s.journeyPlaying).toBe(true);
    expect(s.journeyYear).toBe(YEAR_MIN);
  });

  it('playing history closes the open word', () => {
    useStore.getState().setWord('night');
    useStore.getState().setTimePlaying(true);
    const s = useStore.getState();
    expect(s.word).toBe(null);
    expect(s.timePlaying).toBe(true);
  });

  it('selecting records the previous star and remembers visits once', () => {
    const { select } = useStore.getState();
    select('english');
    select('german');
    select('english');
    const s = useStore.getState();
    expect(s.previous).toBe('german');
    expect(s.visited).toEqual(['english', 'german']);
  });

  it('closing a word keeps the selection', () => {
    useStore.getState().select('latin');
    useStore.getState().setWord('mother');
    useStore.getState().setWord(null);
    expect(useStore.getState().selected).toBe('latin');
  });
});
