"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Умумий кўринш" },
  { href: "/dashboard/districts", label: "Ҳудудлар" },
  { href: "/dashboard/organizations", label: "Ташкилотлар" },
  { href: "/dashboard/positions", label: "Лавозимлар" },
  { href: "/dashboard/platforms", label: "Платформалар" },
  { href: "/upload", label: "📥 Юклаш", divider: true },
  { href: "/records", label: "📋 Барча ёзувлар" },
];

export function NavSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-56 min-h-screen bg-slate-900 text-white flex flex-col">
      <div className="px-4 py-5 border-b border-slate-700">
        <p className="text-xs text-slate-400 leading-tight">AILeaders.uz</p>
        <p className="font-semibold text-sm mt-0.5">Сертификатлар</p>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map((item) => (
          <div key={item.href}>
            {item.divider && <div className="border-t border-slate-700 my-2" />}
            <Link
              href={item.href}
              className={cn(
                "block rounded px-3 py-2 text-sm transition-colors",
                pathname === item.href
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:bg-slate-800"
              )}
            >
              {item.label}
            </Link>
          </div>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-700 flex items-center gap-2">
        <UserButton />
        <span className="text-xs text-slate-400">Профиль</span>
      </div>
    </aside>
  );
}
