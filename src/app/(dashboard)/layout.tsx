import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth.actions";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = await getSession();
  if (!user) redirect("/login");

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "hsl(var(--bg))" }}>
      <Sidebar />

      <div
        className="flex-1 flex flex-col min-w-0"
        style={{ marginLeft: "240px" }}
      >
        <TopBar userEmail={user.username} />

        <main className="flex-1 overflow-y-auto" style={{ backgroundColor: "hsl(var(--bg))" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
