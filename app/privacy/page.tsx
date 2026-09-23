import Link from "next/link";
import type { Metadata } from "next";
import { LogoMark } from "@/components/Icons";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy - PriceTrail",
  description: "How PriceTrail stores watchlist data, sign-in details and local preferences."
};

export default function PrivacyPage() {
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
        <h1>Privacy</h1>
        <p className="legal-updated">Last updated 23 September 2026</p>

        <p>
          PriceTrail is a small price-tracking tool. This page explains plainly what we store and
          why — no hidden fine print.
        </p>

        <h2>What we store</h2>
        <ul>
          <li>
            <strong>When you sign in with Google:</strong> your account identifier, name, email and
            profile photo — used only to attach your watchlist to your account.
          </li>
          <li>
            <strong>Your watchlist:</strong> the product links, titles, prices and alert targets you
            add, stored in our database so they sync across your devices.
          </li>
          <li>
            <strong>Guest watchlists:</strong> if you are not signed in, your watchlist lives in
            this browser&apos;s local storage until you sign in and it is claimed to your account.
          </li>
          <li>
            <strong>Theme preference:</strong> light or dark mode is remembered in local storage on
            your device.
          </li>
        </ul>

        <h2>What we don&apos;t do</h2>
        <ul>
          <li>No selling or sharing of personal data with advertisers.</li>
          <li>No tracking cookies beyond what Google sign-in requires.</li>
          <li>No payment data — PriceTrail does not process payments.</li>
        </ul>

        <h2>Price data</h2>
        <p>
          Stored prices are observational snapshots of public product pages. They are informational
          only — always confirm the final price at the store before buying.
        </p>

        <h2>Requests</h2>
        <p>
          To remove your watchlist, delete the products from your account. To have your account data
          cleared entirely, reach out through the project&apos;s{" "}
          <a href="https://github.com/abustark/price-trail" target="_blank" rel="noreferrer">
            GitHub repository
          </a>{" "}
          and we&apos;ll wipe it.
        </p>
      </article>

      <SiteFooter />
    </main>
  );
}
