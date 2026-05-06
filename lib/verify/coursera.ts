export interface VerifyResult {
  httpStatus: number;
  extractedName: string | null;
  extractedCourse: string | null;
  error?: string;
}

export async function verifyCoursera(url: string): Promise<VerifyResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AILeaders-Verifier/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(15000),
      redirect: "follow",
    });
  } catch (e) {
    return { httpStatus: 0, extractedName: null, extractedCourse: null, error: String(e) };
  }

  // Coursera may rate-limit with 429 or block with 403
  if (res.status === 429 || res.status === 403) {
    return { httpStatus: res.status, extractedName: null, extractedCourse: null, error: "rate_limit" };
  }

  if (!res.ok) {
    return { httpStatus: res.status, extractedName: null, extractedCourse: null };
  }

  const html = await res.text();

  // og:title: "Verify <Name>'s certificate | Coursera" or "Certificate | <Course>"
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ?? "";
  const ogDesc = html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1] ?? "";

  let extractedName: string | null = null;
  let extractedCourse: string | null = null;

  // Pattern: "Verify <Name>'s certificate"
  const nameMatch = ogTitle.match(/Verify\s+(.+?)(?:'s| )certificate/i) ||
    ogDesc.match(/([A-Z][a-zA-Z\s'-]+) has earned/i);
  if (nameMatch) extractedName = nameMatch[1].trim();

  // Course from JSON-LD or title
  const jsonLd = html.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd[1]);
      if (data?.name) extractedCourse = data.name;
      if (data?.about?.name) extractedCourse = data.about.name;
      if (data?.description && !extractedName) {
        const m = data.description.match(/([A-Z][a-zA-Z\s'-]+) successfully/i);
        if (m) extractedName = m[1].trim();
      }
    } catch {}
  }

  if (!extractedCourse) {
    // Fallback: h1 or h2 containing course name
    const h1 = html.match(/<h1[^>]*>([^<]{5,100})<\/h1>/i)?.[1];
    if (h1 && !h1.toLowerCase().includes("certificate")) extractedCourse = h1.trim();
  }

  return { httpStatus: res.status, extractedName, extractedCourse };
}
