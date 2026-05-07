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

// Cache canonicalization results — for files with 50k+ rows, repeated raw strings are common
const _canonCache = new Map<string, CanonicalPosition>();

export function canonicalizePosition(raw: string | null | undefined): CanonicalPosition {
  if (!raw) return "бошқа";
  const lower = raw.toLowerCase().trim();
  const cached = _canonCache.get(lower);
  if (cached) return cached;

  let result: CanonicalPosition = "бошқа";
  for (const [keywords, canon] of KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) {
      result = canon;
      break;
    }
  }
  // Bound cache to avoid unbounded growth on adversarial inputs
  if (_canonCache.size < 5000) _canonCache.set(lower, result);
  return result;
}

// High-level categories shown in UI as the primary grouping.
export type PositionCategory = "teachers" | "learners" | "employees" | "other";

export const POSITION_TO_CATEGORY: Record<CanonicalPosition, PositionCategory> = {
  "ўқитувчи": "teachers",
  "талаба": "learners",
  "ўқувчи": "learners",
  "ходим": "employees",
  "бошқа": "other",
};

export const CATEGORY_LABELS: Record<PositionCategory, string> = {
  teachers: "Преподаватели",
  learners: "Учащиеся",
  employees: "Сотрудники",
  other: "Другие",
};

export const CATEGORY_ORDER: PositionCategory[] = ["teachers", "learners", "employees", "other"];
