import { NextRequest, NextResponse } from "next/server";
import { parseXlsx, ParsedRow, ParsedError } from "@/lib/xlsx/parser";
import {
  POSITION_TO_CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type PositionCategory,
} from "@/lib/normalize/position";
import { type LinkSampleSummary } from "@/lib/links/check";

export const maxDuration = 60;

export interface DistrictStat {
  district: string;
  people: number;
  certs: number;
  aistudy: number;
  coursera: number;
  both: number;
}

export interface OrgStat {
  organization: string;
  people: number;
  certs: number;
  aistudy: number;
  coursera: number;
  both: number;
}

export interface PositionStat {
  position: string;
  people: number;
  certs: number;
}

export interface CategoryStat {
  category: PositionCategory;
  label: string;
  people: number;
  certs: number;
}

export interface PreviewRow {
  row: number;
  name: string | null;
  district: string | null;
  organization: string | null;
  position: string;
  aiUrl: string | null;
  coUrl: string | null;
  aiCourse: string | null;
  coCourse: string | null;
  hasErrors: boolean;
}

export interface DuplicateGroup {
  url: string;
  rows: number[];
  names: (string | null)[];
}

export interface CertItem {
  url: string;
  expectedName: string | null;
  rowNumber: number;
  platform: "aistudy" | "coursera";
}

export interface CheckResult {
  filename: string;
  rowsTotal: number;
  rowsParsed: number;
  rowsSkipped: number;
  certsTotal: number;
  people: number;
  aistudy: number;
  coursera: number;
  both: number;
  duplicatesInFile: number;
  duplicateGroups: DuplicateGroup[];
  errors: ParsedError[];
  districtStats: DistrictStat[];
  orgStats: OrgStat[];
  positionStats: PositionStat[];
  categoryStats: CategoryStat[];
  linkSample: LinkSampleSummary | null;
  allCertUrls: string[];
  allCertItems: CertItem[];
  previewRows: PreviewRow[];
}

interface PersonAcc {
  district: string | null;
  organization: string | null;
  position: string;
  hasAi: boolean;
  hasCo: boolean;
  nonDupCerts: number;
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Файл топилмади" }, { status: 400 });
  if (!file.name.endsWith(".xlsx"))
    return NextResponse.json({ error: "Фақат .xlsx файллар қабул қилинади" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "Файл жуда катта (макс. 10MB)" }, { status: 400 });

  const buffer = await file.arrayBuffer();
  let rows: ParsedRow[];
  try {
    rows = await parseXlsx(buffer);
  } catch (e) {
    return NextResponse.json({ error: `Парсинг хатоси: ${e}` }, { status: 422 });
  }

  // Find URL hash duplicates within the file itself
  const urlHashCounts = new Map<string, number>();
  for (const row of rows) {
    for (const cert of row.certificates) {
      urlHashCounts.set(cert.urlHash, (urlHashCounts.get(cert.urlHash) ?? 0) + 1);
    }
  }
  const duplicateHashes = new Set(
    [...urlHashCounts.entries()].filter(([, n]) => n > 1).map(([h]) => h)
  );

  // First pass: dedup rows by person (fullNameNormalized).
  // One person can appear in many rows (e.g. multiple Coursera certs across rows) —
  // they should count as 1 person but their cert counts aggregate across rows.
  const personMap = new Map<string, PersonAcc>();
  const allErrors: ParsedError[] = [];
  const allCertUrls: string[] = [];
  const allCertItems: CertItem[] = [];
  let certsTotal = 0;
  let dups = 0;
  let skipped = 0;

  for (const row of rows) {
    allErrors.push(...row.errors);
    if (row.certificates.length === 0) {
      skipped++;
      continue;
    }
    const nonDupCerts = row.certificates.filter((c) => !duplicateHashes.has(c.urlHash));
    dups += row.certificates.length - nonDupCerts.length;
    certsTotal += nonDupCerts.length;
    for (const c of nonDupCerts) {
      allCertUrls.push(c.url);
      allCertItems.push({
        url: c.url,
        expectedName: row.fullName,
        rowNumber: row.rowNumber,
        platform: c.platform,
      });
    }

    const personKey = row.fullNameNormalized ?? `__row_${row.rowNumber}`;
    const hasAi = row.certificates.some((c) => c.platform === "aistudy");
    const hasCo = row.certificates.some((c) => c.platform === "coursera");

    const existing = personMap.get(personKey);
    if (existing) {
      existing.hasAi = existing.hasAi || hasAi;
      existing.hasCo = existing.hasCo || hasCo;
      existing.nonDupCerts += nonDupCerts.length;
    } else {
      personMap.set(personKey, {
        district: row.district,
        organization: row.organization,
        position: row.positionCanonical,
        hasAi,
        hasCo,
        nonDupCerts: nonDupCerts.length,
      });
    }
  }

