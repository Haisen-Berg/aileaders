import { getTopOrganizations } from "@/lib/stats/queries";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function OrgTable({ order, minPeople }: { order: "desc" | "asc"; minPeople: number }) {
  const data = await getTopOrganizations(10, minPeople, order);
  const max = Math.max(...data.map((r) => Number(r.cert_count)), 1);

  if (data.length === 0) {
    return (
      <p className="text-slate-500 text-sm py-4">
        Минимум {minPeople} кишидан кам ташкилот йўқ.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {data.map((row, i) => (
        <Card key={`${row.organization}-${i}`} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <div>
                <span className="font-medium text-slate-800">{row.organization}</span>
                {row.district && (
                  <span className="text-xs text-slate-400 ml-2">{row.district}</span>
                )}
              </div>
              <div className="text-sm text-right">
                <span className="font-bold">{Number(row.cert_count)}</span>
                <span className="text-slate-400 ml-1">сертификат</span>
                <span className="text-slate-400 mx-1">·</span>
                <span className="text-slate-500">{Number(row.people_count)} киши</span>
              </div>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${order === "desc" ? "bg-emerald-500" : "bg-rose-400"}`}
                style={{ width: `${(Number(row.cert_count) / max) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ min?: string }>;
}) {
  const min = 1; // default; can be wired to URL param on client side

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Ташкилотлар</h1>
        <p className="text-sm text-slate-500 mt-1">
          Энг кўп ва энг кам сертификат олган ташкилотлар (ТОП-10)
        </p>
      </div>

      <Tabs defaultValue="top">
        <TabsList>
          <TabsTrigger value="top">🏆 Топ-10 (энг кўп)</TabsTrigger>
          <TabsTrigger value="bottom">⬇️ Антитоп-10 (энг кам)</TabsTrigger>
        </TabsList>
        <TabsContent value="top" className="mt-4">
          <OrgTable order="desc" minPeople={min} />
        </TabsContent>
        <TabsContent value="bottom" className="mt-4">
          <OrgTable order="asc" minPeople={min} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
