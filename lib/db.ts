import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "price_tracker";

let clientPromise: Promise<MongoClient> | undefined;

export async function getMongoClient(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.");
  }

  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }

  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  return client.db(dbName);
}

export async function ensureIndexes() {
  const db = await getDb();

  await Promise.all([
    db.collection("products").createIndex({ normalizedUrl: 1 }, { unique: true }),
    db.collection("products").createIndex({ active: 1, nextScanAt: 1 }),
    db.collection("price_samples").createIndex({ productId: 1, capturedAt: -1 }),
    db.collection("price_samples").createIndex({ productId: 1, price: 1 })
  ]);
}
