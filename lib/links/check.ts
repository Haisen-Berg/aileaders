import https from "node:https";
import { AISTUDY_RE, COURSERA_RE } from "@/lib/xlsx/parser";
import { namesMatch } from "@/lib/normalize/name";

// Some cert-verification domains (aistudy.uz, coursera.org) use CA chains not trusted
// by the server's Node.js store. We use a single permissive agent scoped only to this
// module's outbound HTTPS — global SSL verification is unchanged.
const PERMISSIVE_AGENT = new https.Agent({ rejectUnauthorized: false });

interface SimpleResponse {
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}

function fetchInsecure(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal
): Promise<SimpleResponse> {
  const parsed = new URL(url);
  return new Promise((resolve, reject) => {
    const req = https.request(
      { agent: PERMISSIVE_AGENT, hostname: parsed.hostname, path: parsed.pathname + parsed.search, method: "GET", headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          resolve({
            status: res.statusCode ?? 0,
            text: () => Promise.resolve(text),
            json: () => { try { return Promise.resolve(JSON.parse(text)); } catch (e) { return Promise.reject(e); } },
          });
        });
        res.on("error", reject);
      }
    );
    req.on("error", reject);
    signal.addEventListener("abort", () => req.destroy(new Error("AbortError")));
    req.end();
  });
}

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

// Coursera SSRs the page with `window.__APOLLO_STATE__ = {...}`.
// Existence: MembershipsV1Resource({"code":"CERT_ID"}) → null (not found) or object (found).
// Name (2024+ structure): AccomplishmentsSignatureTrackProfile with firstName/lastName.
// Legacy name fields kept as fallback.
function parseCourseraApolloState(html: string, certId: string): {
  exists: boolean;
  foundName: string | null;
} {
  const apolloIdx = html.indexOf("__APOLLO_STATE__");

  // Existence check — key is backslash-escaped in the SSR'd JSON string.
  const codeRe = new RegExp(
    `MembershipsV1Resource\\(\\{\\\\?"code\\\\?":\\\\?"${certId}\\\\?"\\}\\)\\\\?":\\s*(null|\\{)`,
    "i"
  );
  const codeMatch = html.match(codeRe);
  let exists = false;
  if (codeMatch) {
    if (codeMatch[1].trim() === "null") {
      return { exists: false, foundName: null };
    }
    exists = true;
  } else if (apolloIdx >= 0) {
    const certNullRe = new RegExp(`"${certId}\\\\?"[^a-zA-Z0-9]{0,20}\\}\\)\\\\?":\\s*null`, "i");
    if (certNullRe.test(html)) return { exists: false, foundName: null };
    if (html.indexOf(certId, apolloIdx) >= 0) exists = true;
  }

  // Name extraction — try current (2024+) structure first, then legacy fallbacks.

  // Current: AccomplishmentsSignatureTrackProfile { firstName, lastName }
  const sigM = html.match(/"__typename":"AccomplishmentsSignatureTrackProfile","firstName":"([^"]{1,80})","lastName":"([^"]{1,80})"/);
  if (sigM) {
    const name = `${sigM[2]} ${sigM[1]}`.trim(); // lastName firstName (Uzbek order)
    if (name.length >= 2) return { exists: true, foundName: decodeHtml(name) };
  }
  // Reversed field order variant
  const sigM2 = html.match(/"__typename":"AccomplishmentsSignatureTrackProfile","lastName":"([^"]{1,80})","firstName":"([^"]{1,80})"/);
  if (sigM2) {
    const name = `${sigM2[1]} ${sigM2[2]}`.trim();
    if (name.length >= 2) return { exists: true, foundName: decodeHtml(name) };
  }

  // Legacy patterns
  const namePatterns: RegExp[] = [
    /"VerifiedCertificate:[^"]*":\s*\{[^}]*?"fullName":"([^"]{2,120})"/i,
    /"VerifiedCertificate:[^"]*":\s*\{[^}]*?"name":"([^"]{2,120})"/i,
    /"recipientFullName":"([^"]{2,120})"/i,
    /"learnerName":"([^"]{2,120})"/i,
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+?)\s+(?:earned|completed|has earned)/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+?)\s+(?:earned|completed|has earned)/i,
    /<title>([^<|]+?)\s+(?:earned|completed|has earned)/i,
  ];
  for (const re of namePatterns) {
    const m = html.match(re);
    if (m && m[1]) {
      const name = decodeHtml(m[1]).trim();
      if (name.length >= 2 && name.length <= 120 && name.toLowerCase() !== "unknown") {
        return { exists: true, foundName: name };
      }
    }
  }
  return { exists, foundName: null };
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
    const res = await fetchInsecure(
      verifyUrl,
      {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      ac.signal
    );
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
    const { exists, foundName } = parseCourseraApolloState(html, certId);
    if (!exists) {
      return {
        url, status: "not_found", foundName: null, expectedName,
        httpStatus: res.status, error: "Сертификат топилмади",
      };
    }
    // Cert is real but we couldn't extract a name from the SSR'd state.
    // Page is verified-alive — return verified without a name match.
    if (!foundName) {
      return {
        url, status: "verified", foundName: null, expectedName,
        httpStatus: res.status, error: null,
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
      error: ok ? null : "ФИО мос келмайди",
    };
  } catch (e) {
    const err = e as { name?: string; message?: string; cause?: { message?: string; code?: string } };
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return { url, status: "timeout", foundName: null, expectedName, httpStatus: null, error: "timeout" };
    }
    const detail = err?.cause?.code ?? err?.cause?.message ?? err?.message ?? "network error";
    return {
      url, status: "dead", foundName: null, expectedName,
      httpStatus: null, error: detail,
    };
  } finally {
    clearTimeout(t);
  }
}

