import { NextResponse } from "next/server";
import { ensureIndexes } from "@/lib/db";
import { scanDueProducts } from "@/lib/scanner";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET;
  const token = new URL(request.url).searchParams.get("token") || request.headers.get("x-cron-secret");
  const userAgent = request.headers.get("user-agent") || "";

  if (configuredSecret && token !== configuredSecret && userAgent !== "vercel-cron/1.0") {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  await ensureIndexes();
  const results = await scanDueProducts(20);
  return NextResponse.json({ scanned: results.length, results });
}
