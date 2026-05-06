import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { uploads, people, certificates } from "@/lib/db/schema";
import { parseXlsx } from "@/lib/xlsx/parser";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Файл не найден" }, { status: 400 });
  if (!file.name.endsWith(".xlsx"))
    return NextResponse.json({ error: "Только .xlsx файлы" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024)
    return NextResponse.json({ error: "Файл слишком большой (макс. 10MB)" }, { status: 400 });

  const buffer = await file.arrayBuffer();

  let rows;
  try {
    rows = await parseXlsx(buffer);
  } catch (e) {
    return NextResponse.json({ error: `Ошибка парсинга: ${e}` }, { status: 422 });
  }

  // Create upload record
  const [upload] = await db
    .insert(uploads)
    .values({
      filename: file.name,
      uploadedBy: userId,
      rowsTotal: rows.length,
      rowsImported: 0,
      rowsSkipped: 0,
      rowsDuplicate: 0,
    })
    .returning();

  let imported = 0;
  let skipped = 0;
  let duplicates = 0;
  const allErrors: string[] = [];

  for (const row of rows) {
    allErrors.push(...row.errors);

    if (row.certificates.length === 0) {
      skipped++;
      continue;
    }

    // Upsert person
    const [person] = await db
      .insert(people)
      .values({
        district: row.district,
        organization: row.organization,
        fullName: row.fullName,
        fullNameNormalized: row.fullNameNormalized,
        positionRaw: row.positionRaw,
        positionCanonical: row.positionCanonical,
        uploadId: upload.id,
        rowNumber: row.rowNumber,
      })
      .returning();

    for (const cert of row.certificates) {
      // Check for duplicate url_hash
      const existing = await db
        .select({ id: certificates.id })
        .from(certificates)
        .where(eq(certificates.urlHash, cert.urlHash))
        .limit(1);

      if (existing.length > 0) {
        // Mark the existing one and the new one as duplicate
        await db
          .update(certificates)
          .set({ status: "duplicate", isCounted: false })
          .where(eq(certificates.urlHash, cert.urlHash));

        await db.insert(certificates).values({
          personId: person.id,
          platform: cert.platform,
          course: cert.course,
          issuedAt: cert.issuedAt,
          url: cert.url,
          urlHash: cert.urlHash,
          status: "duplicate",
          isCounted: false,
        });
        duplicates++;
      } else {
        await db.insert(certificates).values({
          personId: person.id,
          platform: cert.platform,
          course: cert.course,
          issuedAt: cert.issuedAt,
          url: cert.url,
          urlHash: cert.urlHash,
          status: "pending",
          isCounted: true,
        });
        imported++;
      }
    }
  }

  await db
    .update(uploads)
    .set({ rowsImported: imported, rowsSkipped: skipped, rowsDuplicate: duplicates })
    .where(eq(uploads.id, upload.id));

  return NextResponse.json({
    uploadId: upload.id,
    rowsTotal: rows.length,
    rowsImported: imported,
    rowsSkipped: skipped,
    rowsDuplicate: duplicates,
    errors: allErrors.slice(0, 20),
  });
}
