"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth.actions";

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  "/dashboard":   { title: "Dashboard",    subtitle: "Vista general del inventario" },
  "/productos":   { title: "Productos",    subtitle: "Gestión de inventario" },
  "/proveedores": { title: "Proveedores",  subtitle: "Gestión de proveedores" },
  "/compras":     { title: "Compras",      subtitle: "Órdenes de compra" },
  "/salidas":     { title: "Salidas",      subtitle: "Consumos y mermas" },
  "/reportes":    { title: "Reportes",     subtitle: "Reportes e informes" },
};

interface TopBarProps {
  userEmail?: string;
}

export function TopBar({ userEmail }: TopBarProps) {
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  const meta = PAGE_META[pathname] ?? { title: "TequiStock", subtitle: "Control de Inventarios" };

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        height: 64,
        borderBottom: `1px solid hsl(var(--border))`,
        display: "flex",
        alignItems: "center",
        paddingLeft: 24,
        paddingRight: 24,
        gap: 16,
        backgroundColor: `hsl(var(--surface) / 0.92)`,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Left: title & subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1
          style={{
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.2,
            color: "hsl(var(--text-main))",
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {meta.title}
        </h1>
        <p
          style={{
            fontSize: 12,
            lineHeight: 1.2,
            color: "hsl(var(--text-sub))",
            margin: "2px 0 0 0",
          }}
        >
          {meta.subtitle}
        </p>
      </div>

      {/* Right: avatar + user info + salir */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 999,
            background: "hsl(var(--terracota))",
            color: "#FFFFFF",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          AD
        </div>

        <div style={{ lineHeight: 1.3 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "hsl(var(--text-main))",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 160,
            }}
          >
            {userEmail ?? "admin"}
          </p>
          <p
            style={{
              fontSize: 11,
              color: "hsl(var(--text-muted))",
              margin: "1px 0 0 0",
            }}
          >
            Administrador
          </p>
        </div>

        <div
          style={{
            width: 1,
            height: 20,
            background: "hsl(var(--border))",
            flexShrink: 0,
          }}
        />

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 500,
            color: "hsl(var(--terracota))",
            border: `1px solid hsl(var(--terracota) / 0.20)`,
            background: `hsl(var(--terracota) / 0.04)`,
            cursor: "pointer",
            transition: "all 0.15s ease",
            fontFamily: "inherit",
            opacity: signingOut ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `hsl(var(--terracota) / 0.08)`;
            (e.currentTarget as HTMLButtonElement).style.borderColor = `hsl(var(--terracota) / 0.35)`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = `hsl(var(--terracota) / 0.04)`;
            (e.currentTarget as HTMLButtonElement).style.borderColor = `hsl(var(--terracota) / 0.20)`;
          }}
        >
          <LogOut size={13} />
          <span>{signingOut ? "..." : "Salir"}</span>
        </button>
      </div>
    </header>
  );
}
