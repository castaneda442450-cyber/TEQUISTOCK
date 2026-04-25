"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="h-9 w-9 rounded-lg flex items-center justify-center" aria-label="Cambiar tema">
        <Sun size={18} className="opacity-0" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="h-9 w-9 rounded-lg flex items-center justify-center text-text-sub hover:text-text-main hover:bg-surface-hover transition-all duration-200"
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {theme === "dark" ? (
        <Sun size={18} className="transition-transform duration-300 rotate-0" />
      ) : (
        <Moon size={18} className="transition-transform duration-300 rotate-0" />
      )}
    </button>
  );
}
