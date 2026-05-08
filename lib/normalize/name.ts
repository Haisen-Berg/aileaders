// Uzbek Cyrillic → Latin transliteration table
const CYRL_TO_LATN: [RegExp, string][] = [
  [/ш/g, "sh"], [/Ш/g, "Sh"],
  [/ч/g, "ch"], [/Ч/g, "Ch"],
  [/ъ/g, ""], [/ь/g, ""],
  [/ё/g, "yo"], [/Ё/g, "Yo"],
  [/ю/g, "yu"], [/Ю/g, "Yu"],
  [/я/g, "ya"], [/Я/g, "Ya"],
  [/ж/g, "j"],  [/Ж/g, "J"],
  [/х/g, "x"],  [/Х/g, "X"],
  [/ц/g, "ts"], [/Ц/g, "Ts"],
  [/щ/g, "sh"], [/Щ/g, "Sh"],
  [/а/g, "a"],  [/А/g, "A"],
  [/б/g, "b"],  [/Б/g, "B"],
  [/в/g, "v"],  [/В/g, "V"],
  [/г/g, "g"],  [/Г/g, "G"],
  [/д/g, "d"],  [/Д/g, "D"],
  [/е/g, "e"],  [/Е/g, "E"],
  [/з/g, "z"],  [/З/g, "Z"],
  [/и/g, "i"],  [/И/g, "I"],
  [/й/g, "y"],  [/Й/g, "Y"],
  [/к/g, "k"],  [/К/g, "K"],
  [/л/g, "l"],  [/Л/g, "L"],
  [/м/g, "m"],  [/М/g, "M"],
  [/н/g, "n"],  [/Н/g, "N"],
  [/о/g, "o"],  [/О/g, "O"],
  [/п/g, "p"],  [/П/g, "P"],
  [/р/g, "r"],  [/Р/g, "R"],
  [/с/g, "s"],  [/С/g, "S"],
  [/т/g, "t"],  [/Т/g, "T"],
  [/у/g, "u"],  [/У/g, "U"],
  [/ф/g, "f"],  [/Ф/g, "F"],
  [/э/g, "e"],  [/Э/g, "E"],
  [/ы/g, "i"],  [/Ы/g, "I"],
  // Uzbek-specific letters
  [/ў/g, "o'"], [/Ў/g, "O'"],
  [/қ/g, "q"],  [/Қ/g, "Q"],
  [/ғ/g, "g'"], [/Ғ/g, "G'"],
  [/ҳ/g, "h"],  [/Ҳ/g, "H"],
  [/ъ/g, "'"],
];

export function cyrillicToLatin(s: string): string {
  let r = s;
  for (const [pat, rep] of CYRL_TO_LATN) r = r.replace(pat, rep);
  return r;
}

function normalizeForMatch(name: string): string {
  let n = name.trim().toLowerCase();
  // Normalize all apostrophe-like marks to ASCII apostrophe (Uzbek o'g'li / ўғли variants).
  // Includes: backtick `, U+02BB ʻ, U+02BC ʼ, U+2018 ', U+2019 ', U+0301 (combining acute).
  n = n.replace(/[`ʻʼ‘’`́]/g, "'");
  // Transliterate Cyrillic to Latin for unified comparison
  n = cyrillicToLatin(n);
  // Drop apostrophes after transliteration so "o'g'li" / "ogli" / "ogly" all collapse.
  n = n.replace(/'/g, "");
  // Remove punctuation
  n = n.replace(/[^a-z0-9\s]/g, "");
  // Collapse whitespace, sort tokens for order-independent match
  return n
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = new Array(b.length + 1);
  let curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

function tokenSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const max = Math.max(a.length, b.length);
  return 1 - levenshtein(a, b) / max;
}

// Per-token fuzzy match. Each token in the shorter name must find a distinct
// token in the longer name with similarity ≥ 0.8 (~1 char diff per 5–7 chars).
// Tolerates: missing patronymic (FI vs FIO), Cyrillic↔Latin transliteration
// drift (Sultonov/Sultanov, Karimov/Karimof), apostrophe/spacing differences.
export function namesMatch(dbName: string, certName: string): boolean {
  if (!dbName || !certName) return false;
  const A = normalizeForMatch(dbName).split(" ").filter(Boolean);
  const B = normalizeForMatch(certName).split(" ").filter(Boolean);
  if (!A.length || !B.length) return false;

  const [small, big] = A.length <= B.length ? [A, B] : [B, A];
  const used = new Set<number>();
  let matched = 0;
  for (const t of small) {
    let bestIdx = -1;
    let bestSim = 0;
    for (let i = 0; i < big.length; i++) {
      if (used.has(i)) continue;
      const sim = tokenSimilarity(t, big[i]);
      if (sim > bestSim) {
        bestSim = sim;
        bestIdx = i;
      }
    }
    if (bestSim >= 0.8 && bestIdx >= 0) {
      used.add(bestIdx);
      matched++;
    }
  }
  return matched === small.length && matched >= 2;
}

export function normalizeName(name: string): string {
  return cyrillicToLatin(name.trim().toLowerCase()).replace(/\s+/g, " ");
}
