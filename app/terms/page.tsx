import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/Icons";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Terms - PriceTrail",
  description: "The terms of using PriceTrail and its informational price data."
};

export default function TermsPage() {
  return (
    <main className="shell" id="main-content">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="PriceTrail home">
          <LogoMark />
          <span>PriceTrail</span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link href="/#watchlist">Watchlist</Link>
        </nav>
      </header>

      <article className="legal-page">
        <p className="eyebrow">Legal</p>
        <h1>Terms</h1>
        <p className="legal-updated">Last updated 23 September 2026</p>

        <p>
          By using PriceTrail you agree to these simple terms. If you don&apos;t agree, please
          don&apos;t use the service.
        </p>

        <h2>Use of the service</h2>
        <ul>
          <li>PriceTrail is for personal price tracking of public product pages.</li>
          <li>Don&apos;t abuse the service — no scraping, reselling or automated bulk access.</li>
          <li>You are responsible for the links and watchlist items you add under your account.</li>
        </ul>

        <h2>Price data is informational</h2>
        <ul>
          <li>Prices shown are historical snapshots and may be stale, incomplete or wrong.</li>
          <li>
            We make no guarantee of any price, discount, availability or savings — always confirm
            the final price at the store before buying.
          </li>
          <li>Product names, images and trademarks belong to their respective stores.</li>
        </ul>

        <h2>Availability</h2>
        <p>
          PriceTrail is provided as-is and may change, break or be discontinued without notice. To
          the extent permitted by law, we are not liable for decisions made based on the price data
          shown.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these terms from time to time. Continued use of the service after changes
          means you accept the revised terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions? Reach out through the project&apos;s{" "}
          <a href="https://github.com/abustark/price-trail" target="_blank" rel="noreferrer">
            GitHub repository
          </a>
          .
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
