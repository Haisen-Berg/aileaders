"use client";

import { useState, useRef, useMemo, useEffect, Fragment } from "react";
import { normalizeName } from "@/lib/normalize/name";

// Inline SVG icons — no lucide-react dependency
const IC = {
  Upload: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  Search: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  Loader2: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
  ShieldCheck: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>,
  X: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>,
  GraduationCap: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>,
  BookOpen: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/></svg>,
  HardHat: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1z"/><path d="M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5"/><path d="M4 15v-3a6 6 0 0 1 6-6"/><path d="M14 6a6 6 0 0 1 6 6v3"/></svg>,
  Users2: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M14 19a6 6 0 0 0-12 0"/><circle cx="8" cy="9" r="4"/><path d="M22 19a6 6 0 0 0-6-6 4 4 0 1 0 0-8"/></svg>,
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
  Building2: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>,
  Copy: (p: React.SVGProps<SVGSVGElement>) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
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

interface OrgStat {
  organization: string;
  people: number;
  certs: number;
  aistudy: number;
  coursera: number;
  both: number;
}

interface ErrorDetail {
  row: number;
  name: string | null;
  district: string | null;
  organization: string | null;
  position: string;
  platform: "aistudy" | "coursera";
  url: string;
  reason: string;
}

interface PositionStat {
  position: string;
  people: number;
  certs: number;
}

type PositionCategory = "teachers" | "learners" | "employees" | "other";

interface CategoryStat {
  category: PositionCategory;
  label: string;
  people: number;
  certs: number;
}

interface LinkSampleSummary {
  total: number;
  alive: number;
  dead: number;
  timeouts: number;
  deadUrls: string[];
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

interface CertItem {
  url: string;
  expectedName: string | null;
  rowNumber: number;
  platform: "aistudy" | "coursera";
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
  errors: ErrorDetail[];
  districtStats: DistrictStat[];
  orgStats: OrgStat[];
  positionStats: PositionStat[];
  categoryStats: CategoryStat[];
  linkSample: LinkSampleSummary | null;
  allCertUrls: string[];
  allCertItems: CertItem[];
  previewRows: PreviewRow[];
}

// Deterministic LCG sample so the same file produces the same 50 URLs each click.
function deterministicSample<T>(arr: T[], n: number, seed = 1): T[] {
  if (arr.length <= n) return arr.slice();
  const idx = arr.map((_, i) => i);
  let s = seed >>> 0;
  for (let i = idx.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx.slice(0, n).map((i) => arr[i]);
}

const CATEGORY_META: Record<
  PositionCategory,
  { color: string; bgClass: string; iconKey: keyof typeof IC }
> = {
  teachers:  { color: "#3B82F6", bgClass: "from-blue-50 to-blue-100/40 border-blue-200 text-blue-900",       iconKey: "GraduationCap" },
  learners:  { color: "#10B981", bgClass: "from-emerald-50 to-emerald-100/40 border-emerald-200 text-emerald-900", iconKey: "BookOpen" },
  employees: { color: "#F59E0B", bgClass: "from-amber-50 to-amber-100/40 border-amber-200 text-amber-900",   iconKey: "HardHat" },
  other:     { color: "#94A3B8", bgClass: "from-slate-50 to-slate-100/40 border-slate-200 text-slate-700",   iconKey: "Users2" },
};

const TABS = [
  { id: "overview", label: "Умумий" },
  { id: "districts", label: "Ҳудудлар" },
  { id: "orgs", label: "Ташкилотлар" },
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

function UrlCell({
  url,
  accent,
  checkKey,
  check,
  expectedName,
  onCheck,
  onPreview,
}: {
  url: string | null;
  accent: "cyan" | "violet";
  checkKey: string;
  check: RowCheck | undefined;
  expectedName: string | null;
  onCheck: (key: string, url: string, expectedName?: string | null) => void;
  onPreview: (url: string) => void;
}) {
  if (!url) return <span className="text-slate-200 text-xs">—</span>;
  const colorClass = accent === "cyan" ? "text-cyan-600" : "text-violet-600";
  const bgHover = accent === "cyan" ? "hover:bg-cyan-50" : "hover:bg-violet-50";
  const status = check?.status;

  let btnClass = `${colorClass} ${bgHover}`;
  let btnTitle = "Сертификатни тасдиқлаш";
  let btnIcon = <IC.ShieldCheck className="w-3.5 h-3.5" />;
  if (status === "checking") {
    btnIcon = <IC.Loader2 className="w-3.5 h-3.5 animate-spin" />;
  } else if (status === "verified") {
    btnClass = "text-emerald-600 bg-emerald-50";
    btnIcon = <IC.CheckCircle2 className="w-3.5 h-3.5" />;
    btnTitle = `Тасдиқланди${check?.foundName ? ` — ${check.foundName}` : ""}`;
  } else if (status === "name_mismatch") {
    btnClass = "text-amber-600 bg-amber-50";
    btnIcon = <IC.AlertTriangle className="w-3.5 h-3.5" />;
    btnTitle = `ФИО мос келмайди${check?.foundName ? ` — сертификатда: ${check.foundName}` : ""}`;
  } else if (status === "not_found") {
    btnClass = "text-red-600 bg-red-50";
    btnIcon = <IC.XCircle className="w-3.5 h-3.5" />;
    btnTitle = "Сертификат топилмади";
  } else if (status === "dead" || status === "timeout") {
    btnClass = "text-red-600 bg-red-50";
    btnIcon = <IC.XCircle className="w-3.5 h-3.5" />;
    btnTitle = check?.error ? `Хато: ${check.error}` : "Очилмади";
  }

  return (
    <div className="inline-flex items-center gap-1">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title="Янги вкладкада очиш"
        className={`p-1 rounded ${bgHover} ${colorClass} transition-colors`}
      >
        <IC.ExternalLink className="w-3.5 h-3.5" />
      </a>
      <button
        type="button"
        onClick={() => onPreview(url)}
        title="Кўриб чиқиш"
        className={`p-1 rounded ${bgHover} ${colorClass} transition-colors cursor-pointer`}
      >
        <IC.Search className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onCheck(checkKey, url, expectedName)}
        disabled={status === "checking"}
        title={btnTitle}
        className={`p-1 rounded transition-colors cursor-pointer disabled:cursor-wait ${btnClass}`}
      >
        {btnIcon}
      </button>
    </div>
  );
}

function PreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isCoursera = /coursera\.org/i.test(url);
  // Coursera serves the recipient name on /account/accomplishments/verify/, not the short /verify/
  const externalUrl = isCoursera
    ? url.replace(/coursera\.org\/verify\//i, "coursera.org/account/accomplishments/verify/")
    : url;
  // Coursera blocks iframe embedding (X-Frame-Options DENY) — skip iframe entirely for it
  const [blocked, setBlocked] = useState(isCoursera);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (isCoursera) return; // skip iframe entirely for Coursera
    // If iframe doesn't load within 4s, assume X-Frame-Options blocked it
    const timer = setTimeout(() => {
      if (!loaded) setBlocked(true);
    }, 4000);
    return () => clearTimeout(timer);
  }, [loaded, isCoursera]);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 min-w-0">
            <IC.Search className="w-4 h-4 text-slate-400 shrink-0" />
            <p className="text-sm font-mono text-slate-500 truncate">{externalUrl}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <IC.ExternalLink className="w-3.5 h-3.5" />
              Очиш
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-500 cursor-pointer"
              title="Ёпиш"
            >
              <IC.X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 relative bg-slate-100">
          {blocked && (
            <div className="absolute inset-0 flex items-center justify-center p-6 bg-white">
              <div className="text-center max-w-md">
                <div className="w-14 h-14 mx-auto bg-amber-100 rounded-2xl flex items-center justify-center mb-3">
                  <IC.AlertTriangle className="w-7 h-7 text-amber-500" />
                </div>
                <p className="font-semibold text-slate-700">
                  {isCoursera
                    ? "Coursera iframe-да очилмайди"
                    : "Сайт ичкарига жойлаштириш рухсат бермайди"}
                </p>
                <p className="text-sm text-slate-500 mt-1.5 mb-4">
                  {isCoursera
                    ? "Coursera хавфсизлик сабабли (X-Frame-Options) ўз сертификатини бошқа сайтларда кўрсатишни рухсат бермайди. Сертификатни янги вкладкада очинг — у ерда олувчи ФИО си кўринади."
                    : "Сертификатни янги вкладкада очинг."}
                </p>
                <a
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <IC.ExternalLink className="w-4 h-4" />
                  Янги вкладкада очиш
                </a>
              </div>
            </div>
          )}
          {!isCoursera && (
            <iframe
              src={url}
              className="w-full h-full"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              referrerPolicy="no-referrer"
              onLoad={() => setLoaded(true)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

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

type LoadStage = "idle" | "uploading" | "parsing" | "checking";
type VerifyStatus = "verified" | "name_mismatch" | "not_found" | "dead" | "timeout";
type RowCheckStatus = "checking" | VerifyStatus;
interface RowCheck {
  status: RowCheckStatus;
  foundName?: string | null;
  error?: string | null;
}

export function UploadForm() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<LoadStage>("idle");
  const [result, setResult] = useState<CheckResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showAllDistricts, setShowAllDistricts] = useState(false);
  const [showAllOrgs, setShowAllOrgs] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showAllPositions, setShowAllPositions] = useState(false);
  const [rowChecks, setRowChecks] = useState<Record<string, RowCheck>>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [linkSample, setLinkSample] = useState<LinkSampleSummary | null>(null);
  const [linkSampleStatus, setLinkSampleStatus] = useState<"idle" | "checking" | "error">("idle");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [verifyProgress, setVerifyProgress] = useState<{
    status: "idle" | "running" | "done";
    done: number; total: number;
    verified: number; mismatch: number; dead: number;
  } | null>(null);
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
    setShowAllOrgs(false);
    setShowAllErrors(false);
    setShowAllPositions(false);
    setRowChecks({});
    setLinkSample(null);
    setLinkSampleStatus("idle");
    setExpandedGroups(new Set());
    setVerifyProgress(null);
    setStage("uploading");
    // Pseudo-stage transitions while waiting on server — real progress isn't available
    // mid-request, but the user gets feedback that something is moving.
    const t1 = setTimeout(() => setStage("parsing"), 600);
    const t2 = setTimeout(() => setStage("checking"), 2500);
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
      clearTimeout(t1);
      clearTimeout(t2);
      setStage("idle");
      setLoading(false);
    }
  }

  async function handleSampleCheck() {
    if (!result || result.allCertUrls.length === 0) return;
    setLinkSampleStatus("checking");
    setLinkSample(null);
    try {
      const sample = deterministicSample(result.allCertUrls, Math.min(50, result.allCertUrls.length));
      const res = await fetch("/api/check-sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: sample }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Текширишда хато");
      setLinkSample(data);
      setLinkSampleStatus("idle");
    } catch (e) {
      setLinkSampleStatus("error");
      toast.error(String(e));
    }
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleRowCheck(key: string, url: string, expectedName?: string | null) {
    setRowChecks((s) => ({ ...s, [key]: { status: "checking" } }));
    try {
      const res = await fetch("/api/check-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, expectedName: expectedName ?? null }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRowChecks((s) => ({ ...s, [key]: { status: "dead", error: data.error } }));
        return;
      }
      setRowChecks((s) => ({
        ...s,
        [key]: {
          status: data.status as VerifyStatus,
          foundName: data.foundName ?? null,
          error: data.error ?? null,
        },
      }));
    } catch (e) {
      setRowChecks((s) => ({ ...s, [key]: { status: "dead", error: String(e) } }));
    }
  }

  async function handleVerifyAll() {
    if (!result || !result.allCertItems.length) return;
    const items = result.allCertItems;
    if (items.length > 10000) {
      toast.error(`Жуда кўп сертификат (${items.length}) — макс. 10000`);
      return;
    }
    setVerifyProgress({ status: "running", done: 0, total: items.length, verified: 0, mismatch: 0, dead: 0 });
    // mark all as checking initially for visible rows
    setRowChecks((prev) => {
      const next = { ...prev };
      for (const it of items) {
        next[`${it.rowNumber}:${it.platform === "aistudy" ? "ai" : "co"}`] = { status: "checking" };
      }
      return next;
    });

    const CHUNK = 50;
    let done = 0, verified = 0, mismatch = 0, dead = 0;
    for (let i = 0; i < items.length; i += CHUNK) {
      const chunk = items.slice(i, i + CHUNK);
      try {
        const res = await fetch("/api/verify-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: chunk.map((c) => ({ url: c.url, expectedName: c.expectedName })),
          }),
        });
        const data = await res.json();
        const results: Array<{ url: string; status: VerifyStatus; foundName: string | null; error: string | null }> =
          data.results ?? [];
        setRowChecks((prev) => {
          const next = { ...prev };
          for (let j = 0; j < chunk.length; j++) {
            const it = chunk[j];
            const r = results[j];
            const key = `${it.rowNumber}:${it.platform === "aistudy" ? "ai" : "co"}`;
            if (r) {
              next[key] = { status: r.status, foundName: r.foundName, error: r.error };
              if (r.status === "verified") verified++;
              else if (r.status === "name_mismatch") mismatch++;
              else dead++;
            } else {
              next[key] = { status: "dead", error: "no result" };
              dead++;
            }
          }
          return next;
        });
      } catch {
        // mark this chunk as dead
        setRowChecks((prev) => {
          const next = { ...prev };
          for (const it of chunk) {
            const key = `${it.rowNumber}:${it.platform === "aistudy" ? "ai" : "co"}`;
            next[key] = { status: "dead", error: "network" };
            dead++;
          }
          return next;
        });
      }
      done += chunk.length;
      setVerifyProgress({ status: "running", done, total: items.length, verified, mismatch, dead });
    }
    setVerifyProgress({ status: "done", done, total: items.length, verified, mismatch, dead });
    toast.success(`Текшириш якунланди: ${verified} ✓ / ${mismatch} ⚠ / ${dead} ✗`);
  }

  const shownDistricts = useMemo(
    () => (showAllDistricts ? result?.districtStats ?? [] : (result?.districtStats ?? []).slice(0, 10)),
    [result?.districtStats, showAllDistricts]
  );
  const shownOrgs = useMemo(
    () => (showAllOrgs ? result?.orgStats ?? [] : (result?.orgStats ?? []).slice(0, 10)),
    [result?.orgStats, showAllOrgs]
  );
  const shownErrors = useMemo(
    () => (showAllErrors ? result?.errors ?? [] : (result?.errors ?? []).slice(0, 20)),
    [result?.errors, showAllErrors]
  );

  const pieData = useMemo(() => {
    if (!result) return [];
    const aiOnly = Math.max(0, result.aistudy - result.both);
    const coOnly = Math.max(0, result.coursera - result.both);
    return [
      { name: "Фақат AiStudy", value: aiOnly },
      { name: "Иккала", value: result.both },
      { name: "Фақат Coursera", value: coOnly },
    ].filter((d) => d.value > 0);
  }, [result]);

  const districtsBarData = useMemo(
    () =>
      (result?.districtStats ?? []).slice(0, 8).map((d) => ({
        name: d.district.length > 16 ? d.district.slice(0, 14) + "…" : d.district,
        сертификат: d.certs,
      })),
    [result?.districtStats]
  );

  const linkSamplePct = useMemo(() => {
    if (!linkSample || linkSample.total === 0) return null;
    return Math.round((linkSample.alive / linkSample.total) * 100);
  }, [linkSample]);

  // Group preview rows by FIO. Same person across multiple rows = one expandable group.
  const groupedPreview = useMemo(() => {
    if (!result) return [];
    const groups = new Map<string, { key: string; rows: PreviewRow[] }>();
    for (const r of result.previewRows) {
      const k = r.name && r.name.trim() ? normalizeName(r.name) : `__r${r.row}`;
      if (!groups.has(k)) groups.set(k, { key: k, rows: [] });
      groups.get(k)!.rows.push(r);
    }
    return [...groups.values()];
  }, [result]);

  // Lock body scroll while iframe modal is open
  useEffect(() => {
    if (previewUrl) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [previewUrl]);

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
              <div className="space-y-5 max-w-sm mx-auto">
                <div className="w-16 h-16 mx-auto bg-blue-100 rounded-2xl flex items-center justify-center">
                  <IC.Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-700">
                    {stage === "uploading" && "Файл юкланмоқда..."}
                    {stage === "parsing" && "Маълумотлар таҳлил қилинмоқда..."}
                    {stage === "checking" && "Ссылкалар текширилмоқда..."}
                    {stage === "idle" && "Тайёрланмоқда..."}
                  </p>
                  <p className="text-sm text-slate-400 mt-1">Бир дақиқа кутинг</p>
                </div>
                <div className="flex items-center gap-2 justify-center">
                  {(["uploading", "parsing", "checking"] as LoadStage[]).map((s, i) => {
                    const order: LoadStage[] = ["uploading", "parsing", "checking"];
                    const cur = order.indexOf(stage);
                    const idx = order.indexOf(s);
                    const done = idx < cur;
                    const active = idx === cur;
                    return (
                      <div
                        key={s}
                        className={`h-1.5 w-16 rounded-full transition-all ${
                          done ? "bg-blue-500" : active ? "bg-blue-300 animate-pulse" : "bg-slate-200"
                        }`}
                      />
                    );
                  })}
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
                </div>

                {/* Top districts bar chart */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <p className="text-sm font-semibold text-slate-700 mb-1">Топ ҳудудлар</p>
                  <p className="text-xs text-slate-400 mb-4">Сертификат сонига кўра (Top 8)</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={districtsBarData}
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

              {/* ── LINK SAMPLE (manual) ────────────────────────────── */}
              {result.allCertUrls.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <IC.ShieldCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">Ссылкаларнинг ҳолати</p>
                        <p className="text-xs text-slate-400">
                          {linkSample
                            ? `${linkSample.total} та тасодифий ссылка текширилди`
                            : `Жами ${result.allCertUrls.length.toLocaleString()} та сертификат — 50 тасини тасодифий текширишингиз мумкин`}
                        </p>
                      </div>
                    </div>
                    {linkSample && linkSamplePct !== null ? (
                      <div className="text-right">
                        <p
                          className={`text-2xl font-bold ${
                            linkSamplePct >= 90 ? "text-emerald-600"
                              : linkSamplePct >= 70 ? "text-amber-600"
                              : "text-red-600"
                          }`}
                        >
                          {linkSamplePct}%
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">тирик</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSampleCheck}
                        disabled={linkSampleStatus === "checking"}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors cursor-pointer disabled:cursor-wait shrink-0"
                      >
                        {linkSampleStatus === "checking" ? (
                          <>
                            <IC.Loader2 className="w-4 h-4 animate-spin" />
                            Текширилмоқда...
                          </>
                        ) : (
                          <>
                            <IC.ShieldCheck className="w-4 h-4" />
                            Ссылкаларни текшириш
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {linkSample && (
                    <>
                      <div className="flex h-2 rounded-full overflow-hidden bg-slate-100 mb-3">
                        {linkSample.alive > 0 && (
                          <div className="bg-emerald-500" style={{ width: `${(linkSample.alive / linkSample.total) * 100}%` }} />
                        )}
                        {linkSample.timeouts > 0 && (
                          <div className="bg-amber-400" style={{ width: `${(linkSample.timeouts / linkSample.total) * 100}%` }} />
                        )}
                        {linkSample.dead > 0 && (
                          <div className="bg-red-500" style={{ width: `${(linkSample.dead / linkSample.total) * 100}%` }} />
                        )}
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                            Тирик: <strong className="text-slate-700">{linkSample.alive}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                            Таймаут: <strong className="text-slate-700">{linkSample.timeouts}</strong>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                            Битик: <strong className="text-slate-700">{linkSample.dead}</strong>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleSampleCheck}
                          disabled={linkSampleStatus === "checking"}
                          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <IC.RefreshCw className="w-3.5 h-3.5" />
                          Қайта текшириш
                        </button>
                      </div>
                      {linkSample.deadUrls.length > 0 && (
                        <details className="mt-4">
                          <summary className="cursor-pointer text-xs text-slate-500 hover:text-slate-700 select-none">
                            Муаммоли ссылкаларни кўрсатиш ({linkSample.deadUrls.length})
                          </summary>
                          <div className="mt-2 space-y-1">
                            {linkSample.deadUrls.map((u, i) => (
                              <div key={i} className="text-[11px] font-mono text-red-600 bg-red-50 rounded px-2 py-1 break-all">
                                {u}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </>
                  )}
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

          {/* ── ORGS TAB ──────────────────────────────────────────── */}
          {activeTab === "orgs" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {result.orgStats.length} та ташкилот · сертификат сонига кўра тартибланган
                </p>
                <div className="flex gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded bg-cyan-400 inline-block" /> AiStudy</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 rounded bg-violet-400 inline-block" /> Coursera</span>
                </div>
              </div>
              {(() => {
                const max = Math.max(...result.orgStats.map((o) => o.certs), 1);
                return shownOrgs.map((o, idx) => (
                  <div key={o.organization} className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-300 hover:shadow-sm transition-all cursor-default">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-bold text-slate-300 w-5 text-right tabular-nums shrink-0">{idx + 1}</span>
                        <IC.Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-800 text-sm truncate">{o.organization}</span>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <span className="text-base font-bold text-slate-900">{o.certs.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">серт</span>
                        <span className="text-slate-200 mx-2">|</span>
                        <span className="text-xs text-slate-500">{o.people.toLocaleString()} киши</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${(o.certs / max) * 100}%` }}
                      />
                    </div>
                    <div className="flex gap-4 mt-2.5 text-xs text-slate-400">
                      <span>AiStudy: <strong className="text-cyan-700">{o.aistudy}</strong></span>
                      <span>Coursera: <strong className="text-violet-700">{o.coursera}</strong></span>
                      <span>Иккала: <strong className="text-emerald-700">{o.both}</strong></span>
                    </div>
                  </div>
                ));
              })()}
              {result.orgStats.length > 10 && (
                <button
                  onClick={() => setShowAllOrgs((v) => !v)}
                  className="w-full py-3 text-sm text-slate-500 hover:text-slate-700 border border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {showAllOrgs
                    ? "Камроқ кўрсатиш ↑"
                    : `Яна ${result.orgStats.length - 10} та ташкилотни кўрсатиш ↓`}
                </button>
              )}
            </div>
          )}

          {/* ── POSITIONS TAB ─────────────────────────────────────── */}
          {activeTab === "positions" && (
            <div className="space-y-5">
              {/* High-level 4 categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {result.categoryStats.map((c) => {
                  const meta = CATEGORY_META[c.category];
                  const Icon = IC[meta.iconKey];
                  const pct = result.people > 0 ? Math.round((c.people / result.people) * 100) : 0;
                  return (
                    <div
                      key={c.category}
                      className={`rounded-2xl border bg-gradient-to-br p-4 ${meta.bgClass}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="w-5 h-5 opacity-70" />
                        <span className="text-xs font-semibold opacity-50">{pct}%</span>
                      </div>
                      <p className="text-2xl font-bold tracking-tight">
                        {c.people.toLocaleString("uz-UZ")}
                      </p>
                      <p className="text-xs font-semibold mt-0.5 opacity-80">{c.label}</p>
                      <p className="text-[11px] opacity-60 mt-1">
                        {c.certs.toLocaleString()} та сертификат
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Collapsible detailed breakdown */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setShowAllPositions((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <IC.Briefcase className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      Батафсил рўйхат
                    </span>
                    <span className="text-xs text-slate-400">
                      {result.positionStats.length} тур
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {showAllPositions ? "Йиғиш ↑" : "Очиш ↓"}
                  </span>
                </button>
                {showAllPositions && (
                  <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/40">
                    {result.positionStats.map((p) => {
                      const meta = POSITION_META[p.position] ?? {
                        label: p.position,
                        color: "#94A3B8",
                        badgeClass: "bg-slate-50 text-slate-600 border-slate-200",
                      };
                      const pct = result.people > 0 ? Math.round((p.people / result.people) * 100) : 0;
                      return (
                        <div key={p.position} className="bg-white border border-slate-200 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${meta.badgeClass}`}>
                              {meta.label}
                            </span>
                            <div className="text-right">
                              <span className="text-sm font-bold text-slate-900">{p.people.toLocaleString()}</span>
                              <span className="text-xs text-slate-400 ml-1">киши</span>
                              <span className="text-slate-200 mx-2">|</span>
                              <span className="text-xs font-semibold text-slate-500">{pct}%</span>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: meta.color }}
                            />
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            {p.certs.toLocaleString()} та сертификат
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Жами <strong className="text-red-600">{result.errors.length}</strong> та хато — нотўғри форматдаги ссылкалар
                    </p>
                    <div className="flex gap-2 text-[11px]">
                      <span className="px-2 py-0.5 rounded-md bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
                        AiStudy: {result.errors.filter(e => e.platform === "aistudy").length}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200 font-medium">
                        Coursera: {result.errors.filter(e => e.platform === "coursera").length}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {shownErrors.map((err, i) => (
                      <div key={i} className="bg-white border border-red-100 rounded-2xl p-4 space-y-3 shadow-sm">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                              Сатр {err.row}
                            </span>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${
                              err.platform === "aistudy"
                                ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                                : "bg-violet-50 text-violet-700 border-violet-200"
                            }`}>
                              {err.platform === "aistudy" ? "AiStudy" : "Coursera"}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200">
                              {err.reason}
                            </span>
                          </div>
                          <IC.XCircle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                        </div>
                        {/* Person name */}
                        {err.name && (
                          <p className="text-sm font-semibold text-slate-800">{err.name}</p>
                        )}
                        {/* Meta chips */}
                        <div className="flex flex-wrap gap-2">
                          {err.district && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                              <IC.MapPin className="w-3 h-3" />
                              {err.district}
                            </span>
                          )}
                          {err.organization && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                              <IC.Building2 className="w-3 h-3" />
                              {err.organization}
                            </span>
                          )}
                          {err.position && err.position !== "бошқа" && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2 py-0.5">
                              <IC.Briefcase className="w-3 h-3" />
                              {POSITION_META[err.position]?.label ?? err.position}
                            </span>
                          )}
                        </div>
                        {/* Bad URL */}
                        <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
                          <IC.XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-mono text-red-700 break-all leading-relaxed">{err.url}</p>
                          </div>
                          <button
                            type="button"
                            title="Нусха олиш"
                            className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                            onClick={() => navigator.clipboard.writeText(err.url)}
                          >
                            <IC.Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
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
              {/* Bulk verification card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <IC.ShieldCheck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Барча сертификатларни тасдиқлаш</p>
                      <p className="text-xs text-slate-400">
                        {result.allCertItems.length.toLocaleString()} та сертификат · ҳар бирини Coursera/AiStudy саҳифасидан текширади
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyAll}
                    disabled={verifyProgress?.status === "running" || result.allCertItems.length === 0}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:bg-emerald-400 transition-colors cursor-pointer disabled:cursor-wait"
                  >
                    {verifyProgress?.status === "running" ? (
                      <>
                        <IC.Loader2 className="w-4 h-4 animate-spin" />
                        Текширилмоқда... ({verifyProgress.done}/{verifyProgress.total})
                      </>
                    ) : verifyProgress?.status === "done" ? (
                      <>
                        <IC.RefreshCw className="w-4 h-4" />
                        Қайта текшириш
                      </>
                    ) : (
                      <>
                        <IC.ShieldCheck className="w-4 h-4" />
                        Барчасини текшириш
                      </>
                    )}
                  </button>
                </div>
                {verifyProgress && (
                  <>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${(verifyProgress.done / Math.max(1, verifyProgress.total)) * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <IC.CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Тасдиқланди: <strong className="text-emerald-700">{verifyProgress.verified}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <IC.AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        ФИО мос эмас: <strong className="text-amber-700">{verifyProgress.mismatch}</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <IC.XCircle className="w-3.5 h-3.5 text-red-500" />
                        Хато / топилмади: <strong className="text-red-700">{verifyProgress.dead}</strong>
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-slate-500">
                {groupedPreview.length} та одам · {result.previewRows.length} та сатр
                <span className="ml-1.5 text-red-400">(қизил — формат хатоси бор)</span>
                <span className="ml-1.5 text-blue-400">(кўп серт. — кенгайтириш ▾)</span>
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
                      {groupedPreview.map((group, gi) => {
                        const head = group.rows[0];
                        const count = group.rows.length;
                        const isMulti = count > 1;
                        const expanded = expandedGroups.has(group.key);
                        const stripe = gi % 2 === 0 ? "bg-white" : "bg-slate-50/40";
                        const errorBg = head.hasErrors ? "bg-red-50" : stripe;
                        return (
                          <Fragment key={group.key}>
                            <tr
                              className={`border-b border-slate-100 ${errorBg} ${isMulti ? "cursor-pointer hover:bg-blue-50/40" : ""}`}
                              onClick={isMulti ? () => toggleGroup(group.key) : undefined}
                            >
                              <td className="px-3 py-2.5 text-xs text-slate-300 font-mono whitespace-nowrap">
                                {isMulti ? (
                                  <span className="inline-flex items-center gap-1 text-blue-600 font-semibold">
                                    {expanded ? "▾" : "▸"} {head.row}
                                  </span>
                                ) : head.row}
                              </td>
                              <td className="px-3 py-2.5 font-medium text-slate-800 max-w-[200px]">
                                <div className="flex items-center gap-2">
                                  <span className="truncate">
                                    {head.name ?? <span className="text-slate-300 italic text-xs">бўш</span>}
                                  </span>
                                  {isMulti && (
                                    <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                                      {count} серт.
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{head.district ?? "—"}</td>
                              <td className="px-3 py-2.5 text-xs text-slate-400 max-w-[140px] truncate">{head.organization ?? "—"}</td>
                              <td className="px-3 py-2.5">
                                {isMulti ? (
                                  <span className="text-[11px] text-slate-400">
                                    {group.rows.filter((r) => r.aiUrl).length} та
                                  </span>
                                ) : (
                                  <UrlCell
                                    url={head.aiUrl}
                                    accent="cyan"
                                    checkKey={`${head.row}:ai`}
                                    check={rowChecks[`${head.row}:ai`]}
                                    expectedName={head.name}
                                    onCheck={handleRowCheck}
                                    onPreview={setPreviewUrl}
                                  />
                                )}
                              </td>
                              <td className="px-3 py-2.5">
                                {isMulti ? (
                                  <span className="text-[11px] text-slate-400">
                                    {group.rows.filter((r) => r.coUrl).length} та
                                  </span>
                                ) : (
                                  <UrlCell
                                    url={head.coUrl}
                                    accent="violet"
                                    checkKey={`${head.row}:co`}
                                    check={rowChecks[`${head.row}:co`]}
                                    expectedName={head.name}
                                    onCheck={handleRowCheck}
                                    onPreview={setPreviewUrl}
                                  />
                                )}
                              </td>
                            </tr>
                            {isMulti && expanded && group.rows.map((row, ri) => (
                              <tr key={`${group.key}-${ri}`} className="border-b border-slate-100 bg-blue-50/20">
                                <td className="px-3 py-2 text-[11px] text-slate-400 font-mono pl-8 whitespace-nowrap">
                                  ↳ {row.row}
                                </td>
                                <td colSpan={3} className="px-3 py-2 text-[11px] text-slate-400">
                                  Сертификат #{ri + 1}
                                </td>
                                <td className="px-3 py-2">
                                  <UrlCell
                                    url={row.aiUrl}
                                    accent="cyan"
                                    checkKey={`${row.row}:ai`}
                                    check={rowChecks[`${row.row}:ai`]}
                                    expectedName={row.name}
                                    onCheck={handleRowCheck}
                                    onPreview={setPreviewUrl}
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <UrlCell
                                    url={row.coUrl}
                                    accent="violet"
                                    checkKey={`${row.row}:co`}
                                    check={rowChecks[`${row.row}:co`]}
                                    expectedName={row.name}
                                    onCheck={handleRowCheck}
                                    onPreview={setPreviewUrl}
                                  />
                                </td>
                              </tr>
                            ))}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {previewUrl && <PreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
