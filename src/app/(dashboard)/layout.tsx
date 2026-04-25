import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AlertaBanner } from "@/components/layout/AlertaBanner";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":   { title: "Dashboard",    subtitle: "Resumen general del inventario" },
  "/productos":   { title: "Productos",    subtitle: "Gestión de inventario y stock" },
  "/proveedores": { title: "Proveedores",  subtitle: "Gestión de proveedores y contactos" },
  "/compras":     { title: "Compras",      subtitle: "Órdenes de compra y facturas" },
  "/salidas":     { title: "Salidas",      subtitle: "Consumo y merma de inventario" },
  "/reportes":    { title: "Reportes",     subtitle: "Análisis y exportación de datos" },
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Get critical products for the alert banner
  const { data: criticalProducts } = await supabase
    .from("productos")
    .select("id, nombre, stock_actual, stock_minimo")
    .filter("stock_actual", "lt", "stock_minimo")
    .order("nombre")
    .limit(10);

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
          userEmail={user.email}
        />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
