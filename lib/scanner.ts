import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { assertAllowedProductUrl, resolveSupportedProductUrl } from "@/lib/stores";
import type { PriceSampleDocument, ProductDocument, ScanResult, StoreKey } from "@/lib/types";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

type ParsedProduct = {
  title: string;
  price?: number;
  currency: string;
  imageUrl?: string;
  inStock?: boolean;
};

type ProxyConfig = {
  endpoint?: string;
  token?: string;
  urlParam: string;
  tokenParam?: string;
  authHeader?: string;
};

export async function fetchProductSnapshot(url: string): Promise<ScanResult> {
  const { store } = assertAllowedProductUrl(url);
  const direct = await fetchHtml(url, "direct");
  const parsed = parseProductHtml(direct.html, store);

  if (parsed.price) {
    return { ...parsed, price: parsed.price, source: direct.source };
  }

  if (process.env.SCRAPER_PROXY_ENDPOINT) {
    const proxy = await fetchHtml(url, "proxy");
    const proxyParsed = parseProductHtml(proxy.html, store);
    if (proxyParsed.price) {
      return { ...proxyParsed, price: proxyParsed.price, source: proxy.source };
    }
  }

  throw new Error("Could not find a product price. The store may have blocked the request or changed its page format.");
}

export async function scanAndSaveProduct(inputUrl: string, userId?: string): Promise<ProductDocument> {
  const resolvedUrl = await resolveSupportedProductUrl(inputUrl);
  const { store, normalizedUrl } = assertAllowedProductUrl(resolvedUrl);
  const snapshot = await fetchProductSnapshot(normalizedUrl);
  const db = await getDb();
  const now = new Date();

  const existing = await db.collection<ProductDocument>("products").findOne({ normalizedUrl, userId });
  const productId = existing?._id || new ObjectId();

  const productUpdate: Omit<ProductDocument, "_id" | "createdAt"> = {
    url: resolvedUrl,
    normalizedUrl,
    userId,
    store,
    title: snapshot.title,
    imageUrl: snapshot.imageUrl,
    currency: snapshot.currency,
    active: true,
    scanEveryHours: existing?.scanEveryHours || 6,
    nextScanAt: new Date(now.getTime() + (existing?.scanEveryHours || 6) * 60 * 60 * 1000),
    lastScannedAt: now,
    lastPrice: snapshot.price,
    updatedAt: now
  };

  await db.collection<ProductDocument>("products").updateOne(
    { _id: productId },
    {
      $set: productUpdate,
      $setOnInsert: {
        _id: productId,
        createdAt: now
      }
    },
    { upsert: true }
  );

  await db.collection<PriceSampleDocument>("price_samples").insertOne({
    productId,
    price: snapshot.price,
    currency: snapshot.currency,
    inStock: snapshot.inStock,
    source: snapshot.source,
    capturedAt: now,
    createdAt: now
  });

  return {
    _id: productId,
    createdAt: existing?.createdAt || now,
    ...productUpdate
  };
}

