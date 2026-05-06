import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { verifyPendingCertificates, verifyOneCertificate } from "@/lib/verify/runner";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const certId = body?.certId as string | undefined;

  if (certId) {
    await verifyOneCertificate(certId);
    return NextResponse.json({ ok: true, certId });
  }

  const count = await verifyPendingCertificates(50);
  return NextResponse.json({ ok: true, processed: count });
}
