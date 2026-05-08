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

function tokenSetRatio(a: string, b: string): number {
  const setA = new Set(a.split(" "));
  const setB = new Set(b.split(" "));
  const intersection = [...setA].filter((t) => setB.has(t));
  if (setA.size === 0 && setB.size === 0) return 1;
  return (2 * intersection.length) / (setA.size + setB.size);
}

export function namesMatch(dbName: string, certName: string): boolean {
  if (!dbName || !certName) return false;
  const a = normalizeForMatch(dbName);
  const b = normalizeForMatch(certName);
  if (a === b) return true;
  return tokenSetRatio(a, b) >= 0.85;
}

export function normalizeName(name: string): string {
  return cyrillicToLatin(name.trim().toLowerCase()).replace(/\s+/g, " ");
}
