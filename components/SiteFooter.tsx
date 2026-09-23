import Link from "next/link";
import { LogoMark } from "@/components/Icons";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-brand">
        <Link className="brand" href="/" aria-label="PriceTrail home">
          <LogoMark />
          <span>PriceTrail</span>
        </Link>
        <p>Price history for online shopping — paste a link, see the trail, buy at the right time.</p>
      </div>

      <nav className="footer-cols" aria-label="Footer">
        <div className="footer-col">
          <strong>Product</strong>
          <Link href="/#how">How it works</Link>
          <Link href="/#watchlist">Watchlist</Link>
          <Link href="/#main-content">Track a product</Link>
        </div>
        <div className="footer-col">
          <strong>Stores</strong>
          <span>Amazon</span>
          <span>Flipkart</span>
          <span>Myntra</span>
          <span>AJIO</span>
        </div>
        <div className="footer-col">
          <strong>Legal</strong>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
        </div>
      </nav>

      <div className="footer-base">
        <p>© 2026 PriceTrail</p>
        <p>Price data is informational. Always confirm the final price at checkout.</p>
      </div>
    </footer>
  );
}
