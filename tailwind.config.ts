import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"
import forms from "@tailwindcss/forms"
import typography from "@tailwindcss/typography"
import animate from "tailwindcss-animate"

const config = {
  darkMode: ["class", ".dark"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        terracota: "hsl(var(--terracota))",
        "terracota-dark": "hsl(var(--terracota-dark))",
        gold: "hsl(var(--gold))",
        navy: "hsl(var(--navy))",
        green: "hsl(var(--green))",
        "dark-green": "hsl(var(--dark-green))",
        bg: "hsl(var(--bg))",
        surface: "hsl(var(--surface))",
        "surface-alt": "hsl(var(--surface-alt))",
        "surface-hover": "hsl(var(--surface-hover))",
        border: "hsl(var(--border))",
        "border-strong": "hsl(var(--border-strong))",
        "text-main": "hsl(var(--text-main))",
        "text-sub": "hsl(var(--text-sub))",
        "text-muted": "hsl(var(--text-muted))",
        "nav-bg": "hsl(var(--nav-bg))",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", ...defaultTheme.fontFamily.sans],
      },
      borderRadius: {
        card: "10px",
        modal: "12px",
        button: "8px",
        pill: "99px",
      },
      boxShadow: {
        card: "0 1px 2px var(--shadow-color), 0 4px 14px var(--shadow-color)",
        hover: "0 2px 4px var(--shadow-color), 0 8px 24px var(--shadow-color-md)",
        "hover-lg": "0 8px 28px var(--shadow-color-md)",
        modal: "0 32px 80px var(--shadow-color-lg)",
      },
      animation: {
        spin: "spin 0.7s linear infinite",
        "modal-in": "modalIn 0.18s ease-out",
        "toast-in": "toastIn 0.2s ease-out",
      },
      keyframes: {
        modalIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        toastIn: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      fontSize: {
        xs: ["11px", { letterSpacing: "0.4px", fontWeight: "600" }],
        sm: ["13px", { lineHeight: "1.5" }],
        base: ["14px", { lineHeight: "1.6", fontWeight: "600" }],
      },
    },
  },
  plugins: [forms, typography, animate],
} satisfies Config

export default config
