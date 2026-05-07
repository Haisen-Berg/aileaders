import { AISTUDY_RE, COURSERA_RE } from "@/lib/xlsx/parser";
import { namesMatch } from "@/lib/normalize/name";

export type LinkStatus = "alive" | "dead" | "timeout";

export type VerifyStatus =
  | "verified"        // page is live and (if expectedName given) name matches
  | "name_mismatch"   // page live but recipient name doesn't match expected
  | "not_found"       // 404 / cert ID doesn't exist
  | "dead"            // network error or HTML present but no name parseable
  | "timeout";

export interface VerifyResult {
  url: string;
  status: VerifyStatus;
  foundName: string | null;
  expectedName: string | null;
  httpStatus: number | null;
  error: string | null;
}

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

// HTML decode a small subset (enough for HTML attribute / text content)
function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

// Defensive Coursera HTML name extraction. Coursera changes markup occasionally,
// so we try multiple patterns and return the first hit.
function parseCourseraName(html: string): string | null {
  const patterns: RegExp[] = [
    // og:title content like: "Ivan Ivanov earned a Coursera certificate ..."
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+?)\s+(?:earned|completed|has earned)/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+?)\s+(?:earned|completed|has earned)/i,
    // Title tag fallback
    /<title>([^<|]+?)\s+(?:earned|completed|has earned)/i,
    // Page heading: "Completed by Иванов И.И."
    /Completed by\s*<[^>]*>([^<]+?)<\/[^>]+>/i,
    /Completed by\s+([^<\n]{2,80}?)\s*(?:<|\.|,)/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const name = decodeHtml(m[1]).trim();
      if (name.length >= 2 && name.length <= 120) return name;
    }
  }
  return null;
}

export async function verifyCoursera(
  url: string,
  expectedName: string | null,
  timeoutMs = 8000
): Promise<VerifyResult> {
  const m = url.match(COURSERA_RE);
  if (!m) {
    return { url, status: "dead", foundName: null, expectedName, httpStatus: null, error: "URL формат носат." };
  }
  const certId = m[1];
  const verifyUrl = `https://www.coursera.org/account/accomplishments/verify/${certId}`;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(verifyUrl, {
      method: "GET",
      signal: ac.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (res.status === 404) {
      return { url, status: "not_found", foundName: null, expectedName, httpStatus: 404, error: null };
    }
    if (res.status < 200 || res.status >= 400) {
      return {
        url, status: "dead", foundName: null, expectedName,
        httpStatus: res.status, error: `HTTP ${res.status}`,
      };
    }
    const html = await res.text();
    const foundName = parseCourseraName(html);
    if (!foundName) {
      // Live page but couldn't extract name — likely "certificate not found" page
      return {
        url, status: "not_found", foundName: null, expectedName,
        httpStatus: res.status, error: "Сертификат маълумоти топилмади",
      };
    }
    if (!expectedName) {
      return { url, status: "verified", foundName, expectedName: null, httpStatus: res.status, error: null };
    }
    const ok = namesMatch(expectedName, foundName);
    return {
      url,
      status: ok ? "verified" : "name_mismatch",
      foundName,
      expectedName,
      httpStatus: res.status,
      error: ok ? null : "Имя на сертификате не совпадает",
    };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return { url, status: "timeout", foundName: null, expectedName, httpStatus: null, error: "timeout" };
    }
    return {
      url, status: "dead", foundName: null, expectedName,
      httpStatus: null, error: err?.message ?? "network error",
    };
  } finally {
    clearTimeout(t);
  }
}

// AiStudy: HEAD-only check (we don't yet know the page structure for name parsing)
export async function verifyAistudy(
  url: string,
  expectedName: string | null,
  timeoutMs = 8000
): Promise<VerifyResult> {
  const r = await checkOne(url, timeoutMs);
  if (r.status === "alive") {
    return { url, status: "verified", foundName: null, expectedName, httpStatus: r.httpStatus, error: null };
  }
  if (r.status === "timeout") {
    return { url, status: "timeout", foundName: null, expectedName, httpStatus: null, error: "timeout" };
  }
  return {
    url,
    status: r.httpStatus === 404 ? "not_found" : "dead",
    foundName: null,
    expectedName,
    httpStatus: r.httpStatus,
    error: r.error,
  };
}

export async function verifyOne(
  url: string,
  expectedName: string | null,
  timeoutMs = 8000
): Promise<VerifyResult> {
  if (COURSERA_RE.test(url)) return verifyCoursera(url, expectedName, timeoutMs);
  if (AISTUDY_RE.test(url)) return verifyAistudy(url, expectedName, timeoutMs);
  return { url, status: "dead", foundName: null, expectedName, httpStatus: null, error: "URL платформаси қўлланилмайди" };
}

// Concurrent verify-batch helper
export async function verifyMany(
  items: { url: string; expectedName: string | null }[],
  opts: { concurrency?: number; timeoutMs?: number } = {}
): Promise<VerifyResult[]> {
  const concurrency = opts.concurrency ?? 4;
  const timeoutMs = opts.timeoutMs ?? 8000;
  const results: VerifyResult[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        results[i] = await verifyOne(items[i].url, items[i].expectedName, timeoutMs);
      }
    })
  );
  return results;
}