  // Second pass: aggregate stats from unique persons.
  const districtMap = new Map<string, DistrictStat>();
  const orgMap = new Map<string, OrgStat>();
  const positionMap = new Map<string, PositionStat>();
  let totalPeople = 0;
  let aiStudy = 0;
  let coursera = 0;
  let both = 0;

  for (const p of personMap.values()) {
    totalPeople++;
    if (p.hasAi) aiStudy++;
    if (p.hasCo) coursera++;
    if (p.hasAi && p.hasCo) both++;

    const dist = p.district ?? "Номаълум";
    if (!districtMap.has(dist)) {
      districtMap.set(dist, { district: dist, people: 0, certs: 0, aistudy: 0, coursera: 0, both: 0 });
    }
    const ds = districtMap.get(dist)!;
    ds.people++;
    ds.certs += p.nonDupCerts;
    if (p.hasAi) ds.aistudy++;
    if (p.hasCo) ds.coursera++;
    if (p.hasAi && p.hasCo) ds.both++;

    const org = p.organization ?? "Номаълум";
    if (!orgMap.has(org)) {
      orgMap.set(org, { organization: org, people: 0, certs: 0, aistudy: 0, coursera: 0, both: 0 });
    }
    const os = orgMap.get(org)!;
    os.people++;
    os.certs += p.nonDupCerts;
    if (p.hasAi) os.aistudy++;
    if (p.hasCo) os.coursera++;
    if (p.hasAi && p.hasCo) os.both++;

    const pos = p.position ?? "бошқа";
    if (!positionMap.has(pos)) {
      positionMap.set(pos, { position: pos, people: 0, certs: 0 });
    }
    const ps = positionMap.get(pos)!;
    ps.people++;
    ps.certs += p.nonDupCerts;
  }

  const districtStats = [...districtMap.values()].sort((a, b) => b.certs - a.certs);
  const orgStats = [...orgMap.values()].sort((a, b) => b.certs - a.certs);
  const positionStats = [...positionMap.values()].sort((a, b) => b.people - a.people);

  // Roll up canonical positions into 4 high-level categories
  const categoryAcc: Record<PositionCategory, { people: number; certs: number }> = {
    teachers: { people: 0, certs: 0 },
    learners: { people: 0, certs: 0 },
    employees: { people: 0, certs: 0 },
    other: { people: 0, certs: 0 },
  };
  for (const ps of positionStats) {
    const cat = POSITION_TO_CATEGORY[ps.position as keyof typeof POSITION_TO_CATEGORY] ?? "other";
    categoryAcc[cat].people += ps.people;
    categoryAcc[cat].certs += ps.certs;
  }
  const categoryStats: CategoryStat[] = CATEGORY_ORDER.map((c) => ({
    category: c,
    label: CATEGORY_LABELS[c],
    people: categoryAcc[c].people,
    certs: categoryAcc[c].certs,
  }));

  const previewRows: PreviewRow[] = rows.slice(0, 200).map((row) => {
    const ai = row.certificates.find((c) => c.platform === "aistudy");
    const co = row.certificates.find((c) => c.platform === "coursera");
    return {
      row: row.rowNumber,
      name: row.fullName,
      district: row.district,
      organization: row.organization,
      position: row.positionCanonical,
      aiUrl: ai?.url ?? null,
      coUrl: co?.url ?? null,
      aiCourse: ai?.course ?? null,
      coCourse: co?.course ?? null,
      hasErrors: row.errors.length > 0,
    };
  });

  // Build duplicate groups: hash → first url + all rows/names that contain it
  const dupGroupMap = new Map<string, DuplicateGroup>();
  for (const row of rows) {
    for (const cert of row.certificates) {
      if (!duplicateHashes.has(cert.urlHash)) continue;
      const g = dupGroupMap.get(cert.urlHash);
      if (g) {
        g.rows.push(row.rowNumber);
        g.names.push(row.fullName);
      } else {
        dupGroupMap.set(cert.urlHash, {
          url: cert.url,
          rows: [row.rowNumber],
          names: [row.fullName],
        });
      }
    }
  }
  const duplicateGroups = [...dupGroupMap.values()]
    .sort((a, b) => b.rows.length - a.rows.length)
    .slice(0, 100);

  return NextResponse.json({
    filename: file.name,
    rowsTotal: rows.length,
    rowsParsed: totalPeople,
    rowsSkipped: skipped,
    certsTotal,
    people: totalPeople,
    aistudy: aiStudy,
    coursera,
    both,
    duplicatesInFile: dups,
    duplicateGroups,
    errors: allErrors.slice(0, 100),
    districtStats,
    orgStats,
    positionStats,
    categoryStats,
    linkSample: null,
    allCertUrls,
    allCertItems,
    previewRows,
  } satisfies CheckResult);
}