export async function scanDueProducts(limit = 20) {
  const db = await getDb();
  const now = new Date();
  const products = await db
    .collection<ProductDocument>("products")
    .find({ active: true, nextScanAt: { $lte: now } })
    .sort({ nextScanAt: 1 })
    .limit(limit)
    .toArray();

  const results = [];
  for (const product of products) {
    try {
      const updated = await scanAndSaveProduct(product.normalizedUrl, product.userId);
      results.push({ id: updated._id?.toString(), ok: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown scan error";
      await db.collection<ProductDocument>("products").updateOne(
        { _id: product._id },
        {
          $set: {
            lastError: message,
            nextScanAt: new Date(now.getTime() + product.scanEveryHours * 60 * 60 * 1000),
            updatedAt: now
          }
        }
      );
      results.push({ id: product._id?.toString(), ok: false, error: message });
    }
  }

  return results;
}

async function fetchHtml(url: string, mode: "direct" | "proxy"): Promise<{ html: string; source: "direct" | "proxy" }> {
  const proxyConfig = getProxyConfig();
  const target = mode === "proxy" ? buildProxyUrl(url, proxyConfig) : url;

  const response = await fetch(target, {
    headers: {
      "accept-language": "en-IN,en;q=0.9",
      "user-agent": USER_AGENT,
      ...buildProxyHeaders(proxyConfig)
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Fetch failed with HTTP ${response.status}`);
  }

  return { html: await response.text(), source: mode };
}

function getProxyConfig(): ProxyConfig {
  return {
    endpoint: process.env.SCRAPER_PROXY_ENDPOINT,
    token: process.env.SCRAPER_PROXY_TOKEN,
    urlParam: process.env.SCRAPER_PROXY_URL_PARAM || "url",
    tokenParam: process.env.SCRAPER_PROXY_TOKEN_PARAM || "token",
    authHeader: process.env.SCRAPER_PROXY_AUTH_HEADER
  };
}

function buildProxyUrl(url: string, config: ProxyConfig): string {
  if (!config.endpoint) return url;

  const proxy = new URL(config.endpoint);
  proxy.searchParams.set(config.urlParam, url);
  if (config.token && config.tokenParam && !config.authHeader) {
    proxy.searchParams.set(config.tokenParam, config.token);
  }

  return proxy.toString();
}

function buildProxyHeaders(config: ProxyConfig): Record<string, string> {
  if (!config.token || !config.authHeader) return {};
  return { [config.authHeader]: config.token };
}

function parseProductHtml(html: string, store: StoreKey): ParsedProduct {
  const jsonLd = parseJsonLd(html);
  const meta = parseMeta(html);
  const title = cleanText(jsonLd.title || meta.title || extractTitle(html) || "Tracked product");
  const price = jsonLd.price || meta.price || parseStoreSpecificPrice(html, store) || parseVisiblePrice(html);
  const currency = jsonLd.currency || meta.currency || "INR";
  const imageUrl = jsonLd.imageUrl || meta.imageUrl;

  return {
    title,
    price,
    currency,
    imageUrl,
    inStock: !/out of stock|currently unavailable|sold out/i.test(html)
  };
}

function parseJsonLd(html: string) {
  const matches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);

  for (const match of matches) {
    const content = decodeHtml(match[1].trim());
    const candidates = parseJsonSafely(content);
    for (const item of flattenJsonLd(candidates)) {
      const type = Array.isArray(item?.["@type"]) ? item["@type"].join(" ") : item?.["@type"];
      if (!/product/i.test(String(type || "")) && !item?.offers) continue;

      const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
      const price = toPrice(offer?.price || offer?.lowPrice || item.price);
      if (price) {
        return {
          title: item.name,
          price,
          currency: offer?.priceCurrency || item.priceCurrency || "INR",
          imageUrl: Array.isArray(item.image) ? item.image[0] : item.image
        };
      }
    }
  }

  return {};
}

function parseMeta(html: string) {
  const meta = (name: string) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const match = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"));
    return match ? decodeHtml(match[1]) : undefined;
  };

  return {
    title: meta("og:title"),
    price: toPrice(meta("product:price:amount") || meta("og:price:amount")),
    currency: meta("product:price:currency") || meta("og:price:currency") || "INR",
    imageUrl: meta("og:image")
  };
}

function parseStoreSpecificPrice(html: string, store: StoreKey): number | undefined {
  const decoded = decodeHtml(html);
  const candidates: Array<number | undefined> = [];

  if (store === "flipkart") {
    candidates.push(
      parseFirst(decoded, /class=["'][^"']*(?:_30jeq3|Nx9bqj|CxhGGd)[^"']*["'][^>]*>\s*₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/i),
      parseFirst(decoded, /"finalPrice"\s*:\s*\{[^{}]*"value"\s*:\s*([0-9,.]+)/i),
      parseFirst(decoded, /"sellingPrice"\s*:\s*\{[^{}]*"value"\s*:\s*([0-9,.]+)/i),
      parseFirst(decoded, /"discountedPrice"\s*:\s*([0-9,.]+)/i)
    );
  }

  if (store === "amazon") {
    candidates.push(
      parseFirst(decoded, /class=["'][^"']*a-price-whole[^"']*["'][^>]*>\s*([0-9,]+)\s*</i),
      parseFirst(decoded, /id=["']priceblock_(?:ourprice|dealprice|saleprice)["'][^>]*>\s*₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/i),
      parseFirst(decoded, /"priceToPay"\s*:\s*\{[^{}]*"amount"\s*:\s*([0-9,.]+)/i)
    );
  }

  if (store === "myntra") {
    candidates.push(
      parseFirst(decoded, /class=["'][^"']*pdp-price[^"']*["'][^>]*>\s*₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/i),
      parseFirst(decoded, /"discountedPrice"\s*:\s*([0-9,.]+)/i),
      parseFirst(decoded, /"price"\s*:\s*([0-9,.]+)\s*,\s*"discountedPrice"/i)
    );
  }

  if (store === "ajio") {
    candidates.push(
      parseFirst(decoded, /class=["'][^"']*(?:prod-sp|price)[^"']*["'][^>]*>\s*₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/i),
      parseFirst(decoded, /"wasPriceData"\s*:\s*\{[^{}]*"value"\s*:\s*([0-9,.]+)/i),
      parseFirst(decoded, /"price"\s*:\s*\{[^{}]*"formattedValue"[^{}]*₹\s*([0-9,]+(?:\.[0-9]{1,2})?)/i)
    );
  }

  return candidates.find((price) => price && price > 0);
}

function parseVisiblePrice(html: string): number | undefined {
  const patterns = [/data-price=["']([0-9,.]+)["']/i, /itemprop=["']price["'][^>]+content=["']([0-9,.]+)["']/i];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    const price = toPrice(match?.[1]);
    if (price) return price;
  }

  return undefined;
}

function parseFirst(value: string, pattern: RegExp): number | undefined {
  const match = value.match(pattern);
  return toPrice(match?.[1]);
}

function extractTitle(html: string): string | undefined {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeHtml(match[1]) : undefined;
}

function parseJsonSafely(value: string): unknown[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [];
  }
}

function flattenJsonLd(items: unknown[]): any[] {
  const output: any[] = [];
  for (const item of items as any[]) {
    if (Array.isArray(item?.["@graph"])) output.push(...item["@graph"]);
    output.push(item);
  }
  return output;
}

function toPrice(value: unknown): number | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const price = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(price) && price > 0 ? price : undefined;
}

function cleanText(value: string): string {
  return decodeHtml(value).replace(/\s+/g, " ").trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, "\"")
    .replace(/&amp;/g, "&")
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}
