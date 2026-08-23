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
  const lastScan = products
    .filter((product) => product.lastScannedAt)
    .sort((a, b) => Number(b.lastScannedAt) - Number(a.lastScannedAt))[0]?.lastScannedAt;
  const signedIn = Boolean(session?.user);

  return (
    <main className="shell" id="top">
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
          <div className="hero-kicker"><span className="kicker-dot" /> Price intelligence for every storefront</div>
          <h1>Buy on your terms, <em>not the store&apos;s.</em></h1>
          <p className="hero-copy">
            PriceTrail watches the products you care about, builds a clean price history, and helps you spot the right moment to buy.
          </p>
          <div className="hero-points">
            <span><Icon name="check" size={15} /> One link is all it takes</span>
            <span><Icon name="check" size={15} /> Automatic price snapshots</span>
            <span><Icon name="check" size={15} /> Your links stay private</span>
          </div>
        </div>

        <div className="hero-tracker-card">
          <div className="tracker-card-heading">
            <div className="tracker-card-icon"><Icon name="spark" size={19} /></div>
            <div>
              <p className="eyebrow">Start tracking</p>
              <h2>Drop in a product link</h2>
            </div>
          </div>
          <TrackForm />
          <div className="tracker-card-foot"><Icon name="globe" size={15} /> Amazon, Flipkart, Myntra, AJIO &amp; more</div>
        </div>
      </section>

      <section className="proof-strip" aria-label="PriceTrail benefits">
        <div className="proof-item"><span className="proof-icon teal"><Icon name="globe" size={17} /></span><div><strong>Any public store</strong><span>Structured-data fallback for the web</span></div></div>
        <div className="proof-item"><span className="proof-icon amber"><Icon name="trend" size={17} /></span><div><strong>Real price context</strong><span>High, low and most common price</span></div></div>
        <div className="proof-item"><span className="proof-icon violet"><Icon name="clock" size={17} /></span><div><strong>Set it and forget it</strong><span>Scheduled background snapshots</span></div></div>
      </section>

      <section className="stats-row" aria-label="Tracker summary">
        <div className="stat stat-featured"><span>Tracked products</span><strong>{signedIn ? products.length : "—"}</strong><small>{signedIn ? "in your watchlist" : "sign in to get started"}</small></div>
        <div className="stat"><span>Active watches</span><strong>{signedIn ? activeCount : "—"}</strong><small>automatic snapshots</small></div>
        <div className="stat"><span>Stores covered</span><strong>{signedIn ? storeCount : "—"}</strong><small>{lastScan ? `last scan ${formatDate(lastScan)}` : "built for the open web"}</small></div>
      </section>

      <section className="watchlist-section" id="watchlist">
        <div className="section-heading section-heading-wide">
          <div>
            <div className="section-label"><span className="section-label-line" /> Your watchlist</div>
            <h2>Everything worth watching, in one place.</h2>
          </div>
          <span className="list-count">{signedIn ? `${products.length} ${products.length === 1 ? "item" : "items"}` : "Private by default"}</span>
        </div>
        <ProductList products={products.map((product) => serializeProduct(product))} signedIn={signedIn} />
      </section>

      <section className="how-section" id="how-it-works">
        <div className="how-intro">
          <div className="section-label"><span className="section-label-line" /> Simple by design</div>
          <h2>Less guesswork.<br /><span>Better timing.</span></h2>
          <p>PriceTrail turns a product page into a useful signal. No bloated dashboards, no endless noise.</p>
        </div>
        <div className="steps-grid">
          <div className="step-card"><span className="step-number">01</span><span className="step-icon"><Icon name="link" size={20} /></span><h3>Paste a link</h3><p>Use a product URL from a supported marketplace or almost any public online store.</p></div>
          <div className="step-card"><span className="step-number">02</span><span className="step-icon"><Icon name="zap" size={20} /></span><h3>We read the signal</h3><p>PriceTrail extracts structured product data and saves your first price snapshot.</p></div>
          <div className="step-card"><span className="step-number">03</span><span className="step-icon"><Icon name="trend" size={20} /></span><h3>Shop with context</h3><p>Come back to see the timeline, compare today with the range, and buy with confidence.</p></div>
        </div>
      </section>

      <section className="cta-banner">
        <div><span className="eyebrow">Your next good buy starts here</span><h2>Stop checking prices manually.</h2></div>
        <a className="button button-light" href="#watchlist">Track a product <Icon name="arrow" size={17} /></a>
      </section>

      <SiteFooter />
    </main>
  );
}

async function loadProducts(userId?: string): Promise<ProductDocument[]> {
  if (!userId) return [];
  try {
    const db = await getDb();
    return await db
      .collection<ProductDocument>("products")
      .find({ userId })
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

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}
