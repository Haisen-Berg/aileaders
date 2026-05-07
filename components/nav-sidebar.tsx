"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function IconFileSpreadsheet({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
      <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
      <path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>
    </svg>
  );
}

function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
    </svg>
  );
}

const NAV = [
  {
    href: "/",
    icon: IconFileSpreadsheet,
    label: "Excel Таҳлили",
    description: "Файл юклаш ва текшириш",
  },
];

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col shrink-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/30">
            <IconBarChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-white leading-tight">AILeaders.uz</p>
            <p className="text-xs text-slate-400 leading-tight mt-0.5">Сертификатлар тизими</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-2">
          Асосий
        </p>
        {NAV.map(({ href, icon: Icon, label, description }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-150 group",
                active
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 shadow-sm"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  active ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              <div className="min-w-0">
                <p className={cn("font-medium leading-tight", active ? "text-blue-200" : "")}>
                  {label}
                </p>
                <p className="text-xs text-slate-500 leading-tight mt-0.5 truncate">{description}</p>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-700 flex items-center justify-center">
            <span className="text-xs font-bold text-slate-300">AI</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-300 truncate">5 млн. AI Етакчилар</p>
            <p className="text-[10px] text-slate-500">2026 · Ўзбекистон</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
