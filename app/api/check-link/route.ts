import { NextRequest, NextResponse } from "next/server";
import { checkSingle, isAcceptedUrl } from "@/lib/links/check";

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });
  // Restrict targets to known certificate platforms — prevents using this endpoint as an open proxy
  if (!isAcceptedUrl(url)) {
    return NextResponse.json({ error: "URL платформаси қўлланилмайди" }, { status: 400 });
  }
  const r = await checkSingle(url);
  return NextResponse.json({
    alive: r.status === "alive",
    status: r.status,
    httpStatus: r.httpStatus,
    error: r.error,
  });
}
