export interface VerifyResult {
  httpStatus: number;
  extractedName: string | null;
  extractedCourse: string | null;
  error?: string;
}

export async function verifyAiStudy(url: string): Promise<VerifyResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; AILeaders-Verifier/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
  } catch (e) {
    return { httpStatus: 0, extractedName: null, extractedCourse: null, error: String(e) };
  }

  if (!res.ok) {
    return { httpStatus: res.status, extractedName: null, extractedCourse: null };
  }

  const html = await res.text();

  // Try JSON API first: the page may embed __NEXT_DATA__ or similar
  const jsonMatch = html.match(/"fullName"\s*:\s*"([^"]+)"/i) ||
    html.match(/"name"\s*:\s*"([^"]+)"/i);
  const courseMatch = html.match(/"courseName"\s*:\s*"([^"]+)"/i) ||
    html.match(/"title"\s*:\s*"([^"]+)"/i);

  // Fallback: og:title often contains "Certificate for <Name>"
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i);

  let extractedName: string | null = jsonMatch ? jsonMatch[1] : null;
  let extractedCourse: string | null = courseMatch ? courseMatch[1] : null;

  if (!extractedName && ogTitle) {
    const m = ogTitle[1].match(/(?:Certificate for|Sertifikat:)\s+(.+)/i);
    if (m) extractedName = m[1].trim();
  }

  return { httpStatus: res.status, extractedName, extractedCourse };
}
