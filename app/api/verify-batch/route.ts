import { NextRequest, NextResponse } from "next/server";
import { verifyMany, isAcceptedUrl, type VerifyResult } from "@/lib/links/check";

export const maxDuration = 60;

interface BatchItem {
  url: string;
  expectedName: string | null;
}

export async function POST(req: NextRequest) {
  let body: { items?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.items)) {
    return NextResponse.json({ error: "items must be array" }, { status: 400 });
  }
  if (body.items.length === 0) {
    return NextResponse.json({ error: "items is empty" }, { status: 400 });
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: "too many items (max 50)" }, { status: 400 });
  }

  const items: BatchItem[] = [];
  for (const raw of body.items) {
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "items must be objects" }, { status: 400 });
    }
    const r = raw as { url?: unknown; expectedName?: unknown };
    if (typeof r.url !== "string") {
      return NextResponse.json({ error: "item.url must be string" }, { status: 400 });
    }
    const url = r.url.trim();
    if (!isAcceptedUrl(url)) {
      return NextResponse.json(
        { error: `URL платформаси қўлланилмайди: ${url.slice(0, 80)}` },
        { status: 400 }
      );
    }
    const expectedName =
      typeof r.expectedName === "string" && r.expectedName.trim()
        ? r.expectedName.trim()
        : null;
    items.push({ url, expectedName });
  }

  const results: VerifyResult[] = await verifyMany(items, {
    concurrency: 4,
    timeoutMs: 8000,
  });
  return NextResponse.json({ results });
}
