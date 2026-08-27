import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { ensureIndexes, getDb } from "@/lib/db";
import { scanAndSaveProduct } from "@/lib/scanner";
import type { ProductDocument } from "@/lib/types";

const TrackSchema = z.object({
  url: z.string().url()
});

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id || "guest";

  await ensureIndexes();
  const db = await getDb();
  const products = await db
    .collection<ProductDocument>("products")
    .find({
      $or: [{ userId }, { userId: "guest" }, { userId: { $exists: false } }]
    })
    .sort({ updatedAt: -1 })
    .limit(50)
    .toArray();

  return NextResponse.json({
    products: products.map((product) => ({
      ...product,
      _id: product._id?.toString()
    }))
  });
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id || "guest";

    await ensureIndexes();
    const body = TrackSchema.parse(await request.json());
    const product = await scanAndSaveProduct(body.url, userId);

    return NextResponse.json({
      product: {
        ...product,
        _id: product._id?.toString()
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not track product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
