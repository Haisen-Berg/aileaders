"use client";

import { useState, useRef } from "react";

// Inline SVG icons — no lucide-react dependency
const IC = {
  Upload: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  FileSpreadsheet: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/></svg>,
  AlertTriangle: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>,
  CheckCircle2: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>,
  XCircle: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>,
  Users: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Award: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>,
  MapPin: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>,
  Briefcase: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>,
  RefreshCw: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>,
  ExternalLink: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>,
  BarChart3: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>,
};
import { toast } from "sonner";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface DistrictStat {
  district: string;
  people: number;
  certs: number;
  aistudy: number;
  coursera: number;
  both: number;
}

interface PositionStat {
  position: string;
  people: number;
  certs: number;
}

interface PreviewRow {
  row: number;
  name: string | null;
  district: string | null;
  organization: string | null;
  position: string;
  aiUrl: string | null;
  coUrl: string | null;
  hasErrors: boolean;
}

interface CheckResult {
  filename: string;
  rowsTotal: number;
  rowsParsed: number;
  rowsSkipped: number;
  certsTotal: number;
  people: number;
  aistudy: number;
  coursera: number;
  both: number;
  duplicatesInFile: number;
  errors: string[];
  districtStats: DistrictStat[];
  positionStats: PositionStat[];
  previewRows: PreviewRow[];
}

