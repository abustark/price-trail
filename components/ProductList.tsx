import Link from "next/link";

type ProductListItem = {
  _id?: string;
  title: string;
  store: string;
  imageUrl?: string;
  currency: string;
  lastPrice?: number;
  lastScannedAt?: string;
  lastError?: string;
};

export function ProductList({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>Sign in, then paste a product link above to start your saved price history.</p>
      </div>
    );
  }

  return (
    <div className="product-list">
      {products.map((product) => (
        <Link className="product-card" href={`/products/${product._id}`} key={product._id}>
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="product-image" src={product.imageUrl} alt="" />
          ) : (
            <span className="product-image" />
          )}
          <div>
            <div className="product-title">{product.title}</div>
            <div className="product-meta">
              <span className="meta-chip">{product.store}</span>
              <span className="meta-chip">{product.lastScannedAt ? formatDate(product.lastScannedAt) : "Not scanned"}</span>
              {product.lastError ? <span className="meta-chip error">Last scan failed</span> : null}
            </div>
          </div>
          <div className="price">{product.lastPrice ? formatMoney(product.lastPrice, product.currency) : "No price"}</div>
        </Link>
      ))}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
