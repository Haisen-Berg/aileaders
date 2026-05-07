import { NavSidebar } from "@/components/nav-sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <NavSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
