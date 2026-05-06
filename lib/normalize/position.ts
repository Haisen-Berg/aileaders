// Canonical position values (in Uzbek Cyrillic)
export const CANONICAL_POSITIONS = [
  "ўқитувчи",
  "талаба",
  "ўқувчи",
  "ходим",
  "бошқа",
] as const;

export type CanonicalPosition = (typeof CANONICAL_POSITIONS)[number];

// Keyword mapping: if raw contains any of these keywords → canonical
const KEYWORDS: [string[], CanonicalPosition][] = [
  [["ўқитувчи", "teacher", "muallim", "преподаватель", "ustoz", "uqituvchi", "лектор", "профессор", "dotsent", "o'qituvchi"], "ўқитувчи"],
  [["талаба", "student", "talaba", "студент"], "талаба"],
  [["ўқувчи", "o'quvchi", "uquvchi", "ученик", "школьник", "maktab"], "ўқувчи"],
  [["ходим", "xodim", "hodim", "сотрудник", "работник", "员工", "ishchi", "mutaxassis", "specialist", "менежер", "директор", "rahbar", "boshqaruvchi", "mudur", "inspektor"], "ходим"],
];

export function canonicalizePosition(raw: string | null | undefined): CanonicalPosition {
  if (!raw) return "бошқа";
  const lower = raw.toLowerCase().trim();
  for (const [keywords, canon] of KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return canon;
  }
  return "бошқа";
}
