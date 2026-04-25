"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  LogOut,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth.actions";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: LayoutDashboard },
  { href: "/productos",    label: "Productos",    icon: Package },
  { href: "/proveedores",  label: "Proveedores",  icon: Users },
  { href: "/compras",      label: "Compras",      icon: ShoppingCart },
  { href: "/salidas",      label: "Salidas",      icon: TrendingDown },
  { href: "/reportes",     label: "Reportes",     icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/auth/login");
  };

  return (
    <aside
      style={{ backgroundColor: "hsl(var(--nav-bg))" }}
      className={cn(
        "fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-white/10",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex-shrink-0">
          <Image
            src="/logo.png"
            alt="TequiStock"
            width={36}
            height={36}
            className="rounded-lg object-cover"
          />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-white font-black text-sm tracking-widest uppercase leading-tight">
              TEQUISTOCK
            </div>
            <div className="text-white/60 text-[10px] leading-tight mt-0.5 truncate">
              Control de Inventarios
            </div>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg transition-all duration-150 group relative",
                collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5",
                isActive
                  ? "bg-white/10 text-white font-semibold"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              )}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full"
                  style={{ backgroundColor: "hsl(var(--terracota))" }}
                />
              )}
              <Icon
                size={18}
                className={cn(
                  "flex-shrink-0",
                  isActive ? "text-white" : "text-white/70 group-hover:text-white"
                )}
              />
              {!collapsed && (
                <span className="text-sm truncate">{label}</span>
              )}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: sign out + collapse */}
      <div className="border-t border-white/10 p-2 space-y-1">
        <button
          onClick={handleSignOut}
          disabled={signingOut}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-all duration-150 group",
            collapsed ? "justify-center px-2 py-3" : "px-3 py-2.5"
          )}
        >
          <LogOut size={18} className="flex-shrink-0 rotate-180" />
          {!collapsed && <span className="text-sm">Cerrar sesión</span>}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Cerrar sesión
            </span>
          )}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "w-full flex items-center gap-3 rounded-lg text-white/50 hover:bg-white/5 hover:text-white transition-all duration-150",
            collapsed ? "justify-center px-2 py-2" : "px-3 py-2"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="text-xs">Colapsar</span>}
        </button>
      </div>
    </aside>
  );
}
