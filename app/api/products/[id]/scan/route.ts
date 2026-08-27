import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { getViewer } from "@/lib/viewer";
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
  const viewer = await getViewer();
  if (!viewer.userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const db = await getDb();
  const product = await db.collection<ProductDocument>("products").findOne({
    _id: new ObjectId(id),
    userId: viewer.userId
  });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  try {
    const updated = await scanAndSaveProduct(product.normalizedUrl, viewer.userId);
    return NextResponse.json({ product: { ...updated, _id: updated._id?.toString() } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scan failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
