"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div
        className="w-full max-w-md rounded-[12px] border p-8 text-center"
        style={{
          background: "hsl(var(--surface))",
          borderColor: "hsl(var(--border))",
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="h-14 w-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: "hsl(var(--terracota) / 0.1)" }}
        >
          <AlertCircle size={28} style={{ color: "hsl(var(--terracota))" }} />
        </div>

        <h2
          className="text-lg font-bold mb-2"
          style={{ color: "hsl(var(--text-main))" }}
        >
          Algo salió mal
        </h2>

        <p
          className="text-sm mb-6"
          style={{ color: "hsl(var(--text-sub))" }}
        >
          {error.message || "Ha ocurrido un error inesperado. Por favor intenta nuevamente."}
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full h-10 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: "hsl(var(--terracota))" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "hsl(var(--terracota-dark))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(var(--terracota))";
            }}
          >
            <RefreshCw size={15} />
            Reintentar
          </button>

          <Link
            href="/dashboard"
            className="w-full h-10 rounded-lg text-sm font-semibold flex items-center justify-center border transition-all hover:opacity-80"
            style={{
              color: "hsl(var(--text-sub))",
              borderColor: "hsl(var(--border))",
            }}
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
