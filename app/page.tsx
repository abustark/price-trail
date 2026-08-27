import Link from "next/link";
import { getDb } from "@/lib/db";
import type { ProductDocument } from "@/lib/types";
import { TrackForm } from "@/components/TrackForm";
import { ProductList } from "@/components/ProductList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { AuthButton } from "@/components/AuthButton";
import { Icon, LogoMark } from "@/components/Icons";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  const products = await loadProducts(session?.user?.id);
  const activeCount = products.filter((product) => product.active).length;
  const storeCount = new Set(products.map((product) => product.storeLabel || product.store)).size;
  const signedIn = Boolean(session?.user);

  return (
    <main className="shell home-shell" id="top">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="PriceTrail home">
          <LogoMark />
          <span>PriceTrail</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#watchlist">Watchlist</a>
          <a href="#how-it-works">How it works</a>
        </nav>
        <div className="top-actions">
          <AuthButton session={session} />
          <ThemeToggle />
        </div>
      </header>

      <section className="hero hero-grid">
        <div className="hero-copy-block">
          <div className="hero-kicker"><span className="kicker-dot" /> Price tracking for every store</div>
          <h1>Track a price. <em>Buy at the right moment.</em></h1>
          <p className="hero-copy">Paste a product link. We&apos;ll record its price over time.</p>
        </div>

        <div className="hero-tracker-card">
          <div className="tracker-card-heading">
            <div className="tracker-card-icon"><Icon name="spark" size={19} /></div>
            <div>
              <p className="eyebrow">Price tracker</p>
              <h2>Paste a product link</h2>
              <p className="tracker-card-description">Start with any public product page.</p>
            </div>
          </div>
          <TrackForm signedIn={signedIn} />
          <div className="tracker-card-foot"><Icon name="globe" size={15} /> Amazon, Flipkart, Myntra, AJIO + more</div>
        </div>
      </section>

      <section className="proof-strip" aria-label="PriceTrail benefits">
        <div className="proof-item"><span className="proof-icon teal"><Icon name="globe" size={17} /></span><strong>Any public store</strong></div>
        <div className="proof-item"><span className="proof-icon amber"><Icon name="trend" size={17} /></span><strong>Price history</strong></div>
        <div className="proof-item"><span className="proof-icon violet"><Icon name="clock" size={17} /></span><strong>Scheduled checks</strong></div>
      </section>

      <section className="stats-row" aria-label="Tracker summary">
        <div className="stat stat-featured"><span>Tracked products</span><strong>{products.length}</strong></div>
        <div className="stat"><span>Active watches</span><strong>{activeCount}</strong></div>
        <div className="stat"><span>Stores covered</span><strong>{storeCount}</strong></div>
      </section>

      <section className="watchlist-section" id="watchlist">
        <div className="section-heading section-heading-wide">
          <div>
            <div className="section-label"><span className="section-label-line" /> Watchlist</div>
            <h2>Products you&apos;re tracking.</h2>
          </div>
          <span className="list-count">{signedIn ? `${products.length} ${products.length === 1 ? "item" : "items"}` : `${products.length} demo ${products.length === 1 ? "item" : "items"}`}</span>
        </div>
        <ProductList products={products.map((product) => serializeProduct(product))} signedIn={signedIn} />
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-intro">
          <div className="section-label"><span className="section-label-line" /> How it works</div>
          <h2>Link in.<br /><span>Price out.</span></h2>
          <p>One link starts the history. Check back when you&apos;re ready to buy.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card"><span className="step-number">01</span><span className="step-icon"><Icon name="link" size={20} /></span><h3>Paste link</h3><p>Add any public product URL.</p></div>
          <div className="step-card"><span className="step-number">02</span><span className="step-icon"><Icon name="zap" size={20} /></span><h3>Capture price</h3><p>We save the current price.</p></div>
          <div className="step-card"><span className="step-number">03</span><span className="step-icon"><Icon name="trend" size={20} /></span><h3>Watch changes</h3><p>See the range over time.</p></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}

async function loadProducts(userId?: string): Promise<ProductDocument[]> {
  try {
    const db = await getDb();
    const targetUser = userId || "guest";
    return await db
      .collection<ProductDocument>("products")
      .find({
        $or: [{ userId: targetUser }, { userId: "guest" }, { userId: { $exists: false } }]
      })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();
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
