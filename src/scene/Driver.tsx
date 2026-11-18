import { useFrame, useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import { U, applyPlate } from './uniforms';
import { INK } from '../lib/palette';
import { useStore, prefersReducedMotion } from '../store';
import { yearToY, yToYear, YEAR_MAX, HEIGHT } from '../lib/timeScale';
import { wordCarriers } from './model';

const JOURNEY_SECONDS = 11;

/** one place that advances clocks and copies store state into shader uniforms */
export function Driver() {
  const gl = useThree((s) => s.gl);
  const controls = useThree((s) => s.controls) as unknown as { target?: { distanceTo: (v: unknown) => number } } | null;
  const camera = useThree((s) => s.camera);

  // plate: night (light on dark) or day (ink on paper)
  useEffect(() => {
    const apply = (plate: 'night' | 'day') => {
      applyPlate(plate === 'day');
      gl.setClearColor(new THREE.Color(plate === 'day' ? '#d9d0bd' : INK.night));
      document.documentElement.setAttribute('data-plate', plate);
    };
    apply(useStore.getState().plate);
    return useStore.subscribe((s, p) => {
      if (s.plate !== p.plate) apply(s.plate);
    });
  }, [gl]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const s = useStore.getState();
    U.uTime.value += dt;
    U.uPR.value = Math.min(gl.getPixelRatio(), 2);
    U.uGrowY.value = yearToY(s.growYear) + 0.8;
    U.uYearY.value = s.year >= YEAR_MAX - 1 ? 1000 : yearToY(s.year);

    // tree <-> globe morph
    const wantMorph = s.view === 'globe' ? 1 : 0;
    if (s.morph !== wantMorph) {
      const step = prefersReducedMotion ? 1 : dt / 2.2;
      const m = wantMorph > s.morph ? Math.min(1, s.morph + step) : Math.max(0, s.morph - step);
      useStore.setState({ morph: m });
    }
    const m = useStore.getState().morph;
    U.uMorph.value = m * m * (3 - 2 * m);

    // focus dimming eases in/out
    const wantFocus = s.selected || s.word ? 1 : 0;
    U.uFocus.value += (wantFocus - U.uFocus.value) * Math.min(1, dt * 3);

    // word journey clock (advances in tree-space height so every era gets screen time)
    if (s.word) {
      const r = wordCarriers(s.word);
      const y0 = yearToY(r.startYear) - 0.5;
      const y1 = Math.min(HEIGHT, yearToY(r.endYear) + 0.5);
      let y = Math.max(y0, yearToY(s.journeyYear));
      if (s.journeyPlaying) {
        y = prefersReducedMotion ? y1 : y + ((y1 - y0) / JOURNEY_SECONDS) * dt;
        if (y >= y1) {
          y = y1;
          useStore.setState({ journeyPlaying: false, journeyYear: yToYear(y1) });
        } else useStore.setState({ journeyYear: yToYear(y) });
      }
      U.uJourneyY.value = y;
      U.uJourney.value += (1 - U.uJourney.value) * Math.min(1, dt * 4);
    } else {
      U.uJourney.value += (0 - U.uJourney.value) * Math.min(1, dt * 4);
    }

    // history playback
    if (s.timePlaying) {
      const y = yearToY(s.year) + (HEIGHT / 26) * dt;
      if (y >= HEIGHT) useStore.setState({ timePlaying: false, year: YEAR_MAX });
      else useStore.setState({ year: yToYear(y) });
    }

    // depth of field focus distance
    const t = controls?.target;
    if (t) U.uFocusDist.value = camera.position.distanceTo(t as never);
  });
  return null;
}
