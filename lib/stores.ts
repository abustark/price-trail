import type { StoreKey } from "@/lib/types";

const STORE_HOSTS: Record<StoreKey, string[]> = {
  amazon: ["amazon.in", "www.amazon.in", "smile.amazon.in"],
  flipkart: ["flipkart.com", "www.flipkart.com", "dl.flipkart.com", "dl.dl.flipkart.com"],
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

  if (detectStore(input)) {
    return input;
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

  return resolvedUrl;
}

export function normalizeProductUrl(input: string): string {
  const url = new URL(input);
  url.hash = "";

  [...url.searchParams.keys()].forEach((key) => {
    if (!KEEP_PARAMS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  });

  return url.toString();
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

async function followKnownShortLink(input: string): Promise<string> {
  let current = input;

  for (let index = 0; index < 5; index += 1) {
    const response = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
      headers: {
        "accept-language": "en-IN,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
      },
      cache: "no-store"
    });

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

  const response = await fetch(input, {
    method: "GET",
    redirect: "follow",
    headers: {
      "accept-language": "en-IN,en;q=0.9",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    },
    cache: "no-store"
  });

  return response.url || current;
}
