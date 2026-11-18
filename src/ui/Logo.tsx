import { MARK } from './logoGeometry';

/** the device: one root forking 1 → 3 → 9, drawn as a stereo pair that converges into ivory */
export function Mark({ size = 28, className = '', converged = false }: { size?: number; className?: string; converged?: boolean }) {
  const paths = MARK.strokes.map((s, i) => <path key={i} d={s.d} strokeWidth={s.level === 0 ? 3.2 : s.level === 1 ? 2.6 : 2.1} />);
  const tips = MARK.tips.map((t, i) => <circle key={i} cx={t.x} cy={t.y} r={2.5} className="mark-tip" style={{ animationDelay: `${(i * 0.37) % 3}s` }} />);
  return (
    <svg className={`mark ${converged ? 'is-converged' : ''} ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <g className="mark-l" fill="none" strokeLinecap="round">{paths}</g>
      <g className="mark-r" fill="none" strokeLinecap="round">{paths}</g>
      <g className="mark-w" fill="none" strokeLinecap="round">{paths}</g>
      <g>{tips}</g>
      <circle cx={MARK.root.x} cy={MARK.root.y} r={3.4} className="mark-root" />
    </svg>
  );
}
