import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { certificates, people } from "@/lib/db/schema";
import { eq, and, like, inArray } from "drizzle-orm";
import ExcelJS from "exceljs";

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = req.nextUrl.searchParams;
  const district = sp.get("district");
  const status = sp.get("status");
  const platform = sp.get("platform");

  const conditions = [];
  if (status) conditions.push(eq(certificates.status, status));
  if (platform) conditions.push(eq(certificates.platform, platform));

  const rows = await db
    .select({
      district: people.district,
      organization: people.organization,
      fullName: people.fullName,
      positionRaw: people.positionRaw,
      positionCanonical: people.positionCanonical,
      platform: certificates.platform,
      course: certificates.course,
      issuedAt: certificates.issuedAt,
      url: certificates.url,
      status: certificates.status,
      isCounted: certificates.isCounted,
      extractedName: certificates.verifierResponse,
      verifiedAt: certificates.verifiedAt,
    })
    .from(certificates)
    .innerJoin(people, eq(certificates.personId, people.id))
    .where(
      conditions.length > 0
        ? and(
            district ? like(people.district, `%${district}%`) : undefined,
            ...conditions
          )
        : district
        ? like(people.district, `%${district}%`)
        : undefined
    )
    .orderBy(people.district, people.organization);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Рўйхат");

  ws.columns = [
    { header: "Ҳудуд", key: "district", width: 20 },
    { header: "Ташкилот", key: "organization", width: 30 },
    { header: "Ф.И.Ш.", key: "fullName", width: 25 },
    { header: "Лавозим (хом)", key: "positionRaw", width: 20 },
    { header: "Лавозим (стандарт)", key: "positionCanonical", width: 18 },
    { header: "Платформа", key: "platform", width: 12 },
    { header: "Курс", key: "course", width: 30 },
    { header: "Сана", key: "issuedAt", width: 14 },
    { header: "Ссылка", key: "url", width: 60 },
    { header: "Статус", key: "status", width: 14 },
    { header: "Текширилган", key: "verifiedAt", width: 18 },
  ];

  for (const r of rows) {
    ws.addRow({
      district: r.district,
      organization: r.organization,
      fullName: r.fullName,
      positionRaw: r.positionRaw,
      positionCanonical: r.positionCanonical,
      platform: r.platform,
      course: r.course,
      issuedAt: r.issuedAt ? new Date(r.issuedAt).toLocaleDateString("uz-UZ") : "",
      url: r.url,
      status: r.status,
      verifiedAt: r.verifiedAt ? new Date(r.verifiedAt).toLocaleDateString("uz-UZ") : "",
    });
  }

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="aileaders-export-${Date.now()}.xlsx"`,
    },
  });
}
