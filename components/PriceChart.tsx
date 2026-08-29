import { Icon } from "@/components/Icons";

type ChartSample = {
  price: number;
  capturedAt: string;
  source?: "direct" | "proxy" | "historical" | "mrp-baseline";
};

export function PriceChart({
  samples,
  currency,
  mrp
}: {
  samples: ChartSample[];
  currency: string;
  mrp?: number;
}) {
  if (samples.length === 0) {
    return <div className="chart-empty"><span className="empty-icon"><Icon name="trend" size={18} /></span><p>No price history yet. Scan again to add another observation.</p></div>;
  }

  const width = 720;
  const height = 300;
  const padding = 34;
  const chartSamples = downsample(samples, 220);
  const prices = chartSamples.map((sample) => sample.price);
  if (mrp && mrp > 0) prices.push(mrp);

  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const rawSpread = rawMax - rawMin;

  // Visual baseline scaling:
  // If price spread is tiny (e.g. ₹1 difference), enforce sensible visual headroom (at least 8% of max)
  // so minor fluctuations look like clean, realistic steady lines rather than severe cliffs.
  const minSpread = Math.max(Math.round(rawMax * 0.08), 25);
  const min = rawSpread < minSpread ? Math.max(0, rawMax - minSpread) : rawMin;
  const max = rawMax;
  const range = Math.max(max - min, 1);

  const points = chartSamples.map((sample, index) => {
    const x = chartSamples.length === 1 ? width / 2 : padding + (index / (chartSamples.length - 1)) * (width - padding * 2);
    const y = height - padding - ((sample.price - min) / range) * (height - padding * 2);
    const isHistorical = sample.source === "historical" || sample.source === "mrp-baseline";
    return { x, y, sample, isHistorical };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const current = points[points.length - 1];

  const mrpY = mrp ? height - padding - ((mrp - min) / range) * (height - padding * 2) : undefined;
  const hasHistorical = points.some((p) => p.isHistorical);

  return (
    <div className="chart-wrap">
      <svg
        className="chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Price history chart. Current ${formatMoney(samples[samples.length - 1].price, currency)}. Lowest ${formatMoney(Math.min(...samples.map((sample) => sample.price)), currency)}. Highest ${formatMoney(Math.max(...samples.map((sample) => sample.price)), currency)}. ${samples.length} ${samples.length === 1 ? "observation" : "observations"}.`}
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity=".22" />
            <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2].map((line) => {
          const y = padding + (line / 2) * (height - padding * 2);
          return <line key={line} x1={padding} x2={width - padding} y1={y} y2={y} stroke="var(--line)" strokeDasharray="3 6" />;
        })}

        {/* MRP reference line if present */}
        {mrpY !== undefined ? (
          <g>
            <line
              x1={padding}
              x2={width - padding}
              y1={mrpY}
              y2={mrpY}
              stroke="rgb(245, 158, 11)"
              strokeDasharray="4 4"
              strokeWidth="1.5"
              opacity="0.8"
            />
            <text x={width - padding} y={Math.max(padding + 12, mrpY - 5)} textAnchor="end" fontSize="10" fill="rgb(245, 158, 11)" fontWeight="600">
              {mrp ? `MRP: ${formatMoney(mrp, currency)}` : ""}
            </text>
          </g>
        ) : null}

        <text x={padding} y={padding - 10} fontSize="12" fill="var(--muted)">{formatMoney(max, currency)}</text>
        <text x={padding} y={height - 8} fontSize="12" fill="var(--muted)">{formatMoney(min, currency)}</text>
        <path d={areaPath} fill="url(#chart-fill)" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />

        {/* Differentiable Data Points */}
        {points.map((point, index) => {
          const isLatest = index === points.length - 1;
          const isHist = point.isHistorical;

          return (
            <g key={`${point.sample.capturedAt}-${point.sample.price}-${index}`}>
              {isHist ? (
                // Historical Point: Subtle ring with dashed border
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill="var(--surface)"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                  opacity="0.85"
                />
              ) : (
                // Live Verified Scan: Solid glowing node
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isLatest ? 6.5 : 4.5}
                  fill={isLatest ? "var(--accent)" : "var(--surface-solid)"}
                  stroke="var(--accent)"
                  strokeWidth="3"
                />
              )}
              <title>{`${formatMoney(point.sample.price, currency)} • ${isHist ? "Historical" : "Live scan"} on ${formatDate(point.sample.capturedAt)}`}</title>
            </g>
          );
        })}

        {chartSamples.length > 1 ? (
          <>
            <text x={padding} y={height - 1} fontSize="10" fill="var(--muted)">{formatShortDate(chartSamples[0].capturedAt)}</text>
            <text x={width - padding} y={height - 1} textAnchor="end" fontSize="10" fill="var(--muted)">{formatShortDate(chartSamples[chartSamples.length - 1].capturedAt)}</text>
          </>
        ) : null}
      </svg>

      {/* Differentiable Legend */}
      <div className="chart-caption">
        <div style={{ display: "flex", gap: "14px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <i className="chart-legend-dot" /> Live
          </span>
          {hasHistorical ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--muted)" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", border: "1.5px dashed var(--accent)", display: "inline-block" }} /> Historical
            </span>
          ) : null}
          {mrp ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "rgb(245, 158, 11)" }}>
              <span style={{ width: "12px", height: "2px", borderTop: "2px dashed rgb(245, 158, 11)", display: "inline-block" }} /> MRP
            </span>
          ) : null}
        </div>
        <span>{samples.length} {samples.length === 1 ? "snapshot" : "snapshots"}</span>
      </div>
    </div>
  );
}

function downsample<T extends { price: number }>(samples: T[], maxPoints: number): T[] {
  if (samples.length <= maxPoints) return samples;

  const important = new Set([0, samples.length - 1]);
  let lowestIndex = 0;
  let highestIndex = 0;

  samples.forEach((sample, index) => {
    if (sample.price < samples[lowestIndex].price) lowestIndex = index;
    if (sample.price > samples[highestIndex].price) highestIndex = index;
  });

  important.add(lowestIndex);
  important.add(highestIndex);
  const remaining = Math.max(0, maxPoints - important.size);
  const step = (samples.length - 1) / (remaining + 1);

  for (let index = 1; index <= remaining; index += 1) {
    important.add(Math.round(index * step));
  }

  return [...important]
    .sort((a, b) => a - b)
    .slice(0, maxPoints)
    .map((index) => samples[index]);
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
