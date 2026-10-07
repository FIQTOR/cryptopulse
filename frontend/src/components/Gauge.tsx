/**
 * Semi-circular gauge for the Fear & Greed index (0-100).
 */
export function Gauge({ value, size = 84 }: { value: number; size?: number }) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = size / 2 - 6;
  const circumference = Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  const color = clamped < 25 ? '#ef4444' : clamped < 45 ? '#f97316' : clamped < 55 ? '#eab308' : clamped < 75 ? '#84cc16' : '#22c55e';

  return (
    <svg width={size} height={size / 2 + 12} viewBox={`0 0 ${size} ${size / 2 + 12}`}>
      <path
        d={`M6,${size / 2} A${radius},${radius} 0 0 1 ${size - 6},${size / 2}`}
        fill="none"
        stroke="var(--color-surface-2)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      <path
        d={`M6,${size / 2} A${radius},${radius} 0 0 1 ${size - 6},${size / 2}`}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
