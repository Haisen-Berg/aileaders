import { AISTUDY_RE, COURSERA_RE } from "@/lib/xlsx/parser";

export type LinkStatus = "alive" | "dead" | "timeout";

export interface LinkResult {
  url: string;
  status: LinkStatus;
  httpStatus: number | null;
  error: string | null;
}

export interface LinkSampleSummary {
  total: number;
  alive: number;
  dead: number;
  timeouts: number;
  deadUrls: string[];
}

export function isAcceptedUrl(url: string): boolean {
  return AISTUDY_RE.test(url) || COURSERA_RE.test(url);
}

// Deterministic LCG-based shuffle so results are reproducible across reloads of the same data.
function deterministicSample<T>(arr: T[], n: number, seed = 1): T[] {
  if (arr.length <= n) return arr.slice();
  const idx = arr.map((_, i) => i);
  let s = seed >>> 0;
  for (let i = idx.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map((i) => arr[i]);
}

async function checkOne(url: string, timeoutMs: number): Promise<LinkResult> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    // Some servers reject HEAD; fall back to GET-with-no-body via Range.
    let res = await fetch(url, { method: "HEAD", signal: ac.signal, redirect: "follow" });
    if (res.status === 405 || res.status === 501) {
      res = await fetch(url, {
        method: "GET",
        signal: ac.signal,
        redirect: "follow",
        headers: { Range: "bytes=0-0" },
      });
    }
    const alive = res.status >= 200 && res.status < 400;
    return {
      url,
      status: alive ? "alive" : "dead",
      httpStatus: res.status,
      error: alive ? null : `HTTP ${res.status}`,
    };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return { url, status: "timeout", httpStatus: null, error: "timeout" };
    }
    return { url, status: "dead", httpStatus: null, error: err?.message ?? "network error" };
  } finally {
    clearTimeout(t);
  }
}

export async function checkLinks(
  urls: string[],
  opts: { concurrency?: number; timeoutMs?: number } = {}
): Promise<LinkResult[]> {
  const concurrency = opts.concurrency ?? 8;
  const timeoutMs = opts.timeoutMs ?? 5000;
  const results: LinkResult[] = new Array(urls.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, urls.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= urls.length) return;
        results[i] = await checkOne(urls[i], timeoutMs);
      }
    })
  );
  return results;
}

export async function sampleAndCheck(
  allUrls: string[],
  sampleSize = 50
): Promise<LinkSampleSummary> {
  const sample = deterministicSample(allUrls, sampleSize);
  const results = await checkLinks(sample, { concurrency: 8, timeoutMs: 5000 });
  let alive = 0;
  let dead = 0;
  let timeouts = 0;
  const deadUrls: string[] = [];
  for (const r of results) {
    if (r.status === "alive") alive++;
    else if (r.status === "timeout") timeouts++;
    else dead++;
    if (r.status !== "alive" && deadUrls.length < 10) deadUrls.push(r.url);
  }
  return { total: results.length, alive, dead, timeouts, deadUrls };
}

export async function checkSingle(url: string): Promise<LinkResult> {
  return checkOne(url, 8000);
}
