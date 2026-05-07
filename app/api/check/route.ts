import { NextRequest, NextResponse } from "next/server";
import { parseXlsx, ParsedRow, ParsedError } from "@/lib/xlsx/parser";
import {
  POSITION_TO_CATEGORY,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type PositionCategory,
} from "@/lib/normalize/position";
import { sampleAndCheck, type LinkSampleSummary } from "@/lib/links/check";

export const maxDuration = 120;

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
  hasErrors: boolean;
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
  errors: ParsedError[];
  districtStats: DistrictStat[];
  orgStats: OrgStat[];
  positionStats: PositionStat[];
  categoryStats: CategoryStat[];
  linkSample: LinkSampleSummary | null;
  previewRows: PreviewRow[];
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

  const allErrors: ParsedError[] = [];
  const districtMap = new Map<string, DistrictStat>();
  const orgMap = new Map<string, OrgStat>();
  const positionMap = new Map<string, PositionStat>();
  let certsTotal = 0;
  let totalPeople = 0;
  let aiStudy = 0;
  let coursera = 0;
  let both = 0;
  let dups = 0;
  let skipped = 0;

  for (const row of rows) {
    allErrors.push(...row.errors);

    if (row.certificates.length === 0) {
      skipped++;
      continue;
    }

    totalPeople++;
    const hasAi = row.certificates.some((c) => c.platform === "aistudy");
    const hasCo = row.certificates.some((c) => c.platform === "coursera");
    const nonDupCerts = row.certificates.filter((c) => !duplicateHashes.has(c.urlHash));
    const dupCount = row.certificates.length - nonDupCerts.length;

    dups += dupCount;
    certsTotal += nonDupCerts.length;
    if (hasAi) aiStudy++;
    if (hasCo) coursera++;
    if (hasAi && hasCo) both++;

    const dist = row.district ?? "Номаълум";
    if (!districtMap.has(dist)) {
      districtMap.set(dist, { district: dist, people: 0, certs: 0, aistudy: 0, coursera: 0, both: 0 });
    }
    const ds = districtMap.get(dist)!;
    ds.people++;
    ds.certs += nonDupCerts.length;
    if (hasAi) ds.aistudy++;
    if (hasCo) ds.coursera++;
    if (hasAi && hasCo) ds.both++;

    const org = row.organization ?? "Номаълум";
    if (!orgMap.has(org)) {
      orgMap.set(org, { organization: org, people: 0, certs: 0, aistudy: 0, coursera: 0, both: 0 });
    }
    const os = orgMap.get(org)!;
    os.people++;
    os.certs += nonDupCerts.length;
    if (hasAi) os.aistudy++;
    if (hasCo) os.coursera++;
    if (hasAi && hasCo) os.both++;

    const pos = row.positionCanonical ?? "бошқа";
    if (!positionMap.has(pos)) {
      positionMap.set(pos, { position: pos, people: 0, certs: 0 });
    }
    const ps = positionMap.get(pos)!;
    ps.people++;
    ps.certs += nonDupCerts.length;
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

  // Sample link liveness check — fire-and-await with budget cap
  const allUrls: string[] = [];
  for (const r of rows) for (const c of r.certificates) allUrls.push(c.url);
  let linkSample: LinkSampleSummary | null = null;
  try {
    if (allUrls.length > 0) {
      linkSample = await sampleAndCheck(allUrls, Math.min(50, allUrls.length));
    }
  } catch {
    linkSample = null;
  }

  const previewRows: PreviewRow[] = rows.slice(0, 100).map((row) => ({
    row: row.rowNumber,
    name: row.fullName,
    district: row.district,
    organization: row.organization,
    position: row.positionCanonical,
    aiUrl: row.certificates.find((c) => c.platform === "aistudy")?.url ?? null,
    coUrl: row.certificates.find((c) => c.platform === "coursera")?.url ?? null,
    hasErrors: row.errors.length > 0,
  }));

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
    errors: allErrors.slice(0, 100),
    districtStats,
    orgStats,
    positionStats,
    categoryStats,
    linkSample,
    previewRows,
  } satisfies CheckResult);
}
