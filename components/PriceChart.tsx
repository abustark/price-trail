type ChartSample = {
  price: number;
  capturedAt: string;
};

export function PriceChart({ samples, currency }: { samples: ChartSample[]; currency: string }) {
  if (samples.length === 0) {
    return <p className="muted">No samples yet.</p>;
  }

  const width = 720;
  const height = 300;
  const padding = 34;
  const prices = samples.map((sample) => sample.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = Math.max(max - min, 1);

  const points = samples.map((sample, index) => {
    const x = samples.length === 1 ? width / 2 : padding + (index / (samples.length - 1)) * (width - padding * 2);
    const y = height - padding - ((sample.price - min) / range) * (height - padding * 2);
    return { x, y, sample };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price history chart">
      <line x1={padding} x2={width - padding} y1={height - padding} y2={height - padding} stroke="var(--line)" />
      <line x1={padding} x2={padding} y1={padding} y2={height - padding} stroke="var(--line)" />
      <text x={padding} y={padding - 10} fontSize="12" fill="var(--muted)">
        {formatMoney(max, currency)}
      </text>
      <text x={padding} y={height - 8} fontSize="12" fill="var(--muted)">
        {formatMoney(min, currency)}
      </text>
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point) => (
        <g key={`${point.sample.capturedAt}-${point.sample.price}`}>
          <circle cx={point.x} cy={point.y} r="5" fill="var(--accent)" />
          <title>{`${formatMoney(point.sample.price, currency)} on ${formatDate(point.sample.capturedAt)}`}</title>
        </g>
      ))}
    </svg>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
