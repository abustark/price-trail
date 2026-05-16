import type { StoreKey } from "@/lib/types";

const STORE_HOSTS: Record<StoreKey, string[]> = {
  amazon: ["amazon.in", "www.amazon.in", "smile.amazon.in"],
  flipkart: ["flipkart.com", "www.flipkart.com"],
  myntra: ["myntra.com", "www.myntra.com"],
  ajio: ["ajio.com", "www.ajio.com"]
};

const SHORT_LINK_HOSTS: Partial<Record<StoreKey, string[]>> = {
  amazon: ["amzn.in", "amzn.to", "a.co"],
  flipkart: ["fkrt.it", "dl.flipkart.com", "dl.dl.flipkart.com"],
  ajio: ["ajiio.in"]
};

const KEEP_PARAMS = new Set([
  "affExtParam1",
  "affExtParam2",
  "affid",
  "asin",
  "lid",
  "marketplace",
  "pid",
  "psc",
  "sku",
  "tag",
  "th",
  "variant"
].map((key) => key.toLowerCase()));

export function detectStore(input: string): StoreKey | null {
  try {
    const url = new URL(input);
    const hostname = normalizeHostname(url.hostname);
    const match = Object.entries(STORE_HOSTS).find(([, hosts]) => hosts.includes(hostname));
    return match?.[0] as StoreKey | null;
  } catch {
    return null;
  }
}

export function detectShortLinkStore(input: string): StoreKey | null {
  try {
    const url = new URL(input);
    const hostname = normalizeHostname(url.hostname);
    const match = Object.entries(SHORT_LINK_HOSTS).find(([, hosts]) => hosts?.includes(hostname));
    return match?.[0] as StoreKey | null;
  } catch {
    return null;
  }
}

export async function resolveSupportedProductUrl(input: string): Promise<string> {
  const url = new URL(input);
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Only http and https product links are supported.");
  }

  const directStore = detectStore(input);
  if (directStore) {
    return canonicalizeStoreUrl(input, directStore);
  }

  const shortLinkStore = detectShortLinkStore(input);
  if (!shortLinkStore) {
    throw new Error("Only Amazon India, Flipkart, Myntra and Ajio links are supported.");
  }

  const resolvedUrl = await followKnownShortLink(input);
  const resolvedStore = detectStore(resolvedUrl);
  if (!resolvedStore || resolvedStore !== shortLinkStore) {
    throw new Error("The short link did not resolve to a supported ecommerce product page.");
  }

  return canonicalizeStoreUrl(resolvedUrl, resolvedStore);
}

export function normalizeProductUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";

  [...url.searchParams.keys()].forEach((key) => {
    if (!KEEP_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  });

  const store = detectStore(url.toString());
  return store ? canonicalizeStoreUrl(url.toString(), store) : url.toString();
}

export function assertAllowedProductUrl(input: string): { store: StoreKey; normalizedUrl: string } {
  const url = new URL(input);
  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error("Only http and https product links are supported.");
  }

  const store = detectStore(input);
  if (!store) {
    throw new Error("Only Amazon India, Flipkart, Myntra and Ajio links are supported.");
  }

  return { store, normalizedUrl: normalizeProductUrl(input) };
}

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^m\./, "www.");
}

export function canonicalizeStoreUrl(input: string, store: StoreKey): string {
  const url = new URL(input);
  url.protocol = "https:";

  if (store === "flipkart") {
    url.hostname = "www.flipkart.com";
  }

  if (store === "amazon" && url.hostname.toLowerCase() === "amazon.in") {
    url.hostname = "www.amazon.in";
  }

  url.hash = "";
  return url.toString();
}

async function followKnownShortLink(input: string): Promise<string> {
  let current = input;

  for (let index = 0; index < 5; index += 1) {
    const response = await fetchRedirect(current, "HEAD");

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) break;
      current = new URL(location, current).toString();
      if (detectStore(current)) return current;
      if (!detectShortLinkStore(current)) break;
      continue;
    }

    if (response.url && response.url !== current) {
      current = response.url;
    }
    break;
  }

  if (detectStore(current)) return current;

  const response = await fetchRedirect(input, "GET");

  return response.url || current;
}

async function fetchRedirect(input: string, method: "GET" | "HEAD") {
  try {
    return await fetch(input, {
      method,
      redirect: method === "GET" ? "follow" : "manual",
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-encoding": "gzip, deflate, br",
        "accept-language": "en-IN,en-US;q=0.9,en;q=0.8",
        "cache-control": "no-cache",
        pragma: "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"125\", \"Google Chrome\";v=\"125\", \"Not.A/Brand\";v=\"24\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "none",
        "upgrade-insecure-requests": "1",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
      },
      cache: "no-store"
    });
  } catch {
    if (method === "HEAD") {
      return fetchRedirect(input, "GET");
    }
    throw new Error("Could not resolve this short link. Paste the final www.flipkart.com product URL if the short link fails.");
  }
}