const TABS = [
  { id: "overview", label: "Умумий" },
  { id: "districts", label: "Ҳудудлар" },
  { id: "positions", label: "Лавозимлар" },
  { id: "errors", label: "Хатолар" },
  { id: "preview", label: "Маълумотлар" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const POSITION_META: Record<string, { label: string; color: string; badgeClass: string }> = {
  "ўқитувчи": { label: "Ўқитувчилар", color: "#3B82F6", badgeClass: "bg-blue-50 text-blue-700 border-blue-200" },
  "талаба":   { label: "Талабалар",   color: "#10B981", badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  "ўқувчи":   { label: "Ўқувчилар",   color: "#8B5CF6", badgeClass: "bg-violet-50 text-violet-700 border-violet-200" },
  "ходим":    { label: "Ходимлар",    color: "#F59E0B", badgeClass: "bg-amber-50 text-amber-700 border-amber-200" },
  "бошқа":    { label: "Бошқалар",    color: "#94A3B8", badgeClass: "bg-slate-50 text-slate-600 border-slate-200" },
};

function KpiCard({
  icon, title, value, sub, accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className={`rounded-2xl p-5 border ${accent} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-60">{title}</p>
        <div className="opacity-40 shrink-0">{icon}</div>
      </div>
      <p className="text-3xl font-bold tracking-tight">{value.toLocaleString("uz-UZ")}</p>
      {sub && <p className="text-xs opacity-50 -mt-1">{sub}</p>}
    </div>
  );
}

const PIE_COLORS = ["#22D3EE", "#10B981", "#A78BFA"];

export function UploadForm() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".xlsx")) {
      toast.error("Фақат .xlsx файл қабул қилинади");
      return;
    }
    setLoading(true);
    setResult(null);
    setActiveTab("overview");
    setShowAllDistricts(false);
    setShowAllErrors(false);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/check", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Хато юз берди");
      setResult(data);
      toast.success(`${data.rowsTotal.toLocaleString()} та сатр таҳлил қилинди`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setLoading(false);
    }
  }

  const shownDistricts = showAllDistricts
    ? (result?.districtStats ?? [])
    : (result?.districtStats ?? []).slice(0, 10);
  const shownErrors = showAllErrors
    ? (result?.errors ?? [])
    : (result?.errors ?? []).slice(0, 20);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── HERO HEADER ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-7 text-white shadow-xl">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle at 70% 50%, white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative flex items-start gap-5">
          <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0 ring-1 ring-blue-400/30">
            <IC.FileSpreadsheet className="w-7 h-7 text-blue-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Excel Файл Таҳлили</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-lg">
              AILeaders.uz · Excel файлни юкланг — тизим ҳудудлар, лавозимлар,
              сертификатлар ва хатолар бўйича батафсил таҳлил кўрсатади
            </p>
          </div>
        </div>
        <div className="relative mt-5 flex flex-wrap gap-2.5 text-xs text-slate-400">
          {[
            { dot: "bg-emerald-400", text: "6-сатрдан бошлаб ўқилади" },
            { dot: "bg-cyan-400",    text: "AiStudy ва Coursera" },
            { dot: "bg-amber-400",   text: "Дубликатлар аниқланади" },
            { dot: "bg-violet-400",  text: "Максимум 10 MB" },
          ].map(({ dot, text }) => (
            <span key={text} className="flex items-center gap-1.5 bg-white/5 rounded-lg px-3 py-1">
              <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* ── DROP ZONE ─────────────────────────────────────────────── */}
      {!result && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Файл юклаш"
          className={`relative rounded-3xl border-2 border-dashed cursor-pointer transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            dragging
              ? "border-blue-400 bg-blue-50 shadow-lg shadow-blue-100"
              : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"
          } ${loading ? "pointer-events-none opacity-60" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onClick={() => !loading && inputRef.current?.click()}
          onKeyDown={(e) => e.key === "Enter" && !loading && inputRef.current?.click()}
        >
          <div className="py-20 px-8 text-center">
            {loading ? (
              <div className="space-y-4">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center">
                  <IC.RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-700">Таҳлил қилинмоқда...</p>
                  <p className="text-sm text-slate-400 mt-1">Бир дақиқа кутинг</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center transition-all duration-200 ${
                  dragging ? "bg-blue-100 scale-110" : "bg-slate-100"
                }`}>
                  <IC.Upload className={`w-9 h-9 transition-colors ${dragging ? "text-blue-500" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-700">
                    {dragging ? "Файлни бу ерга қўйинг" : "Excel файлни шу ерга ташланг"}
                  </p>
                  <p className="text-sm text-slate-400 mt-1.5">ёки файлни танлаш учун bosing</p>
                </div>
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl cursor-pointer hover:bg-blue-700 transition-colors">
                  <IC.FileSpreadsheet className="w-4 h-4" />
                  Файл танлаш
                </span>
                <p className="text-xs text-slate-400">Фақат .xlsx · макс. 10 MB</p>
              </div>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>
      )}

      {/* ── RESULTS ───────────────────────────────────────────────── */}
      {result && (
        <div className="space-y-5">
          {/* Result header */}
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <IC.CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">{result.filename}</p>
                <p className="text-xs text-slate-400">
                  {result.rowsTotal.toLocaleString()} та сатр · {result.people.toLocaleString()} та иштирокчи ·{" "}
                  {result.certsTotal.toLocaleString()} та сертификат
                </p>
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setActiveTab("overview"); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <IC.RefreshCw className="w-3.5 h-3.5" />
              Янги файл
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
            {TABS.map((tab) => {
              const badge = tab.id === "errors" ? result.errors.length : 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  {badge > 0 && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.id ? "bg-red-100 text-red-600" : "bg-red-100/70 text-red-500"
                    }`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── OVERVIEW TAB ────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* KPI grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <KpiCard icon={<IC.BarChart3 className="w-4 h-4" />} title="Жами сатрлар"    value={result.rowsTotal}   sub={result.rowsSkipped > 0 ? `${result.rowsSkipped} та бўш` : undefined} accent="bg-slate-50 border-slate-200 text-slate-900" />
                <KpiCard icon={<IC.Users className="w-4 h-4" />}    title="Иштирокчилар"  value={result.people}      accent="bg-blue-50 border-blue-200 text-blue-900" />
                <KpiCard icon={<IC.Award className="w-4 h-4" />}    title="Сертификатлар" value={result.certsTotal}  accent="bg-emerald-50 border-emerald-200 text-emerald-900" />
                <KpiCard icon={<span className="text-xs font-bold font-mono">AI</span>} title="AiStudy"    value={result.aistudy}  accent="bg-cyan-50 border-cyan-200 text-cyan-900" />
                <KpiCard icon={<span className="text-xs font-bold font-mono">Co</span>} title="Coursera"   value={result.coursera} accent="bg-violet-50 border-violet-200 text-violet-900" />
                <KpiCard icon={<IC.CheckCircle2 className="w-4 h-4" />} title="Иккала платформа" value={result.both} sub="ҳар иккисини олганлар" accent="bg-amber-50 border-amber-200 text-amber-900" />
              </div>

              {/* Charts row */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Donut chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Платформа таркиби</p>
                  <p className="text-xs text-slate-400 mb-4">Иштирокчилар бўйича</p>
                  {(() => {
                    const aiOnly = Math.max(0, result.aistudy - result.both);
                    const coOnly = Math.max(0, result.coursera - result.both);
                    const pieData = [
                      { name: "Фақат AiStudy", value: aiOnly },
                      { name: "Иккала",        value: result.both },
                      { name: "Фақат Coursera",value: coOnly },
                    ].filter((d) => d.value > 0);
                    return (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={52}
                              outerRadius={80}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {pieData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <ReTooltip
                              formatter={(v) => (typeof v === "number" ? v.toLocaleString("uz-UZ") : v)}
                              contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                          {pieData.map((d, i) => (
                            <span key={d.name} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                              {d.name} — {d.value.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Top districts bar chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Топ ҳудудлар</p>
                  <p className="text-xs text-slate-400 mb-4">Сертификат сонига кўра (Top 8)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={result.districtStats.slice(0, 8).map((d) => ({
                        name: d.district.length > 16 ? d.district.slice(0, 14) + "…" : d.district,
                        сертификат: d.certs,
                      }))}
                      layout="vertical"
                      margin={{ left: 0, right: 16, top: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} />
                      <ReTooltip
                        formatter={(v) => [typeof v === "number" ? v.toLocaleString("uz-UZ") : v, "Сертификат"]}
                        contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid #e2e8f0" }}
                      />
                      <Bar dataKey="сертификат" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Alert banners */}
              {result.duplicatesInFile > 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <IC.AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-800 text-sm">Файл ичида дубликатлар топилди</p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      {result.duplicatesInFile} та сертификат бир нечта марта учради — улар жами статистикага кирмайди.
                    </p>
                  </div>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
                  <IC.XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm">{result.errors.length} та хато аниқланди</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      «Хатолар» бўлимига ўтиб батафсил кўришингиз мумкин.
                    </p>
                  </div>
                </div>
              )}
              {result.errors.length === 0 && result.duplicatesInFile === 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
                  <IC.CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  <p className="font-semibold text-emerald-800 text-sm">Хатолар ёки дубликатлар топилмади — файл тоза!</p>
                </div>
              )}
            </div>
          )}

          {/* ── DISTRICTS TAB ─────────────────────────────────────── */}
          {activeTab === "districts" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">{result.districtStats.length} та ҳудуд · сертификат сонига кўра тартибланган</p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded bg-cyan-400 inline-block" /> AiStudy</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded bg-violet-400 inline-block" /> Coursera</span>
                </div>
              </div>
              {(() => {
                const max = Math.max(...result.districtStats.map((d) => d.certs), 1);
                return shownDistricts.map((d, idx) => (
                  <div key={d.district} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-default">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold text-slate-300 w-5 text-right tabular-nums">{idx + 1}</span>
                        <IC.MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800 text-sm">{d.district}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-slate-900">{d.certs.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">серт</span>
                        <span className="text-slate-200 mx-2">|</span>
                        <span className="text-xs text-slate-500">{d.people.toLocaleString()} киши</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(d.certs / max) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2.5 text-xs text-slate-400">
                      <span>AiStudy: <strong className="text-cyan-700">{d.aistudy}</strong></span>
                      <span>Coursera: <strong className="text-violet-700">{d.coursera}</strong></span>
                      <span>Иккала: <strong className="text-emerald-700">{d.both}</strong></span>
                    </div>
                  </div>
                ));
              })()}
              {result.districtStats.length > 10 && (
                <button
                  onClick={() => setShowAllDistricts((v) => !v)}
                  className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {showAllDistricts
                    ? "Камроқ кўрсатиш ↑"
                    : `Яна ${result.districtStats.length - 10} та ҳудудни кўрсатиш ↓`}
                </button>
              )}
            </div>
          )}

          {/* ── POSITIONS TAB ─────────────────────────────────────── */}
          {activeTab === "positions" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">{result.positionStats.length} та лавозим тури</p>
              {result.positionStats.map((p) => {
                const meta = POSITION_META[p.position] ?? {
                  label: p.position,
                  color: "#94A3B8",
                  badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
                };
                const pct = result.people > 0 ? Math.round((p.people / result.people) * 100) : 0;
                return (
                  <div key={p.position} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-sm transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <IC.Briefcase className="w-4 h-4 text-slate-300" />
                        <span className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-bold text-slate-900">{p.people.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">киши</span>
                        <span className="text-slate-200 mx-2">|</span>
                        <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: meta.color }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{p.certs.toLocaleString()} та сертификат</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ERRORS TAB ────────────────────────────────────────── */}
          {activeTab === "errors" && (
            <div className="space-y-3">
              {result.errors.length === 0 ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <IC.CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <p className="font-semibold text-emerald-800">Хатолар топилмади!</p>
                  <p className="text-sm text-emerald-600 mt-1">Барча ссылкалар тўғри форматда</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-500">
                    Жами {result.errors.length} та хато — нотўғри ёки ноаниқ ссылкалар
                  </p>
                  <div className="space-y-2">
                    {shownErrors.map((err, i) => (
                      <div key={i} className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl p-3">
                        <IC.XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 font-mono leading-relaxed break-all">{err}</p>
                      </div>
                    ))}
                  </div>
                  {result.errors.length > 20 && (
                    <button
                      onClick={() => setShowAllErrors((v) => !v)}
                      className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      {showAllErrors
                        ? "Камроқ кўрсатиш ↑"
                        : `Яна ${result.errors.length - 20} та хатони кўрсатиш ↓`}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── PREVIEW TAB ───────────────────────────────────────── */}
          {activeTab === "preview" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Биринчи {result.previewRows.length} та сатр
                <span className="ml-1.5 text-red-400">(қизил — формат хатоси бор)</span>
              </p>
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        {["#", "ФИО", "Ҳудуд", "Ташкилот", "AiStudy", "Coursera"].map((h) => (
                          <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.previewRows.map((row, i) => (
                        <tr
                          key={row.row}
                          className={`border-b border-slate-100 ${
                            row.hasErrors ? "bg-red-50" : i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
                          }`}
                        >
                          <td className="px-3 py-2.5 text-xs text-slate-300 font-mono">{row.row}</td>
                          <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[160px] truncate">
                            {row.name ?? <span className="text-slate-300 italic text-xs">бўш</span>}
                          </td>
                          <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{row.district ?? "—"}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[140px] truncate">{row.organization ?? "—"}</td>
                          <td className="px-3 py-2.5">
                            {row.aiUrl ? (
                              <a href={row.aiUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-cyan-600 hover:underline cursor-pointer">
                                <IC.CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <IC.ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ) : <span className="text-slate-200 text-xs">—</span>}
                          </td>
                          <td className="px-3 py-2.5">
                            {row.coUrl ? (
                              <a href={row.coUrl} target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-violet-600 hover:underline cursor-pointer">
                                <IC.CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <IC.ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ) : <span className="text-slate-200 text-xs">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
