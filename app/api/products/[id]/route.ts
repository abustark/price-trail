import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { calculatePriceStats } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import type { PriceSampleDocument, ProductDocument } from "@/lib/types";

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const db = await getDb();
  const productId = new ObjectId(id);
  const product = await db.collection<ProductDocument>("products").findOne({ _id: productId, userId: session.user.id });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const samples = await db
    .collection<PriceSampleDocument>("price_samples")
    .find({ productId })
    .sort({ capturedAt: 1 })
    .limit(1000)
    .toArray();

  return NextResponse.json({
    product: {
      ...product,
      _id: product._id?.toString()
    },
    samples: samples.map((sample) => ({
      ...sample,
      _id: sample._id?.toString(),
      productId: sample.productId.toString()
    })),
    stats: calculatePriceStats(samples)
  });
}
