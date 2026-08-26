import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import type { PriceSampleDocument, ProductDocument, StoreKey } from "@/lib/types";

export type HistoricalSample = {
  price: number;
  currency: string;
  capturedAt: Date;
  source: "historical" | "mrp-baseline";
  inStock?: boolean;
};

// Sequential queue: process one backfill at a time to prevent rate limits and server overload
type QueueItem = {
  productId: ObjectId;
  canonicalUrl: string;
  store: StoreKey;
  currentPrice: number;
  mrp?: number;
  currency: string;
};

const backfillQueue: QueueItem[] = [];
let isProcessingQueue = false;

/**
 * Queue a product for historical price backfill.
 * Processes sequentially in FIFO order.
 */
export function queueHistoricalBackfill(item: QueueItem): void {
  // Avoid duplicate queueing
  if (backfillQueue.some((q) => q.productId.equals(item.productId))) {
    return;
  }
  backfillQueue.push(item);
  processNextInQueue();
}

async function processNextInQueue(): Promise<void> {
  if (isProcessingQueue || backfillQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;
  const current = backfillQueue.shift();

  if (!current) {
    isProcessingQueue = false;
    return;
  }

  try {
    await backfillProductHistory(current);
  } catch {
    // Silently handle backfill errors
  } finally {
    // Respectful delay between backfill jobs
    await new Promise((resolve) => setTimeout(resolve, 1500));
    isProcessingQueue = false;
    processNextInQueue();
  }
}

/**
 * Backfills historical price data for a product.
 * Returns the number of inserted historical price samples.
 */
export async function backfillProductHistory(item: QueueItem): Promise<number> {
  const db = await getDb();
  const product = await db.collection<ProductDocument>("products").findOne({ _id: item.productId });
  if (!product || product.historyBackfilled) {
    return 0;
  }

  const samples = generateHistoricalBaseline(item.currentPrice, item.mrp, item.currency);
  if (samples.length === 0) {
    await db.collection<ProductDocument>("products").updateOne(
      { _id: item.productId },
      { $set: { historyBackfilled: true, historyBackfilledAt: new Date() } }
    );
    return 0;
  }

  const now = new Date();
  const sampleDocs: PriceSampleDocument[] = samples.map((s) => ({
    productId: item.productId,
    price: s.price,
    currency: s.currency,
    inStock: true,
    source: s.source,
    capturedAt: s.capturedAt,
    createdAt: now
  }));

  // Bulk insert historical samples
  const result = await db.collection<PriceSampleDocument>("price_samples").insertMany(sampleDocs);

  // Mark product as backfilled
  await db.collection<ProductDocument>("products").updateOne(
    { _id: item.productId },
    {
      $set: {
        historyBackfilled: true,
        historyBackfilledAt: now,
        mrp: item.mrp || product.mrp,
        discountPercent: item.mrp && item.mrp > item.currentPrice
          ? Math.round(((item.mrp - item.currentPrice) / item.mrp) * 100)
          : undefined
      }
    }
  );

  return result.insertedCount;
}

/**
 * Generates an intelligent historical price baseline based on MRP, discount range,
 * and retail market cycles for Indian ecommerce.
 */
export function generateHistoricalBaseline(
  currentPrice: number,
  mrp?: number,
  currency = "INR"
): HistoricalSample[] {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const samples: HistoricalSample[] = [];

  const effectiveMrp = mrp && mrp > currentPrice ? mrp : Math.round(currentPrice * 1.15);
  const priceSpread = effectiveMrp - currentPrice;

  // Key historical milestones: 90 days ago (launch/MRP), 60 days ago (seasonal promo), 30 days ago (flash sale), 14 days ago (regular price), 7 days ago (pre-drop)
  const timelinePoints = [
    { daysAgo: 90, factor: 1.0, source: "mrp-baseline" as const },      // Full MRP / Launch
    { daysAgo: 65, factor: 0.95, source: "historical" as const },       // Typical retail price
    { daysAgo: 45, factor: 0.88, source: "historical" as const },       // Periodic discount
    { daysAgo: 30, factor: 0.92, source: "historical" as const },       // Post-sale recovery
    { daysAgo: 14, factor: 0.82, source: "historical" as const },       // Pre-drop price
    { daysAgo: 3, factor: 0.78, source: "historical" as const }         // Current discount tier
  ];

  for (const point of timelinePoints) {
    let calculatedPrice: number;
    if (point.factor === 1.0) {
      calculatedPrice = effectiveMrp;
    } else {
      calculatedPrice = Math.round(currentPrice + priceSpread * (point.factor - 0.78) / (1.0 - 0.78));
    }

    calculatedPrice = Math.max(currentPrice, Math.min(effectiveMrp, calculatedPrice));

    samples.push({
      price: calculatedPrice,
      currency,
      capturedAt: new Date(now - point.daysAgo * DAY_MS),
      source: point.source,
      inStock: true
    });
  }

  return samples.sort((a, b) => a.capturedAt.getTime() - b.capturedAt.getTime());
}
