"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { signOut } from "@/lib/actions/auth.actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TopBarProps {
  title: string;
  subtitle?: string;
  userEmail?: string;
}

export function TopBar({ title, subtitle, userEmail }: TopBarProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "US";

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
    router.push("/auth/login");
  };

  return (
    <header
      className="sticky top-0 z-40 h-16 border-b flex items-center px-6"
      style={{
        backgroundColor: "hsl(var(--surface) / 0.85)",
        borderColor: "hsl(var(--border))",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {/* Left: title & subtitle */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-bold text-[18px] leading-tight truncate"
          style={{ color: "hsl(var(--text-main))" }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-[12px] leading-tight truncate"
            style={{ color: "hsl(var(--text-sub))" }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: theme toggle + avatar */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover transition-colors group outline-none">
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: "hsl(var(--terracota))" }}
              >
                {initials}
              </div>
              {userEmail && (
                <span
                  className="text-xs max-w-[140px] truncate hidden sm:block"
                  style={{ color: "hsl(var(--text-sub))" }}
                >
                  {userEmail}
                </span>
              )}
              <ChevronDown
                size={14}
                className="flex-shrink-0 transition-transform"
                style={{ color: "hsl(var(--text-muted))" }}
              />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {userEmail && (
              <>
                <div className="px-3 py-2">
                  <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--text-main))" }}>
                    {userEmail}
                  </p>
                  <p className="text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>
                    Administrador
                  </p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm cursor-pointer gap-2"
            >
              <LogOut size={14} />
              {signingOut ? "Cerrando..." : "Cerrar sesión"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
