import { NextRequest, NextResponse } from "next/server";
import { checkLinks, isAcceptedUrl, type LinkSampleSummary } from "@/lib/links/check";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: { urls?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.urls)) {
    return NextResponse.json({ error: "urls must be array" }, { status: 400 });
  }
  if (body.urls.length === 0) {
    return NextResponse.json({ error: "urls is empty" }, { status: 400 });
  }
  if (body.urls.length > 100) {
    return NextResponse.json({ error: "too many urls (max 100)" }, { status: 400 });
  }
  const urls: string[] = [];
  for (const u of body.urls) {
    if (typeof u !== "string") {
      return NextResponse.json({ error: "urls must be strings" }, { status: 400 });
    }
    const trimmed = u.trim();
    if (!isAcceptedUrl(trimmed)) {
      return NextResponse.json(
        { error: `URL платформаси қўлланилмайди: ${trimmed.slice(0, 80)}` },
        { status: 400 }
      );
    }
    urls.push(trimmed);
  }

  const results = await checkLinks(urls, { concurrency: 8, timeoutMs: 5000 });
  let alive = 0, dead = 0, timeouts = 0;
  const deadUrls: string[] = [];
  for (const r of results) {
    if (r.status === "alive") alive++;
    else if (r.status === "timeout") timeouts++;
    else dead++;
    if (r.status !== "alive" && deadUrls.length < 10) deadUrls.push(r.url);
  }
  const summary: LinkSampleSummary = { total: results.length, alive, dead, timeouts, deadUrls };
  return NextResponse.json(summary);
}
