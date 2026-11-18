/** uniforms shared by every material in the sky; updated once per frame by <Driver/> */
export const U = {
  uTime: { value: 0 },
  uGrowY: { value: 0 }, // tree-space y reached by the intro growth
  uYearY: { value: 1000 }, // tree-space y of the year horizon (1000 = off)
  uMorph: { value: 0 }, // 0 tree … 1 globe
  uFocus: { value: 0 }, // 0 … 1 strength of focus dimming
  uJourneyY: { value: -10 }, // tree-space y of a word's wavefront
  uJourney: { value: 0 }, // 0 … 1 journey active
  uFocusDist: { value: 80 }, // camera → target distance, for depth of field
  uPR: { value: 1 },
  uHiBranch: { value: -1 }, // hovered branch index
  uDay: { value: 0 }, // 0 night plate (light on dark, additive) · 1 day plate (ink on paper, multiplied)
};

import * as THREE from 'three';
/** materials that change blending between plates: additive light at night, multiplied ink by day */
export const themed = new Set<THREE.Material>();
export function themedMaterial<T extends THREE.Material>(m: T): T {
  themed.add(m);
  m.premultipliedAlpha = true;
  m.blending = U.uDay.value > 0.5 ? THREE.MultiplyBlending : THREE.AdditiveBlending;
  return m;
}
export function applyPlate(day: boolean) {
  U.uDay.value = day ? 1 : 0;
  for (const m of themed) {
    m.blending = day ? THREE.MultiplyBlending : THREE.AdditiveBlending;
    m.needsUpdate = true;
  }
}

export const BRANCH_INDEX: Record<string, number> = {
  root: 0, anatolian: 1, tocharian: 2, 'indo-iranian': 3, greek: 4, armenian: 5, albanian: 6,
  italic: 7, celtic: 8, germanic: 9, 'balto-slavic': 10, 'paleo-balkan': 11, contact: 12,
};
