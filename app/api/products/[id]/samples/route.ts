import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { PriceSampleDocument, ProductDocument } from "@/lib/types";

type Params = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }

  const db = await getDb();
  const productId = new ObjectId(id);
  const product = await db.collection<ProductDocument>("products").findOne({ _id: productId });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const result = await db.collection<PriceSampleDocument>("price_samples").deleteMany({ productId });
  await db.collection<ProductDocument>("products").updateOne(
    { _id: productId },
    {
      $unset: {
        lastPrice: "",
        lastError: "",
        lastScannedAt: ""
      },
      $set: {
        updatedAt: new Date()
      }
    }
  );

  return NextResponse.json({ deleted: result.deletedCount });
}
