import Link from "next/link";
import { getStoreLabel } from "@/lib/stores";
import type { StoreKey } from "@/lib/types";
import { Icon } from "@/components/Icons";
import { ProductImage } from "@/components/ProductImage";

type ProductListItem = {
  _id?: string;
  title: string;
  store: StoreKey;
  storeLabel?: string;
  normalizedUrl?: string;
  imageUrl?: string;
  currency: string;
  lastPrice?: number;
  lastScannedAt?: string;
  lastError?: string;
  active?: boolean;
  targetPrice?: number;
  targetPriceReached?: boolean;
  mrp?: number;
  discountPercent?: number;
};

export function ProductList({ products, signedIn = true }: { products: ProductListItem[]; signedIn?: boolean }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Icon name="spark" size={21} /></div>
        <strong>Start your watchlist.</strong>
        <p>Paste a product link above or try an example to start tracking prices over time.</p>
        <a className="text-link" href="#main-content">Add a product ↑</a>
      </div>
    );
  }

  return (
    <div>
      {!signedIn ? (
        <div className="guest-sync-banner" role="status">
          <Icon name="lock" size={15} />
          <span>This watchlist is stored in your current browser. Sign in with Google to sync across your devices.</span>
        </div>
      ) : null}
      <div className="product-list">
      {products.map((product) => {
        const storeLabel = getStoreLabel(product.store, product.normalizedUrl, product.storeLabel);
        const reached =
          product.targetPrice != null &&
          (product.targetPriceReached || (product.lastPrice != null && product.lastPrice <= product.targetPrice));

        return (
          <Link className="product-card" href={`/products/${product._id}`} key={product._id}>
            <ProductImage src={product.imageUrl} alt={product.title} />
            <div className="product-card-main">
              <div className="product-title">{product.title}</div>
              <div className="product-meta">
                <span className="store-chip"><span className={`store-dot ${product.store}`} />{storeLabel}</span>
                <span className="scan-status"><span className={product.lastError ? "status-dot error-dot" : "status-dot"} />{product.lastError ? "Needs attention" : product.active === false ? "Paused" : product.lastScannedAt ? formatRelativeDate(product.lastScannedAt) : "Waiting"}</span>
                {product.mrp && product.lastPrice && product.mrp > product.lastPrice ? (
                  <span className="deal-pill">
                    {Math.round(((product.mrp - product.lastPrice) / product.mrp) * 100)}% off MRP
                  </span>
                ) : null}
              </div>
            </div>
            <div className="product-card-price">
              <span>Current price</span>
              <strong>{product.lastPrice != null ? formatMoney(product.lastPrice, product.currency) : "-"}</strong>
              {product.targetPrice ? (
                <span className={`target-card-badge ${reached ? "reached" : "pending"}`}>
                  {reached ? "🎯 Target reached" : `🎯 ${formatMoney(product.targetPrice, product.currency)}`}
                </span>
              ) : null}
            </div>
            <Icon name="arrow" size={18} />
          </Link>
        );
      })}
      </div>
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

function formatRelativeDate(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
