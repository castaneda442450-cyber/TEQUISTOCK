import { redirect } from "next/navigation";
import { getSession } from "@/lib/actions/auth.actions";
import { createServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AlertaBanner } from "@/components/layout/AlertaBanner";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = await getSession();

  if (!user) redirect("/login");

  // Get critical products for the alert banner (best-effort; ignore errors)
  let criticalProducts: Array<{ id: string; nombre: string; stock_actual: number; stock_minimo: number }> | null = null;
  try {
    const supabase = await createServerClient();
    const { data } = await supabase
      .from("productos")
      .select("id, nombre, stock_actual, stock_minimo")
      .filter("stock_actual", "lt", "stock_minimo")
      .order("nombre")
      .limit(10);
    criticalProducts = data;
  } catch {
    criticalProducts = null;
  }

  // Default title (TopBar reads pathname client-side too)
  const defaultMeta = { title: "TequiStock", subtitle: "Control de Inventarios" };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "hsl(var(--bg))" }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area — offset from sidebar */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ marginLeft: "240px" }}
        id="main-content"
      >
        {/* Alert banner */}
        {criticalProducts && criticalProducts.length > 0 && (
          <AlertaBanner criticalProducts={criticalProducts} />
        )}

        {/* TopBar */}
        <TopBar
          title={defaultMeta.title}
          subtitle={defaultMeta.subtitle}
          userEmail={user.username}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