// AiStudy verification uses the public certificate API discovered by inspecting
// the OMP frontend bundle: GET https://api.aistudy.uz/api/StudyAILms/Certificate/GetGeneratedCertificate?certificateId={id}
//   - 200 + result.userDataJson with FirstName/LastName/SurName → cert exists
//   - 404 + error: "Generated Certificate not found." → cert does not exist
// AiStudy stores names in upper case and sometimes swaps First/Last.
export async function verifyAistudy(
  url: string,
  expectedName: string | null,
  timeoutMs = 8000
): Promise<VerifyResult> {
  const m = url.match(AISTUDY_RE);
  if (!m) {
    return { url, status: "dead", foundName: null, expectedName, httpStatus: null, error: "URL формат носат." };
  }
  const certId = m[1];
  const apiUrl = `https://api.aistudy.uz/api/StudyAILms/Certificate/GetGeneratedCertificate?certificateId=${certId}`;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetchInsecure(
      apiUrl,
      {
        Accept: "application/json",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      ac.signal
    );

    if (res.status === 404) {
      return { url, status: "not_found", foundName: null, expectedName, httpStatus: 404, error: "Сертификат топилмади" };
    }
    if (res.status < 200 || res.status >= 400) {
      return {
        url, status: "dead", foundName: null, expectedName,
        httpStatus: res.status, error: `HTTP ${res.status}`,
      };
    }

    let body: unknown;
    try {
      body = await res.json();
    } catch {
      return {
        url, status: "dead", foundName: null, expectedName,
        httpStatus: res.status, error: "Жавоб формати нотўғри",
      };
    }

    const b = body as { statusCode?: number; result?: { userDataJson?: string } | null; error?: string };
    if (b.statusCode === 404 || !b.result || !b.result.userDataJson) {
      return {
        url, status: "not_found", foundName: null, expectedName,
        httpStatus: res.status, error: b.error ?? "Сертификат топилмади",
      };
    }

    let userData: { FirstName?: string; LastName?: string; SurName?: string } = {};
    try {
      userData = JSON.parse(b.result.userDataJson);
    } catch {
      // Cert exists but user data is not parseable → still verified
      return { url, status: "verified", foundName: null, expectedName, httpStatus: res.status, error: null };
    }

    const parts = [userData.LastName, userData.FirstName, userData.SurName]
      .map((s) => (s ?? "").trim())
      .filter(Boolean);
    const foundName = parts.length ? parts.join(" ") : null;

    if (!foundName) {
      return { url, status: "verified", foundName: null, expectedName, httpStatus: res.status, error: null };
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
      error: ok ? null : "ФИО мос келмайди",
    };
  } catch (e) {
    const err = e as { name?: string; message?: string; cause?: { message?: string; code?: string } };
    if (err?.name === "AbortError" || err?.name === "TimeoutError") {
      return { url, status: "timeout", foundName: null, expectedName, httpStatus: null, error: "timeout" };
    }
    const detail = err?.cause?.code ?? err?.cause?.message ?? err?.message ?? "network error";
    return {
      url, status: "dead", foundName: null, expectedName,
      httpStatus: null, error: detail,
    };
  } finally {
    clearTimeout(t);
  }
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
