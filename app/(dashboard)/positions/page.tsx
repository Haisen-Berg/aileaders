import { getPositionStats } from "@/lib/stats/queries";
import { Card, CardContent } from "@/components/ui/card";

const POSITION_LABEL: Record<string, string> = {
  "ўқитувчи": "Ўқитувчилар",
  "талаба": "Талабалар",
  "ўқувчи": "Ўқувчилар",
  "ходим": "Ходимлар",
  "бошқа": "Бошқалар",
};

const POSITION_COLOR: Record<string, string> = {
  "ўқитувчи": "bg-blue-500",
  "талаба": "bg-emerald-500",
  "ўқувчи": "bg-violet-500",
  "ходим": "bg-amber-500",
  "бошқа": "bg-slate-400",
};

export default async function PositionsPage() {
  const data = await getPositionStats();
  const total = data.reduce((s, r) => s + Number(r.people_count), 0);
  const max = Math.max(...data.map((r) => Number(r.people_count)), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Лавозимлар бўйича</h1>
        <p className="text-sm text-slate-500 mt-1">Жами {total.toLocaleString()} та иштирокчи</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {data.map((row) => {
          const pct = total ? Math.round((Number(row.people_count) / total) * 100) : 0;
          const label = POSITION_LABEL[row.position_canonical] ?? row.position_canonical;
          const color = POSITION_COLOR[row.position_canonical] ?? "bg-slate-400";
          return (
            <Card key={row.position_canonical}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-700">{label}</span>
                  <div className="text-right text-sm">
                    <span className="font-bold">{Number(row.people_count).toLocaleString()}</span>
                    <span className="text-slate-400 ml-1">({pct}%)</span>
                  </div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${(Number(row.people_count) / max) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {Number(row.cert_count).toLocaleString()} та сертификат
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
