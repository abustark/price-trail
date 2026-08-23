type ChartSample = {
  price: number;
  capturedAt: string;
};

export function PriceChart({ samples, currency }: { samples: ChartSample[]; currency: string }) {
  if (samples.length === 0) {
    return <div className="chart-empty"><span className="empty-icon">—</span><p>No price history yet. Scan again to add another observation.</p></div>;
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
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const current = points[points.length - 1];

  return (
    <div className="chart-wrap">
      <svg className="chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price history chart">
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".22" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((line) => {
          const y = padding + (line / 2) * (height - padding * 2);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 6" />;
        })}
        <text x={padding} y={padding - 10} fontSize="12" fill="var(--muted)">{formatMoney(max, currency)}</text>
        <text x={padding} y={height - 8} fontSize="12" fill="var(--muted)">{formatMoney(min, currency)}</text>
        <path d={areaPath} fill="url(#chart-fill)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((point, index) => (
          <g key={`${point.sample.capturedAt}-${point.sample.price}`}>
            <circle cx={point.x} cy={point.y} r={index === points.length - 1 ? 6 : 4} fill="var(--surface-solid)" stroke="var(--accent)" strokeWidth="3" />
            <title>{`${formatMoney(point.sample.price, currency)} on ${formatDate(point.sample.capturedAt)}`}</title>
          </g>
        ))}
        {samples.length > 1 ? <><text x={padding} y={height - 1} fontSize="10" fill="var(--muted)">{formatShortDate(samples[0].capturedAt)}</text><text x={width - padding} y={height - 1} textAnchor="end" fontSize="10" fill="var(--muted)">{formatShortDate(current.sample.capturedAt)}</text></> : null}
      </svg>
      <div className="chart-caption"><span><i className="chart-legend-dot" /> Observed price</span><span>{samples.length} {samples.length === 1 ? "snapshot" : "snapshots"}</span></div>
    </div>
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

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(new Date(value));
}
