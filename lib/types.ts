import type { ObjectId } from "mongodb";

export type StoreKey = "amazon" | "flipkart" | "myntra" | "ajio";

export type ProductDocument = {
  _id?: ObjectId;
  url: string;
  normalizedUrl: string;
  userId?: string;
  store: StoreKey;
  title: string;
  imageUrl?: string;
  currency: string;
  active: boolean;
  scanEveryHours: number;
  nextScanAt: Date;
  lastScannedAt?: Date;
  lastPrice?: number;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type PriceSampleDocument = {
  _id?: ObjectId;
  productId: ObjectId;
  price: number;
  currency: string;
  inStock?: boolean;
  source: "direct" | "proxy";
  capturedAt: Date;
  createdAt: Date;
};

export type ScanResult = {
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  inStock?: boolean;
  source: "direct" | "proxy";
};

export type PriceStats = {
  sampleCount: number;
  highest?: { price: number; capturedAt: string };
  lowest?: { price: number; capturedAt: string };
  common?: { price: number; occurrences: number; percentage: number };
  current?: { price: number; capturedAt: string };
  changes: {
    count: number;
    averageHoursBetweenChanges?: number;
    averageDaysBetweenChanges?: number;
    description: string;
  };
};
