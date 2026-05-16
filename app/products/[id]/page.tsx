import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { calculatePriceStats } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import type { PriceSampleDocument, ProductDocument } from "@/lib/types";
import { PriceChart } from "@/components/PriceChart";
import { RescanButton } from "@/components/RescanButton";
import { ResetHistoryButton } from "@/components/ResetHistoryButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) notFound();

  const db = await getDb();
  const productId = new ObjectId(id);
  const product = await db.collection<ProductDocument>("products").findOne({ _id: productId });
  if (!product) notFound();

  const samples = await db
    .collection<PriceSampleDocument>("price_samples")
    .find({ productId })
    .sort({ capturedAt: 1 })
    .limit(1000)
    .toArray();
  const stats = calculatePriceStats(samples);

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="mark">PT</span>
          <span>PriceTrail</span>
        </a>
        <div className="action-row">
          <RescanButton productId={id} />
          <ResetHistoryButton productId={id} />
          <ThemeToggle />
        </div>
      </header>

      <section className="panel product-hero">
        <div className="product-hero-card">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="product-image" src={product.imageUrl} alt="" />
          ) : (
            <span className="product-image" />
          )}
          <div>
            <p className="eyebrow">Tracked product</p>
            <h1 className="product-hero-title">{product.title}</h1>
            <div className="product-meta">
              <span className="meta-chip">{product.store}</span>
              <a className="meta-chip" href={product.normalizedUrl} target="_blank" rel="noreferrer">
                Open store page
              </a>
              <span className="meta-chip">Every {product.scanEveryHours} hours</span>
            </div>
          </div>
          <div className="price">{product.lastPrice ? formatMoney(product.lastPrice, product.currency) : "No price"}</div>
        </div>
        {product.lastError ? <p className="error">Last scan error: {product.lastError}</p> : null}
      </section>

      <section className="grid" aria-label="Price statistics">
        <Stat label="Highest price" value={stats.highest ? formatMoney(stats.highest.price, product.currency) : "None"} note={stats.highest ? formatDate(stats.highest.capturedAt) : undefined} />
        <Stat label="Lowest price" value={stats.lowest ? formatMoney(stats.lowest.price, product.currency) : "None"} note={stats.lowest ? formatDate(stats.lowest.capturedAt) : undefined} />
        <Stat label="Most common price" value={stats.common ? formatMoney(stats.common.price, product.currency) : "None"} note={stats.common ? `${stats.common.percentage}% of scans` : undefined} />
        <Stat label="Change frequency" value={String(stats.changes.count)} note={stats.changes.description} />
      </section>

      <section className="detail-grid">
        <div className="panel">
          <h2>Price history</h2>
          <PriceChart
            samples={samples.map((sample) => ({
              price: sample.price,
              capturedAt: sample.capturedAt.toISOString()
            }))}
            currency={product.currency}
          />
        </div>
        <div className="panel">
          <h2>Recent scans</h2>
          <div className="samples">
            {[...samples].reverse().slice(0, 12).map((sample) => (
              <div className="sample-row" key={sample._id?.toString()}>
                <span>{formatDate(sample.capturedAt.toISOString())}</span>
                <strong>{formatMoney(sample.price, sample.currency)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <p className="muted">{note}</p> : null}
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
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
