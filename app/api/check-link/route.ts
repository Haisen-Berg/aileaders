import { NextRequest, NextResponse } from "next/server";
import { verifyOne, isAcceptedUrl } from "@/lib/links/check";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  let body: { url?: unknown; expectedName?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  if (!isAcceptedUrl(url)) {
    return NextResponse.json({ error: "URL платформаси қўлланилмайди" }, { status: 400 });
  }
  const expectedName =
    typeof body.expectedName === "string" && body.expectedName.trim()
      ? body.expectedName.trim()
      : null;

  const r = await verifyOne(url, expectedName);
  return NextResponse.json(r);
}
