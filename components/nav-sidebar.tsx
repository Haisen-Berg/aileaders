"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileSpreadsheet, BarChart3 } from "lucide-react";

const NAV = [
  {
    href: "/",
    icon: FileSpreadsheet,
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
            <BarChart3 className="w-5 h-5 text-white" />
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
