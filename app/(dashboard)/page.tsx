import { getKpiStats } from "@/lib/stats/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function KpiCard({ title, value, sub }: { title: string; value: number | string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-bold">{Number(value).toLocaleString("uz-UZ")}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const kpi = await getKpiStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Умумий кўриниш</h1>
        <p className="text-sm text-slate-500 mt-1">
          Беш миллион сунъий интеллект етакчилари — сертификатлар статистикаси
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard title="Жами иштирокчилар" value={kpi.total_people ?? 0} />
        <KpiCard title="Жами сертификатлар" value={kpi.total_certs ?? 0} />
        <KpiCard title="AiStudy" value={kpi.aistudy_certs ?? 0} />
        <KpiCard title="Coursera" value={kpi.coursera_certs ?? 0} />
        <KpiCard title="Иккала платформа" value={kpi.both_platforms ?? 0} sub="ҳар иккисини олганлар" />
        <KpiCard title="⚠️ Исм тўғри келмаган" value={kpi.name_mismatch ?? 0} />
        <KpiCard title="❌ Ишламайдиган ссылка" value={kpi.broken ?? 0} />
        <KpiCard title="🔁 Дубликат" value={kpi.duplicate_certs ?? 0} sub="статистикага кирмайди" />
      </div>

      {Number(kpi.pending ?? 0) > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
          <Badge variant="outline" className="text-amber-700 border-amber-400">Кутилмоқда</Badge>
          <span className="text-amber-700">
            {Number(kpi.pending).toLocaleString()} та сертификат текширилмаган.{" "}
            <a href="/records" className="underline font-medium">Текширишни бошлаш →</a>
          </span>
        </div>
      )}
    </div>
  );
}
