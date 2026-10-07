/**
 * Dependency-free SVG sparkline for 7d price data.
 */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  positive = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  if (!data || data.length < 2) return <div style={{ width, height }} />;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const stroke = positive ? '#22c55e' : '#ef4444';
  const path = `M0,${height} L${points.split(' ').join(' L')} L${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={path} fill={stroke} opacity={0.12} />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={1.5} />
    </svg>
  );
}
