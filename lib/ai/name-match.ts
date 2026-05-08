// Borderline ФИО comparison via gpt-oss-120b.
// Used as a fallback when heuristic similarity is in a grey zone — tokens fold
// to phonetically close strings but don't pass the strict threshold.

import { namesMatch } from "@/lib/normalize/name";

const AI_ENDPOINT =
  process.env.AI_ENDPOINT ??
  "https://p950-w009-runai-p950.runai-inference.dc.uz/v1/chat/completions";
const AI_MODEL = process.env.AI_MODEL ?? "openai/gpt-oss-120b";

const cache = new Map<string, boolean>();

function cacheKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export async function aiNamesMatch(
  dbName: string,
  certName: string,
  timeoutMs = 5000
): Promise<boolean | null> {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;

  const key = cacheKey(dbName.trim(), certName.trim());
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      signal: ac.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0,
        messages: [
          {
            role: "system",
            content:
              "You compare two Uzbek/Russian person names that may be written in different scripts (Cyrillic vs Latin) or spellings. Reply with strict JSON: {\"match\": true} if they refer to the same person, otherwise {\"match\": false}. No prose, no markdown.",
          },
          {
            role: "user",
            content: `Name A: ${dbName}\nName B: ${certName}\n\nReply with JSON only.`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "";
    const m = raw.match(/"match"\s*:\s*(true|false)/i);
    if (!m) return null;
    const result = m[1].toLowerCase() === "true";
    cache.set(key, result);
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

// Returns true/false. Heuristic first; AI only consulted when heuristic says false
// to upgrade borderline misses without re-confirming clear matches.
export async function namesMatchWithAi(
  dbName: string,
  certName: string
): Promise<boolean> {
  if (namesMatch(dbName, certName)) return true;
  const ai = await aiNamesMatch(dbName, certName);
  return ai === true;
}
