"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  ClipboardCheck,
  ArrowRightFromLine,
  BookOpen,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth.actions";
import { useTheme } from "next-themes";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badgeAlert?: boolean;
  badgeDiff?: boolean;
  badgeBeta?: boolean;
  tooltip?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "PRINCIPAL",
    items: [
      { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
      { href: "/productos",   label: "Productos",   icon: Package },
      { href: "/proveedores", label: "Proveedores", icon: Truck },
      { href: "/compras",     label: "Compras",     icon: ShoppingCart },
    ],
  },
  {
    label: "CONTROL DIARIO",
    items: [
      { href: "/turno", label: "Cierre de Turno", icon: ClipboardCheck, badgeAlert: true, badgeDiff: true },
    ],
  },
  {
    label: "GESTIÓN",
    items: [
      { href: "/salidas", label: "Salidas y Mermas", icon: ArrowRightFromLine },
      { href: "/fichas",  label: "Fichas Técnicas",  icon: BookOpen, badgeBeta: true },
    ],
  },
  {
    label: "REPORTES",
    items: [
      { href: "/reportes", label: "Reportes", icon: BarChart3, tooltip: "Incluye el nuevo reporte semanal de cierres" },
    ],
  },
];

function SidebarThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted ? theme === "dark" : false;

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={collapsed ? (isDark ? "Modo claro" : "Modo oscuro") : undefined}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        justifyContent: collapsed ? "center" : "flex-start",
        padding: collapsed ? "11px 12px" : "11px 16px",
        color: "rgba(255,255,255,0.88)",
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.16)",
        background: "rgba(255,255,255,0.07)",
        boxShadow: "0 2px 10px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.18s ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.28)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)";
      }}
    >
      {isDark
        ? <Sun size={16} style={{ flexShrink: 0 }} />
        : <Moon size={16} style={{ flexShrink: 0 }} />
      }
      {!collapsed && (
        <span style={{ fontSize: 13, fontWeight: 600 }}>
          {isDark ? "Modo Claro" : "Modo Oscuro"}
        </span>
      )}
    </button>
  );
}

interface SidebarProps {
  productosBajoMinimo: number;
  diferenciasPendientes: number;
}

export function Sidebar({ productosBajoMinimo, diferenciasPendientes }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      collapsed ? '72px' : '240px'
    );
  }, [collapsed]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  return (
    <aside
      style={{
        backgroundColor: "hsl(var(--nav-bg))",
        boxShadow: "4px 0 28px rgba(0, 0, 0, 0.55)",
        position: "fixed",
        left: 0,
        top: 0,
        height: "100vh",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        transition: "width 0.3s ease",
        width: collapsed ? 72 : 240,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: collapsed ? "20px 18px" : "20px 16px",
          justifyContent: collapsed ? "center" : "flex-start",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div style={{ flexShrink: 0 }}>
          <Image
            src="/logo.png"
            alt="TequiStock"
            width={36}
            height={36}
            priority
            style={{ borderRadius: 8, objectFit: "cover" }}
          />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "white", fontWeight: 900, fontSize: 13, letterSpacing: "0.12em", textTransform: "uppercase", lineHeight: 1.2 }}>
              TEQUISTOCK
            </div>
            <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2 }}>
              Inventarios
            </div>
          </div>
        )}
      </div>

      {/* Nav sections */}
      <nav style={{ flex: 1, padding: "8px 8px", display: "flex", flexDirection: "column", overflowY: "auto" }}>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div style={{
                fontSize: 10,
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                padding: "10px 14px 4px 14px",
                fontWeight: 500,
              }}>
                {section.label}
              </div>
            )}
            {collapsed && <div style={{ height: 8 }} />}

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {section.items.map(({ href, label, icon: Icon, badgeAlert, badgeDiff, badgeBeta, tooltip }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                const showBadgeAlert = !collapsed && badgeAlert && productosBajoMinimo > 0;
                const showBadgeDiff = !collapsed && badgeDiff && diferenciasPendientes > 0 && !showBadgeAlert;

                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: collapsed ? "11px 8px" : "10px 12px",
                      justifyContent: collapsed ? "center" : "flex-start",
                      borderRadius: 8,
                      backgroundColor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                      transition: "background-color 0.15s ease",
                      position: "relative",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                      if (tooltip) setHoveredHref(href);
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                      if (tooltip) setHoveredHref(null);
                    }}
                  >
                    <Icon
                      size={18}
                      style={{ flexShrink: 0, color: isActive ? "white" : "rgba(255,255,255,0.65)" }}
                    />
                    {!collapsed && (
                      <span style={{ fontSize: 14, fontWeight: isActive ? 500 : 400, color: isActive ? "white" : "rgba(255,255,255,0.65)" }}>
                        {label}
                      </span>
                    )}

                    {/* Badge "!" — productos bajo mínimo */}
                    {showBadgeAlert && (
                      <span style={{
                        width: 18, height: 18, borderRadius: "50%",
                        background: "#BA3026", color: "white",
                        fontSize: 10, fontWeight: 700,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginLeft: "auto", flexShrink: 0,
                      }}>!</span>
                    )}

                    {/* Badge numérico — diferencias pendientes */}
                    {showBadgeDiff && (
                      <span style={{
                        minWidth: 18, height: 18, borderRadius: 9,
                        background: "rgba(255,255,255,0.20)", color: "white",
                        fontSize: 10, fontWeight: 700, padding: "0 5px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginLeft: "auto", flexShrink: 0,
                      }}>{diferenciasPendientes}</span>
                    )}

                    {/* Badge "Beta" */}
                    {!collapsed && badgeBeta && (
                      <span style={{
                        fontSize: 9, background: "rgba(255,255,255,0.12)",
                        color: "rgba(255,255,255,0.5)", padding: "1px 6px",
                        borderRadius: 4, marginLeft: "auto", flexShrink: 0,
                      }}>Beta</span>
                    )}

                    {/* Tooltip para items con texto descriptivo */}
                    {tooltip && hoveredHref === href && !collapsed && (
                      <div style={{
                        position: "absolute", left: "100%", top: "50%",
                        transform: "translateY(-50%)", marginLeft: 8,
                        background: "#1a1a2e", color: "white", fontSize: 11,
                        borderRadius: 6, padding: "5px 10px", whiteSpace: "nowrap",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)", zIndex: 100,
                        pointerEvents: "none",
                      }}>{tooltip}</div>
                    )}

                    {/* Tooltip de label cuando colapsado */}
                    {collapsed && (
                      <span style={{
                        position: "absolute",
                        left: "100%",
                        marginLeft: 8,
                        padding: "4px 8px",
                        background: "#1a1a2e",
                        color: "white",
                        fontSize: 12,
                        borderRadius: 6,
                        opacity: 0,
                        pointerEvents: "none",
                        whiteSpace: "nowrap",
                        zIndex: 100,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                      }}>
                        {label}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div style={{ padding: "12px 12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        <SidebarThemeToggle collapsed={collapsed} />

        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? "Cerrar sesión" : undefined}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "11px 12px" : "11px 16px",
            color: "rgba(255,255,255,0.88)",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.16)",
            background: "rgba(255,255,255,0.07)",
            boxShadow: "0 2px 10px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.18s ease",
            opacity: signingOut ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.14)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.28)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 14px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.10)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.16)";
            (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.08)";
          }}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {signingOut ? "Saliendo..." : "Cerrar sesión"}
            </span>
          )}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "7px 12px" : "7px 16px",
            color: "rgba(255,255,255,0.40)",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.65)";
            (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.40)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!collapsed && <span style={{ fontSize: 12 }}>Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
