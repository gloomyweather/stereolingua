/** year <-> scene height. nonlinear: antiquity compressed, recent centuries stretched. */
export const YEAR_MIN = -4500;
export const YEAR_MAX = 2030;
export const HEIGHT = 64;
export const POWER = 1.65;

const SPAN = YEAR_MAX - YEAR_MIN;

export function yearToY(year: number): number {
  const t = Math.min(1, Math.max(0, (year - YEAR_MIN) / SPAN));
  return HEIGHT * Math.pow(t, POWER);
}

export function yToYear(y: number): number {
  const t = Math.pow(Math.min(1, Math.max(0, y / HEIGHT)), 1 / POWER);
  return YEAR_MIN + t * SPAN;
}

export function formatYear(year: number, approx = false): string {
  const c = approx ? 'c. ' : '';
  const y = Math.round(year);
  if (y < 0) return `${c}${Math.abs(y)} BCE`;
  if (y === 0) return `${c}1 CE`; // there is no year zero
  if (y < 1000) return `${c}${y} CE`;
  return `${c}${Math.round(year)}`;
}
