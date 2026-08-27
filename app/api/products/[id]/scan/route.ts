import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { scanAndSaveProduct } from "@/lib/scanner";
import type { ProductDocument } from "@/lib/types";

type Params = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid product id." }, { status: 400 });
  }
  const session = await auth();
  const userId = session?.user?.id || "guest";

  const db = await getDb();
  const product = await db.collection<ProductDocument>("products").findOne({
    _id: new ObjectId(id),
    $or: [{ userId }, { userId: "guest" }, { userId: { $exists: false } }]
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  try {
    const updated = await scanAndSaveProduct(product.normalizedUrl, userId);
    return NextResponse.json({ product: { ...updated, _id: updated._id?.toString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
