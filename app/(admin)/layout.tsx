import { NavSidebar } from "@/components/nav-sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <NavSidebar />
      <main className="flex-1 bg-slate-50 p-6 overflow-auto">{children}</main>
    </div>
  );
}
