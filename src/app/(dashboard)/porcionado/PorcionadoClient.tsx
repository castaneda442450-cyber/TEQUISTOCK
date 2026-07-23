"use client";

import { useRef, useState } from "react";
import { Scissors, Settings2 } from "lucide-react";
import ResumenSection from "./ResumenSection";
import RegistrarPorcionadoForm from "./RegistrarPorcionadoForm";
import ConfigurarProductosModal from "./ConfigurarProductosModal";
import type { Producto, ResumenPorcion } from "@/types";

interface Props {
  resumen: ResumenPorcion[];
  productos: Producto[];
}

export default function PorcionadoClient({ resumen, productos }: Props) {
  const [configOpen, setConfigOpen] = useState(false);
  const [preseleccion, setPreseleccion] = useState<{ id: string; nonce: number } | null>(
    null,
  );
  const formRef = useRef<HTMLDivElement>(null);

  const configurados = resumen.map((r) => r.porcion_config).filter(Boolean);

  function porcionarAhora(productId: string) {
    setPreseleccion({ id: productId, nonce: Date.now() });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      className="tablet-page-content"
      style={{ padding: "28px 32px", maxWidth: 1100, margin: "0 auto" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Scissors size={22} style={{ color: "hsl(var(--terracota))" }} />
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "hsl(var(--text-main))",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Porcionado
            </h1>
            <p style={{ fontSize: 13, color: "hsl(var(--text-sub))", margin: "2px 0 0" }}>
              {configurados.length} producto{configurados.length !== 1 ? "s" : ""}{" "}
              configurado{configurados.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <button
          onClick={() => setConfigOpen(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 18px",
            background: "hsl(var(--surface))",
            color: "hsl(var(--text-main))",
            border: "1.5px solid hsl(var(--border))",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Settings2 size={16} />
          Configurar productos
        </button>
      </div>

      <ResumenSection
        resumen={resumen}
        onPorcionar={porcionarAhora}
        onConfigurar={() => setConfigOpen(true)}
      />

      <div ref={formRef} style={{ marginTop: 28 }}>
        <RegistrarPorcionadoForm
          resumen={resumen}
          preseleccion={preseleccion}
        />
      </div>

      {configOpen && (
        <ConfigurarProductosModal
          productos={productos}
          resumen={resumen}
          onClose={() => setConfigOpen(false)}
        />
      )}
    </div>
  );
}
