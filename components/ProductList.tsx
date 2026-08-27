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
};

export function ProductList({ products, signedIn = true }: { products: ProductListItem[]; signedIn?: boolean }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Icon name={signedIn ? "spark" : "lock"} size={21} /></div>
        <strong>{signedIn ? "Your watchlist is ready." : "Your watchlist is private."}</strong>
        <p>{signedIn ? "Paste a product link above and we’ll start building its price story." : "Sign in with Google to save products and access your price history anywhere."}</p>
        <a className="text-link" href="#top">{signedIn ? "Add your first product ↑" : "Sign in above ↑"}</a>
      </div>
    );
  }

  return (
    <div className="product-list">
      {products.map((product) => {
        const storeLabel = getStoreLabel(product.store, product.normalizedUrl, product.storeLabel);
        return (
          <Link className="product-card" href={`/products/${product._id}`} key={product._id}>
            <ProductImage src={product.imageUrl} alt={product.title} />
            <div className="product-card-main">
              <div className="product-title">{product.title}</div>
              <div className="product-meta">
                <span className="store-chip"><span className={`store-dot ${product.store}`} />{storeLabel}</span>
                <span className="scan-status"><span className={product.lastError ? "status-dot error-dot" : "status-dot"} />{product.lastError ? "Scan needs attention" : product.active === false ? "Paused" : product.lastScannedAt ? `Updated ${formatRelativeDate(product.lastScannedAt)}` : "Waiting for first scan"}</span>
              </div>
            </div>
            <div className="product-card-price">
              <span>Current price</span>
              <strong>{product.lastPrice != null ? formatMoney(product.lastPrice, product.currency) : "-"}</strong>
            </div>
            <Icon name="arrow" size={18} />
          </Link>
        );
      })}
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
