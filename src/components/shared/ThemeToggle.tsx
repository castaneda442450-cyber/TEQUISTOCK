"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { useThemeTransition } from "@/components/ui/theme-transition";

export function ThemeToggle() {
  const { theme } = useTheme();
  const { setTheme } = useThemeTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="h-9 w-9 rounded-lg flex items-center justify-center" aria-label="Cambiar tema">
        <Sun size={18} className="opacity-0" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={(e) => setTheme(isDark ? "light" : "dark", e)}
      className="h-9 w-9 rounded-lg flex items-center justify-center text-text-sub hover:text-text-main hover:bg-surface-hover transition-all duration-200"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </button>
  );
}
