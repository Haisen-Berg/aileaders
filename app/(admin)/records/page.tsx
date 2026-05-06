import { db } from "@/lib/db";
import { certificates, people } from "@/lib/db/schema";
import { eq, and, like, desc } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  valid: { label: "✅ Тасдиқланган", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  name_mismatch: { label: "⚠️ Исм тўғри келмаган", className: "bg-amber-100 text-amber-800 border-amber-200" },
  broken: { label: "❌ Ишламайди", className: "bg-red-100 text-red-800 border-red-200" },
  duplicate: { label: "🔁 Дубликат", className: "bg-slate-100 text-slate-600 border-slate-200" },
  pending: { label: "⏳ Кутилмоқда", className: "bg-blue-50 text-blue-700 border-blue-200" },
  unknown: { label: "❓ Номаълум", className: "bg-gray-100 text-gray-600" },
};

function statusBadge(status: string) {
  const s = STATUS_BADGE[status] ?? { label: status, className: "" };
  return <Badge variant="outline" className={`text-xs ${s.className}`}>{s.label}</Badge>;
}

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; platform?: string; district?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  const conditions = [];
  if (sp.status) conditions.push(eq(certificates.status, sp.status));
  if (sp.platform) conditions.push(eq(certificates.platform, sp.platform));
  if (sp.district) conditions.push(like(people.district, `%${sp.district}%`));

  const rows = await db
    .select({
      certId: certificates.id,
      platform: certificates.platform,
      course: certificates.course,
      url: certificates.url,
      status: certificates.status,
      isCounted: certificates.isCounted,
      issuedAt: certificates.issuedAt,
      verifiedAt: certificates.verifiedAt,
      verifierResponse: certificates.verifierResponse,
      fullName: people.fullName,
      organization: people.organization,
      district: people.district,
      positionCanonical: people.positionCanonical,
    })
    .from(certificates)
    .innerJoin(people, eq(certificates.personId, people.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(certificates.verifiedAt))
    .limit(pageSize)
    .offset(offset);

  const filterLinks = [
    { label: "Барчаси", href: "/records" },
    { label: "⏳ Кутилмоқда", href: "/records?status=pending" },
    { label: "⚠️ Исм тўғри келмаган", href: "/records?status=name_mismatch" },
    { label: "❌ Ишламайди", href: "/records?status=broken" },
    { label: "🔁 Дубликат", href: "/records?status=duplicate" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Барча ёзувлар</h1>
        <a
          href={`/api/export${sp.status ? `?status=${sp.status}` : ""}${sp.platform ? `&platform=${sp.platform}` : ""}${sp.district ? `&district=${sp.district}` : ""}`}
          className="text-sm text-blue-600 hover:underline"
        >
          📥 Excel юклаш
        </a>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterLinks.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="text-xs px-3 py-1 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600"
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const resp = row.verifierResponse as Record<string, string> | null;
          return (
            <Card key={row.certId} className="text-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800 truncate">{row.fullName}</span>
                      {statusBadge(row.status)}
                      <Badge variant="outline" className="text-xs">
                        {row.platform === "aistudy" ? "AiStudy" : "Coursera"}
                      </Badge>
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {row.organization}{row.district ? ` · ${row.district}` : ""}
                    </p>
                    {row.course && <p className="text-slate-600 text-xs mt-0.5">{row.course}</p>}
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 text-xs hover:underline truncate block mt-0.5"
                    >
                      {row.url}
                    </a>
                    {resp?.extractedName && row.status === "name_mismatch" && (
                      <p className="text-amber-700 text-xs mt-1">
                        Сертификатдаги исм: <strong>{resp.extractedName}</strong>
                      </p>
                    )}
                  </div>
                  <div className="text-right text-xs text-slate-400 shrink-0">
                    {row.issuedAt && <p>{new Date(row.issuedAt).toLocaleDateString("uz-UZ")}</p>}
                    {row.verifiedAt && <p>текш.: {new Date(row.verifiedAt).toLocaleDateString("uz-UZ")}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {rows.length === 0 && (
          <p className="text-slate-500 text-sm py-4">Ёзувлар топилмади.</p>
        )}
      </div>

      {rows.length === pageSize && (
        <div className="flex gap-2">
          {page > 1 && (
            <Link href={`/records?page=${page - 1}${sp.status ? `&status=${sp.status}` : ""}`}
              className="text-sm text-blue-600 hover:underline">← Олдинги</Link>
          )}
          <Link href={`/records?page=${page + 1}${sp.status ? `&status=${sp.status}` : ""}`}
            className="text-sm text-blue-600 hover:underline ml-auto">Кейинги →</Link>
        </div>
      )}
    </div>
  );
}
