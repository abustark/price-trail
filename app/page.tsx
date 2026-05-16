import { getDb } from "@/lib/db";
import type { ProductDocument } from "@/lib/types";
import { TrackForm } from "@/components/TrackForm";
import { ProductList } from "@/components/ProductList";
import { ThemeToggle } from "@/components/ThemeToggle";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await loadProducts();
  const activeCount = products.filter((product) => product.active).length;
  const storeCount = new Set(products.map((product) => product.store)).size;
  const lastScan = products
    .filter((product) => product.lastScannedAt)
    .sort((a, b) => Number(b.lastScannedAt) - Number(a.lastScannedAt))[0]?.lastScannedAt;

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="mark">PT</span>
          <span>PriceTrail</span>
        </a>
        <div className="top-actions">
          <div className="stores" aria-label="Supported stores">
            {["Amazon", "Flipkart", "Myntra", "Ajio"].map((store) => (
              <span className="store-pill" key={store}>
                {store}
              </span>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <section className="hero compact-hero">
        <p className="eyebrow">Amazon, Flipkart, Myntra and Ajio price history</p>
        <h1>Paste a product link. Know the real price pattern.</h1>
        <p className="hero-copy">See current price, high, low, most common price and how often it changes.</p>
        <TrackForm />
      </section>

      <section className="grid" aria-label="Tracker summary">
        <div className="stat">
          <span>Tracked products</span>
          <strong>{products.length}</strong>
        </div>
        <div className="stat">
          <span>Active scans</span>
          <strong>{activeCount}</strong>
        </div>
        <div className="stat">
          <span>Stores covered</span>
          <strong>{storeCount}</strong>
        </div>
        <div className="stat">
          <span>Last scan</span>
          <strong>{lastScan ? formatDate(lastScan) : "None"}</strong>
        </div>
      </section>

      <section className="panel product-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Monitoring</p>
            <h2>Tracked products</h2>
          </div>
          <span className="muted">{products.length} total</span>
        </div>
        <ProductList products={products.map((product) => serializeProduct(product))} />
      </section>
    </main>
  );
}

async function loadProducts(): Promise<ProductDocument[]> {
  try {
    const db = await getDb();
    return await db.collection<ProductDocument>("products").find({}).sort({ updatedAt: -1 }).limit(50).toArray();
  } catch {
    return [];
  }
}

function serializeProduct(product: ProductDocument) {
  return {
    ...product,
    _id: product._id?.toString(),
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    nextScanAt: product.nextScanAt.toISOString(),
    lastScannedAt: product.lastScannedAt?.toISOString()
  };
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}
