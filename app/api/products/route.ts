import { NextResponse } from "next/server";
import { z } from "zod";
import { ensureIndexes, getDb } from "@/lib/db";
import { scanAndSaveProduct } from "@/lib/scanner";
import { getOrCreateViewer, getViewer, setGuestCookie } from "@/lib/viewer";
import type { ProductDocument } from "@/lib/types";

const TrackSchema = z.object({
  url: z.string().url()
});

export async function GET() {
  const viewer = await getViewer();
  if (!viewer.userId) return NextResponse.json({ products: [] });

  await ensureIndexes();
  const db = await getDb();
  const products = await db
    .collection<ProductDocument>("products")
    .find({ userId: viewer.userId })
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
    const viewer = await getOrCreateViewer();
    const body = TrackSchema.parse(await request.json());
    await ensureIndexes();
    const product = await scanAndSaveProduct(body.url, viewer.userId);

    const response = NextResponse.json({
      product: {
        ...product,
        _id: product._id?.toString()
      }
    });
    setGuestCookie(response, viewer.createdGuestId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not track product.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
