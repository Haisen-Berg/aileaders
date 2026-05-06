import { getKpiStats, getPlatformStats } from "@/lib/stats/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PlatformsPage() {
  const [kpi, platform] = await Promise.all([getKpiStats(), getPlatformStats()]);

  const aiOnly = Number(platform.only_aistudy_or_both ?? 0) - Number(platform.both_platforms ?? 0);
  const coOnly = Number(platform.only_coursera_or_both ?? 0) - Number(platform.both_platforms ?? 0);
  const both = Number(platform.both_platforms ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Платформалар</h1>
        <p className="text-sm text-slate-500 mt-1">AiStudy ва Coursera сертификатлари таркиби</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-600">Фақат AiStudy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-700">{aiOnly.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">
              {Number(kpi.aistudy_certs ?? 0).toLocaleString()} та сертификат
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-emerald-600">Иккала платформа</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-700">{both.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">ҳар иккисини тугатган иштирокчилар</p>
          </CardContent>
        </Card>

        <Card className="border-violet-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-violet-600">Фақат Coursera</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-violet-700">{coOnly.toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">
              {Number(kpi.coursera_certs ?? 0).toLocaleString()} та сертификат
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Simple visual proportion bars */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-medium text-slate-600 mb-3">Иштирокчилар таркиби</p>
          {(() => {
            const total = aiOnly + both + coOnly || 1;
            return (
              <div className="h-6 flex rounded-full overflow-hidden gap-0.5">
                <div
                  className="bg-blue-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(aiOnly / total) * 100}%` }}
                  title={`Фақат AiStudy: ${aiOnly}`}
                >
                  {aiOnly > 0 ? aiOnly : ""}
                </div>
                <div
                  className="bg-emerald-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(both / total) * 100}%` }}
                  title={`Иккала: ${both}`}
                >
                  {both > 0 ? both : ""}
                </div>
                <div
                  className="bg-violet-500 flex items-center justify-center text-xs text-white font-medium"
                  style={{ width: `${(coOnly / total) * 100}%` }}
                  title={`Фақат Coursera: ${coOnly}`}
                >
                  {coOnly > 0 ? coOnly : ""}
                </div>
              </div>
            );
          })()}
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> AiStudy</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Иккала</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-500 inline-block" /> Coursera</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
