import Link from "next/link";
import { LogoMark } from "@/components/Icons";

export default function ProductLoading() {
  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/">
          <LogoMark />
          <span>PriceTrail</span>
        </Link>
      </header>

      <section className="panel loading-panel">
        <span className="transition-ring" aria-hidden="true" />
        <p className="eyebrow">Opening history</p>
        <h1 className="product-hero-title">Loading product timeline</h1>
        <p className="muted">Fetching price samples and calculating high, low, common price and change frequency.</p>
      </section>

      <section className="grid" aria-label="Loading statistics">
        {[1, 2, 3, 4].map((item) => (
          <div className="stat skeleton-card" key={item}>
            <span />
            <strong />
          </div>
        ))}
      </section>
    </main>
  );
}
