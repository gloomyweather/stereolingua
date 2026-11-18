/** the stereolingua mark: one root forking 1 -> 3 -> 9. viewBox 0 0 100 100 */
export interface Stroke { d: string; len: number; level: number }
export interface Tip { x: number; y: number; level: number }

const rad = (deg: number) => (deg * Math.PI) / 180;

function curve(x0: number, y0: number, ang: number, len: number, bend: number) {
  const x1 = x0 + Math.cos(rad(ang)) * len;
  const y1 = y0 + Math.sin(rad(ang)) * len;
  // control point: start straight up, bend toward the end
  const cx = x0 + Math.cos(rad(ang + bend)) * len * 0.55;
  const cy = y0 + Math.sin(rad(ang + bend)) * len * 0.55;
  return { d: `M${x0.toFixed(2)} ${y0.toFixed(2)} Q${cx.toFixed(2)} ${cy.toFixed(2)} ${x1.toFixed(2)} ${y1.toFixed(2)}`, x1, y1, len: len * 1.05 };
}

export function buildMark() {
  const strokes: Stroke[] = [];
  const tips: Tip[] = [];
  const root = { x: 50, y: 88 };
  const trunk = curve(root.x, root.y, -90, 14, 0);
  strokes.push({ d: trunk.d, len: trunk.len, level: 0 });
  const l1 = [-128, -90, -52];
  for (const a1 of l1) {
    const s1 = curve(trunk.x1, trunk.y1, a1, 24, (-90 - a1) * 0.6);
    strokes.push({ d: s1.d, len: s1.len, level: 1 });
    tips.push({ x: s1.x1, y: s1.y1, level: 1 });
    for (const da of [-26, 0, 26]) {
      const a2 = a1 + da + (a1 + 90) * 0.15;
      const s2 = curve(s1.x1, s1.y1, a2, da === 0 ? 20 : 16, (-90 - a2) * 0.5);
      strokes.push({ d: s2.d, len: s2.len, level: 2 });
      tips.push({ x: s2.x1, y: s2.y1, level: 2 });
    }
  }
  return { root, strokes, tips: tips.filter((t) => t.level === 2), forks: tips.filter((t) => t.level === 1), trunkTop: { x: trunk.x1, y: trunk.y1 } };
}

export const MARK = buildMark();
