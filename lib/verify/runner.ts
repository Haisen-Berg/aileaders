import { db } from "@/lib/db";
import { certificates, people } from "@/lib/db/schema";
import { eq, isNull, or, lt } from "drizzle-orm";
import { verifyAiStudy } from "./aistudy";
import { verifyCoursera } from "./coursera";
import { namesMatch } from "@/lib/normalize/name";

const STALE_DAYS = 7;

export async function verifyOneCertificate(certId: string): Promise<void> {
  const [cert] = await db
    .select()
    .from(certificates)
    .leftJoin(people, eq(certificates.personId, people.id))
    .where(eq(certificates.id, certId))
    .limit(1);

  if (!cert) return;

  const c = cert.certificates;
  const p = cert.people;

  let result;
  if (c.platform === "aistudy") {
    result = await verifyAiStudy(c.url);
  } else {
    result = await verifyCoursera(c.url);
    // Back-off for rate limiting: mark as unknown and skip
    if (result.error === "rate_limit") {
      await db
        .update(certificates)
        .set({ status: "unknown", verifiedAt: new Date(), verifierResponse: result })
        .where(eq(certificates.id, certId));
      return;
    }
  }

  let status: string;
  if (result.httpStatus === 0 || result.httpStatus >= 400) {
    status = "broken";
  } else if (result.extractedName && p?.fullName && !namesMatch(p.fullName, result.extractedName)) {
    status = "name_mismatch";
  } else {
    status = "valid";
  }

  await db
    .update(certificates)
    .set({
      status,
      verifiedAt: new Date(),
      verifierResponse: {
        extractedName: result.extractedName,
        extractedCourse: result.extractedCourse,
        httpStatus: result.httpStatus,
        error: result.error,
      },
    })
    .where(eq(certificates.id, certId));
}

export async function verifyPendingCertificates(limit = 50): Promise<number> {
  const staleDate = new Date(Date.now() - STALE_DAYS * 86400_000);

  const pending = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(
      or(
        eq(certificates.status, "pending"),
        lt(certificates.verifiedAt, staleDate),
      )
    )
    .limit(limit);

  for (const { id } of pending) {
    await verifyOneCertificate(id);
    // Small delay to avoid hammering external servers
    await new Promise((r) => setTimeout(r, 300));
  }

  return pending.length;
}
