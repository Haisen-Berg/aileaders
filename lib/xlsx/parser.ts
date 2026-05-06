import ExcelJS from "exceljs";
import crypto from "crypto";
import { normalizeName } from "@/lib/normalize/name";
import { canonicalizePosition } from "@/lib/normalize/position";

export interface ParsedRow {
  rowNumber: number;
  district: string | null;
  organization: string | null;
  fullName: string | null;
  fullNameNormalized: string | null;
  positionRaw: string | null;
  positionCanonical: string;
  certificates: ParsedCert[];
  errors: string[];
}

export interface ParsedCert {
  platform: "aistudy" | "coursera";
  course: string | null;
  issuedAt: Date | null;
  url: string;
  urlHash: string;
}

const AISTUDY_RE = /omp\.aistudy\.uz\/certificate\?id=([0-9a-f-]{36})/i;
const COURSERA_RE = /coursera\.org\/verify\/([A-Z0-9]+)/i;

function cellStr(row: ExcelJS.Row, col: number): string | null {
  const cell = row.getCell(col);
  const v = cell.value;
  if (v === null || v === undefined) return null;
  if (typeof v === "string") return v.trim() || null;
  if (typeof v === "number") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object" && "text" in v) return String((v as { text: string }).text).trim() || null;
  return String(v).trim() || null;
}

function cellDate(row: ExcelJS.Row, col: number): Date | null {
  const cell = row.getCell(col);
  const v = cell.value;
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function hashUrl(url: string): string {
  // Normalize: lowercase, strip trailing slash
  const normalized = url.trim().toLowerCase().replace(/\/$/, "");
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function parseCert(url: string | null, course: string | null, issuedAt: Date | null): ParsedCert | null {
  if (!url) return null;
  if (AISTUDY_RE.test(url)) {
    return { platform: "aistudy", course, issuedAt, url, urlHash: hashUrl(url) };
  }
  if (COURSERA_RE.test(url)) {
    return { platform: "coursera", course, issuedAt, url, urlHash: hashUrl(url) };
  }
  return null;
}

export async function parseXlsx(buffer: ArrayBuffer): Promise<ParsedRow[]> {
  const wb = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await wb.xlsx.load(buffer as any);

  const ws = wb.worksheets[0];
  if (!ws) throw new Error("Нет листов в файле");

  const rows: ParsedRow[] = [];

  // Data starts at row 6 (1-indexed). Rows 1-5 are headers/title.
  ws.eachRow((row, rowNumber) => {
    if (rowNumber < 6) return;

    // Col B=2: district, C=3: org, D=4: FIO, E=5: position
    // Col F=6: AiStudy course, G=7: AiStudy date, H=8: AiStudy URL
    // Col I=9: Coursera course, J=10: Coursera date, K=11: Coursera URL

    const district = cellStr(row, 2);
    const organization = cellStr(row, 3);
    const fullName = cellStr(row, 4);
    const positionRaw = cellStr(row, 5);

    const aiCourse = cellStr(row, 6);
    const aiDate = cellDate(row, 7);
    const aiUrl = cellStr(row, 8);

    const coCourse = cellStr(row, 9);
    const coDate = cellDate(row, 10);
    const coUrl = cellStr(row, 11);

    // Skip completely empty rows
    if (!district && !organization && !fullName && !aiUrl && !coUrl) return;

    const errors: string[] = [];
    const certs: ParsedCert[] = [];

    const aiCert = parseCert(aiUrl, aiCourse, aiDate);
    if (aiUrl && !aiCert) errors.push(`Строка ${rowNumber}: неверный формат AiStudy ссылки: ${aiUrl}`);
    if (aiCert) certs.push(aiCert);

    const coCert = parseCert(coUrl, coCourse, coDate);
    if (coUrl && !coCert) errors.push(`Строка ${rowNumber}: неверный формат Coursera ссылки: ${coUrl}`);
    if (coCert) certs.push(coCert);

    rows.push({
      rowNumber,
      district,
      organization,
      fullName,
      fullNameNormalized: fullName ? normalizeName(fullName) : null,
      positionRaw,
      positionCanonical: canonicalizePosition(positionRaw),
      certificates: certs,
      errors,
    });
  });

  return rows;
}
