import { getDistrictStats } from "@/lib/stats/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DistrictsPage() {
  const data = await getDistrictStats();

  const max = Math.max(...data.map((r) => Number(r.cert_count)), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ҳудудлар бўйича</h1>
        <p className="text-sm text-slate-500 mt-1">
          {data.length} та ҳудуд • Сертификатлар сонига кўра тартибланган
        </p>
      </div>

      <div className="space-y-2">
        {data.map((row) => (
          <Card key={row.district} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/districts?district=${encodeURIComponent(row.district)}`}
                    className="font-medium text-slate-800 hover:underline"
                  >
                    {row.district}
                  </Link>
                  {Number(row.broken) > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      ❌ {row.broken}
                    </Badge>
                  )}
                  {Number(row.name_mismatch) > 0 && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-400">
                      ⚠️ {row.name_mismatch}
                    </Badge>
                  )}
                </div>
                <div className="text-right text-sm">
                  <span className="font-bold text-slate-800">{Number(row.cert_count).toLocaleString()}</span>
                  <span className="text-slate-400 ml-1">сертификат</span>
                  <span className="text-slate-400 ml-2">|</span>
                  <span className="text-slate-500 ml-2">{Number(row.people_count)} киши</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${(Number(row.cert_count) / max) * 100}%` }}
                />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-500">
                <span>AiStudy: <strong>{Number(row.aistudy)}</strong></span>
                <span>Coursera: <strong>{Number(row.coursera)}</strong></span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
