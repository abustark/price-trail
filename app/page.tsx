import Link from "next/link";
import { getDb } from "@/lib/db";
import type { ProductDocument } from "@/lib/types";
import { TrackForm } from "@/components/TrackForm";
import { ProductList } from "@/components/ProductList";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SiteFooter } from "@/components/SiteFooter";
import { AuthButton } from "@/components/AuthButton";
import { Icon, LogoMark } from "@/components/Icons";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export default async function Home() {
  const viewer = await getViewer();
  const products = await loadProducts(viewer.userId);
  const signedIn = viewer.signedIn;

  return (
    <main className="shell home-shell" id="main-content">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="PriceTrail home">
          <LogoMark />
          <span>PriceTrail</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#watchlist">Watchlist</a>
        </nav>
        <div className="top-actions">
          <AuthButton session={viewer.session} />
          <ThemeToggle />
        </div>
      </header>
      {viewer.claimedCount ? <p className="account-notice" role="status">Watchlist saved to your account.</p> : null}

      <section className="hero hero-grid">
        <div className="hero-copy-block">
          <div className="hero-kicker"><span className="kicker-dot" /> Price history for online shopping</div>
          <h1>Track prices <em>before you buy.</em></h1>
          <p className="hero-copy">Paste a product link to see its price history.</p>
        </div>

        <div className="hero-tracker-card">
          <div className="tracker-card-heading">
            <div className="tracker-card-icon"><Icon name="spark" size={19} /></div>
            <div>
              <p className="eyebrow">Add a product</p>
              <h2>Paste a product link</h2>
              <p className="tracker-card-description">Start with any public product page.</p>
            </div>
          </div>
          <TrackForm signedIn={signedIn} />
          <div className="tracker-card-foot"><Icon name="globe" size={15} /> Amazon · Flipkart · AJIO · more</div>
        </div>
      </section>

      <section className="watchlist-section" id="watchlist">
        <div className="section-heading section-heading-wide">
          <div>
            <div className="section-label"><span className="section-label-line" /> Watchlist</div>
            <h2>Products you&apos;re tracking.</h2>
          </div>
          <span className="list-count">{products.length} {products.length === 1 ? "item" : "items"}</span>
        </div>
        <ProductList products={products.map((product) => serializeProduct(product))} signedIn={signedIn} />
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
