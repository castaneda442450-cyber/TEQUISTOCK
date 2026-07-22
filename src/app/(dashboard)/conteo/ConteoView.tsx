"use client";

import { useState, useMemo, useEffect, useTransition } from "react";
import { useIsTablet } from "@/hooks/useIsTablet";
import { sileo } from "sileo";
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clock3,
  CalendarDays,
  CalendarRange,
  Check,
  Info,
} from "lucide-react";
import {
  getProductosDeZona,
  getZonasPendientes,
  procesarConteoMultiZona,
} from "@/lib/actions/zonas.actions";
import { getZonaIcon } from "./zonaIcons";
import type { Zona, ConteoZonaItem, ConteoResumen } from "@/types";

interface Props {
  zonas: Zona[];
  onVolverALista: () => void;
}

type Frecuencia = "diario" | "semanal" | "mensual";
type Fase = "seleccion" | "conteo" | "resumen";

const FRECUENCIA_OPTS: { value: Frecuencia; label: string; desc: string; icon: typeof Clock3 }[] = [
  { value: "diario", label: "Diario", desc: "Productos de rotación diaria", icon: Clock3 },
  { value: "semanal", label: "Semanal", desc: "Productos de rotación semanal", icon: CalendarDays },
  { value: "mensual", label: "Mensual", desc: "Productos de rotación mensual", icon: CalendarRange },
];

type SemaforoColor = "sin-dato" | "verde" | "amarillo" | "rojo";

const SEMAFORO: Record<SemaforoColor, { bg: string; text: string }> = {
  "sin-dato": { bg: "transparent", text: "#B0A89E" },
  verde: { bg: "#EAF3DE", text: "#27500A" },
  amarillo: { bg: "#FAEEDA", text: "#633806" },
  rojo: { bg: "#FCEBEB", text: "#791F1F" },
};

function semaforoDeDiff(fisicaNum: number | null, stockActual: number): SemaforoColor {
  if (fisicaNum === null) return "sin-dato";
  const diff = fisicaNum - stockActual;
  if (diff >= 0) return "verde";
  const pct = stockActual > 0 ? Math.abs(diff) / stockActual : 1;
  if (pct <= 0.05) return "verde";
  if (pct <= 0.15) return "amarillo";
  return "rojo";
}

function fmtQty(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// ─── Sesión multi-zona (local a este archivo) ────────────────────────────────

interface ZonaPendiente {
  id: string;
  nombre: string;
  color: string;
  icono: string;
}

interface ProductoEnSesion {
  product_id: string;
  nombre: string;
  unidad: string;
  stock_original: number; // se captura UNA sola vez, la primera vez que aparece
  conteosPorZona: Record<string, number>; // zonaId -> cantidad_contada
}

interface ZonaVisitada {
  zonaId: string;
  zonaNombre: string;
  productIds: string[];
}

interface SesionMultiZona {
  frecuencia: Frecuencia;
  productos: Record<string, ProductoEnSesion>;
  zonasVisitadas: ZonaVisitada[];
}

type Nota =
  | { tipo: "tambien_en"; zonas: string[] }
  | { tipo: "ya_contado"; entradas: { zonaNombre: string; qty: number }[] };

function notaProductoTexto(nota: Nota | null): string | null {
  if (!nota) return null;
  if (nota.tipo === "tambien_en") return `· también en ${nota.zonas.join(" y ")}`;
  return `contaste ${nota.entradas.map((e) => `${fmtQty(e.qty)} en ${e.zonaNombre}`).join(", ")}`;
}

function mergeItemsEnSesion(sesion: SesionMultiZona, items: ConteoZonaItem[]): SesionMultiZona {
  const productos = { ...sesion.productos };
  for (const item of items) {
    if (!productos[item.product_id]) {
      productos[item.product_id] = {
        product_id: item.product_id,
        nombre: item.nombre,
        unidad: item.unidad,
        stock_original: item.stock_actual,
        conteosPorZona: {},
      };
    }
  }
  return { ...sesion, productos };
}

export default function ConteoView({ zonas, onVolverALista }: Props) {
  const isTablet = useIsTablet();
  const zonasActivas = useMemo(() => zonas.filter((z) => z.activo), [zonas]);

  // Paso 1
  const [fase, setFase] = useState<Fase>("seleccion");
  const [zonaId, setZonaId] = useState<string | null>(zonasActivas[0]?.id ?? null);
  const [frecuencia, setFrecuencia] = useState<Frecuencia>("diario");
  const [warningSinProductos, setWarningSinProductos] = useState(false);

  // Zona actualmente en pantalla de conteo
  const [zonaActualId, setZonaActualId] = useState<string | null>(null);
  const [itemsZonaActual, setItemsZonaActual] = useState<ConteoZonaItem[]>([]);
  const [inputsZonaActual, setInputsZonaActual] = useState<Record<string, string>>({});

  // Sesión acumulada multi-zona
  const [sesion, setSesion] = useState<SesionMultiZona | null>(null);
  const [siguientesZonas, setSiguientesZonas] = useState<ZonaPendiente[] | null>(null);

  const [resumenFinal, setResumenFinal] = useState<ConteoResumen | null>(null);
  const [isPendingCargando, startCargandoTransition] = useTransition();
  const [isPendingAplicar, startAplicarTransition] = useTransition();

  const zonaSeleccionada = zonasActivas.find((z) => z.id === zonaId) ?? null;
  const productosZona = zonaSeleccionada?.productos ?? [];

  const countsPorFrecuencia = useMemo(() => {
    const counts: Record<Frecuencia, number> = { diario: 0, semanal: 0, mensual: 0 };
    productosZona.forEach((p) => {
      counts[p.frecuencia_conteo] = (counts[p.frecuencia_conteo] ?? 0) + 1;
    });
    return counts;
  }, [productosZona]);

  const zonaActual = zonasActivas.find((z) => z.id === zonaActualId) ?? null;

  const computedItemsZonaActual = useMemo(() => {
    return itemsZonaActual.map((item) => {
      const raw = inputsZonaActual[item.product_id] ?? "";
      const fisicaNum = raw === "" ? null : parseFloat(raw);
      const diff = fisicaNum === null ? null : fisicaNum - item.stock_actual;
      const semaforoColor = semaforoDeDiff(fisicaNum, item.stock_actual);

      let nota: Nota | null = null;
      if (sesion) {
        if (sesion.zonasVisitadas.length === 0) {
          const otras = zonasActivas
            .filter((z) => z.id !== zonaActualId)
            .filter((z) =>
              z.productos?.some((p) => p.id === item.product_id && p.frecuencia_conteo === frecuencia),
            )
            .map((z) => z.nombre);
          if (otras.length > 0) nota = { tipo: "tambien_en", zonas: otras };
        } else {
          const prod = sesion.productos[item.product_id];
          if (prod && Object.keys(prod.conteosPorZona).length > 0) {
            const entradas = Object.entries(prod.conteosPorZona)
              .map(([zid, qty]) => {
                const zv = sesion.zonasVisitadas.find((z) => z.zonaId === zid);
                return zv ? { zonaNombre: zv.zonaNombre, qty } : null;
              })
              .filter((e): e is { zonaNombre: string; qty: number } => e !== null);
            if (entradas.length > 0) nota = { tipo: "ya_contado", entradas };
          }
        }
      }

      return { item, raw, fisicaNum, diff, semaforoColor, nota };
    });
  }, [itemsZonaActual, inputsZonaActual, sesion, zonasActivas, zonaActualId, frecuencia]);

  const todosLlenos =
    itemsZonaActual.length > 0 && computedItemsZonaActual.every((r) => r.fisicaNum !== null);
  const totalItems = itemsZonaActual.length;
  const llenos = computedItemsZonaActual.filter((r) => r.fisicaNum !== null).length;

  // Precarga de zonas pendientes en cuanto la zona actual queda completa.
  useEffect(() => {
    if (!sesion || !zonaActualId || !todosLlenos) {
      setSiguientesZonas(null);
      return;
    }
    let cancelado = false;
    setSiguientesZonas(null);
    getZonasPendientes(itemsZonaActual.map((i) => i.product_id), frecuencia, [
      ...sesion.zonasVisitadas.map((z) => z.zonaId),
      zonaActualId,
    ]).then((res) => {
      if (!cancelado) setSiguientesZonas(res.error ? [] : (res.data ?? []));
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todosLlenos, zonaActualId, frecuencia]);

  const mostrarBreadcrumb =
    !!sesion && (sesion.zonasVisitadas.length >= 2 || (fase === "conteo" && sesion.zonasVisitadas.length === 1));

  const resumenFinalPreview = useMemo(() => {
    if (!sesion) return null;
    const rows = Object.values(sesion.productos)
      .map((p) => {
        const total = Object.values(p.conteosPorZona).reduce((s, q) => s + q, 0);
        const diff = total - p.stock_original;
        const breakdown = Object.entries(p.conteosPorZona).map(([zid, qty]) => {
          const zv = sesion.zonasVisitadas.find((z) => z.zonaId === zid);
          return { zonaNombre: zv?.zonaNombre ?? "", qty };
        });
        return { ...p, total, diff, breakdown };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    let entradas = 0;
    let salidas = 0;
    let sin_cambio = 0;
    rows.forEach((r) => {
      if (r.diff > 0) entradas++;
      else if (r.diff < 0) salidas++;
      else sin_cambio++;
    });
    return { rows, entradas, salidas, sin_cambio, ajustados: entradas + salidas };
  }, [sesion]);

  function resetTodo() {
    setFase("seleccion");
    setSesion(null);
    setZonaActualId(null);
    setItemsZonaActual([]);
    setInputsZonaActual({});
    setSiguientesZonas(null);
    setResumenFinal(null);
    setWarningSinProductos(false);
  }

  function handleIniciarConteo() {
    if (!zonaSeleccionada) return;
    if (countsPorFrecuencia[frecuencia] === 0) {
      setWarningSinProductos(true);
      return;
    }
    setWarningSinProductos(false);
    startCargandoTransition(async () => {
      const res = await getProductosDeZona(zonaSeleccionada.id, frecuencia);
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      if (res.data.length === 0) {
        setWarningSinProductos(true);
        return;
      }
      const nuevaSesion = mergeItemsEnSesion(
        { frecuencia, productos: {}, zonasVisitadas: [] },
        res.data,
      );
      setSesion(nuevaSesion);
      setZonaActualId(zonaSeleccionada.id);
      setItemsZonaActual(res.data);
      setInputsZonaActual({});
      setFase("conteo");
    });
  }

  function handleSiguienteOResumen() {
    if (!todosLlenos || siguientesZonas === null || !sesion || !zonaActualId || !zonaActual) return;

    const productosActualizados = { ...sesion.productos };
    computedItemsZonaActual.forEach((r) => {
      const prod = productosActualizados[r.item.product_id];
      if (prod) {
        productosActualizados[r.item.product_id] = {
          ...prod,
          conteosPorZona: { ...prod.conteosPorZona, [zonaActualId]: r.fisicaNum! },
        };
      }
    });

    const zonasVisitadasActualizadas: ZonaVisitada[] = [
      ...sesion.zonasVisitadas.filter((z) => z.zonaId !== zonaActualId),
      {
        zonaId: zonaActualId,
        zonaNombre: zonaActual.nombre,
        productIds: itemsZonaActual.map((i) => i.product_id),
      },
    ];

    const sesionActualizada: SesionMultiZona = {
      ...sesion,
      productos: productosActualizados,
      zonasVisitadas: zonasVisitadasActualizadas,
    };
    setSesion(sesionActualizada);

    if (siguientesZonas.length === 0) {
      setFase("resumen");
      return;
    }

    const siguiente = siguientesZonas[0];
    const productIdsActuales = itemsZonaActual.map((i) => i.product_id);

    startCargandoTransition(async () => {
      const res = await getProductosDeZona(siguiente.id, frecuencia);
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      if (res.data.length > 0) {
        setSesion((prev) => (prev ? mergeItemsEnSesion(prev, res.data) : prev));
        setZonaActualId(siguiente.id);
        setItemsZonaActual(res.data);
        setInputsZonaActual({});
        return;
      }

      // Membresía desactualizada: la zona predicha ya no tiene productos.
      // Reintentar una vez excluyéndola también.
      const retry = await getZonasPendientes(productIdsActuales, frecuencia, [
        ...zonasVisitadasActualizadas.map((z) => z.zonaId),
        siguiente.id,
      ]);
      const siguiente2 = !retry.error && retry.data && retry.data.length > 0 ? retry.data[0] : null;
      if (siguiente2) {
        const res2 = await getProductosDeZona(siguiente2.id, frecuencia);
        if (!res2.error && res2.data.length > 0) {
          setSesion((prev) => (prev ? mergeItemsEnSesion(prev, res2.data) : prev));
          setZonaActualId(siguiente2.id);
          setItemsZonaActual(res2.data);
          setInputsZonaActual({});
          return;
        }
      }
      setFase("resumen");
    });
  }

  function handleAplicarAjustes() {
    if (!sesion) return;
    const totales = Object.values(sesion.productos).map((p) => ({
      product_id: p.product_id,
      total_fisico: Object.values(p.conteosPorZona).reduce((s, q) => s + q, 0),
    }));
    if (totales.length === 0) return;

    startAplicarTransition(async () => {
      const res = await procesarConteoMultiZona({ frecuencia: sesion.frecuencia, totales });
      if (res.error) {
        sileo.error({ title: res.error });
        return;
      }
      setResumenFinal(res.resumen!);
    });
  }

  const btnPrincipalDisabled = isPendingCargando || !todosLlenos || siguientesZonas === null;
  const btnPrincipalLabel = !todosLlenos
    ? "Siguiente →"
    : siguientesZonas === null
      ? "Calculando..."
      : siguientesZonas.length > 0
        ? "Siguiente →"
        : "Ver resumen →";

  const bannerCompartidos = computedItemsZonaActual.filter(
    (r) => r.nota?.tipo === "ya_contado",
  );

  // ───────── RENDER ─────────
  return (
    <div>
      {/* Barra de pasos */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StepPill num={1} label="Zona y temporalidad" active={fase === "seleccion"} done={fase !== "seleccion"} />
          <div style={{ flex: 1, maxWidth: 60, height: 2, background: "hsl(var(--border))" }} />
          <StepPill num={2} label="Contar y confirmar" active={fase === "conteo" || fase === "resumen"} done={false} />
        </div>
        <button
          onClick={onVolverALista}
          disabled={isPendingAplicar}
          style={{
            background: "none",
            border: "none",
            color: "hsl(var(--text-sub))",
            fontSize: 13,
            fontWeight: 600,
            cursor: isPendingAplicar ? "not-allowed" : "pointer",
            fontFamily: "inherit",
          }}
        >
          ← Volver a zonas
        </button>
      </div>

      {mostrarBreadcrumb && sesion && (
        <ZonaBreadcrumb
          completadas={sesion.zonasVisitadas}
          zonaActualId={zonaActualId}
          siguiente={fase === "conteo" && siguientesZonas && siguientesZonas.length > 0 ? siguientesZonas[0] : null}
        />
      )}

      {fase === "seleccion" && (
        <div>
          {zonasActivas.length === 0 ? (
            <div
              style={{
                padding: "40px 24px",
                textAlign: "center",
                background: "hsl(var(--surface))",
                border: "1px dashed hsl(var(--border-strong))",
                borderRadius: 10,
                color: "hsl(var(--text-sub))",
                fontSize: 14,
              }}
            >
              No hay zonas activas. Crea una zona primero.
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <label style={sectionLabelStyle}>Elige una zona</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 10,
                  }}
                >
                  {zonasActivas.map((z) => {
                    const Icon = getZonaIcon(z.icono);
                    const selected = z.id === zonaId;
                    return (
                      <div
                        key={z.id}
                        onClick={() => setZonaId(z.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: `1.5px solid ${selected ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
                          background: selected ? "hsl(var(--terracota) / 0.06)" : "hsl(var(--surface))",
                          cursor: "pointer",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 8,
                            background: `${z.color}22`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={16} style={{ color: z.color }} />
                        </div>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "hsl(var(--text-main))",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {z.nombre}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={sectionLabelStyle}>Temporalidad</label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isTablet ? "1fr" : "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  {FRECUENCIA_OPTS.map((opt) => {
                    const selected = frecuencia === opt.value;
                    const count = countsPorFrecuencia[opt.value];
                    const Icon = opt.icon;
                    return (
                      <div
                        key={opt.value}
                        onClick={() => setFrecuencia(opt.value)}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          border: `1.5px solid ${selected ? "hsl(var(--terracota))" : "hsl(var(--border))"}`,
                          background: selected ? "hsl(var(--terracota) / 0.06)" : "hsl(var(--surface))",
                          cursor: "pointer",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <Icon size={16} style={{ color: selected ? "hsl(var(--terracota))" : "hsl(var(--text-sub))" }} />
                          <span style={{ fontSize: 14, fontWeight: 700, color: "hsl(var(--text-main))" }}>
                            {opt.label}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 8px", fontSize: 12, color: "hsl(var(--text-sub))" }}>{opt.desc}</p>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
                          {count} producto{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {zonaSeleccionada && (
                <p style={{ fontSize: 14, color: "hsl(var(--text-sub))", marginBottom: 16 }}>
                  Vas a contar <strong style={{ color: "hsl(var(--text-main))" }}>{countsPorFrecuencia[frecuencia]}</strong> productos{" "}
                  {frecuencia === "diario" ? "diarios" : frecuencia === "semanal" ? "semanales" : "mensuales"} en{" "}
                  <strong style={{ color: "hsl(var(--text-main))" }}>{zonaSeleccionada.nombre}</strong>
                </p>
              )}

              {warningSinProductos && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 14px",
                    background: "#FAEEDA",
                    border: "1px solid #E8C98A",
                    borderRadius: 8,
                    marginBottom: 16,
                    fontSize: 13,
                    color: "#633806",
                  }}
                >
                  <AlertTriangle size={15} />
                  No hay productos {frecuencia === "diario" ? "diarios" : frecuencia === "semanal" ? "semanales" : "mensuales"} asignados a esta zona
                </div>
              )}

              <button
                disabled={!zonaSeleccionada || isPendingCargando}
                onClick={handleIniciarConteo}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: !zonaSeleccionada ? "hsl(var(--border))" : "hsl(var(--terracota))",
                  color: !zonaSeleccionada ? "hsl(var(--text-muted))" : "white",
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  cursor: !zonaSeleccionada ? "not-allowed" : "pointer",
                }}
              >
                {isPendingCargando && <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />}
                Iniciar conteo →
              </button>
            </>
          )}
        </div>
      )}

      {fase === "conteo" && sesion && zonaActual && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 14px",
              background: "hsl(var(--surface-alt))",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 13,
              color: "hsl(var(--text-sub))",
            }}
          >
            <strong style={{ color: "hsl(var(--text-main))" }}>{zonaActual.nombre}</strong>
            <span>·</span>
            <span>
              {frecuencia === "diario" ? "Diario" : frecuencia === "semanal" ? "Semanal" : "Mensual"}
            </span>
          </div>

          {bannerCompartidos.length > 0 && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 16px",
                background: "#E6F1FB",
                border: "1px solid #B8D4EF",
                borderLeft: "4px solid #185FA5",
                borderRadius: 10,
                marginBottom: 16,
              }}
            >
              <Info size={16} style={{ color: "#185FA5", flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: "#1A3A5C", lineHeight: 1.6 }}>
                <strong>Estos productos también están aquí — cuéntalos para ajustar el stock correctamente:</strong>
                {bannerCompartidos.map((r) => (
                  <div key={r.item.product_id}>· {r.item.nombre} ({notaProductoTexto(r.nota)})</div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: llenos === totalItems ? "#106653" : "#BA3026",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {llenos} / {totalItems} productos llenados
            </span>
          </div>

          <div
            style={{
              background: "hsl(var(--surface))",
              borderRadius: 10,
              border: "1.5px solid hsl(var(--border))",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
                <thead>
                  <tr style={{ backgroundColor: "hsl(var(--surface-alt))", borderBottom: "1.5px solid hsl(var(--border))" }}>
                    {["Producto", "Sistema", "Físico ahora", "Diferencia"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "10px 14px",
                          textAlign: col === "Producto" ? "left" : "center",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.4px",
                          color: "hsl(var(--text-sub))",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {computedItemsZonaActual.map((r, i) => {
                    const sem = SEMAFORO[r.semaforoColor];
                    const notaTexto = notaProductoTexto(r.nota);
                    return (
                      <tr
                        key={r.item.product_id}
                        style={{
                          backgroundColor: i % 2 === 0 ? "hsl(var(--surface))" : "hsl(var(--surface-alt))",
                          borderBottom: "1px solid hsl(var(--border))",
                        }}
                      >
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: "hsl(var(--text-main))" }}>{r.item.nombre}</span>
                          <span style={{ display: "block", fontSize: 11, color: "hsl(var(--text-muted))", marginTop: 1 }}>
                            {r.item.unidad}
                          </span>
                          {notaTexto && (
                            <span style={{ display: "block", fontSize: 11, color: "hsl(var(--text-sub))", marginTop: 2, fontStyle: "italic" }}>
                              {notaTexto}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "hsl(var(--text-main))" }}>
                            {r.item.stock_actual}
                          </span>
                        </td>
                        <td style={{ padding: "8px 14px", textAlign: "center", minWidth: 130 }}>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0 si no hay"
                            disabled={isPendingAplicar}
                            value={r.raw}
                            onChange={(e) =>
                              setInputsZonaActual((prev) => ({ ...prev, [r.item.product_id]: e.target.value }))
                            }
                            style={{
                              width: "100%",
                              padding: "6px 10px",
                              borderRadius: 8,
                              borderWidth: "1.5px",
                              borderStyle: "solid",
                              borderColor: r.fisicaNum === null ? "hsl(var(--border))" : "hsl(var(--border))",
                              backgroundColor: isPendingAplicar ? "hsl(var(--surface-alt))" : "hsl(var(--surface))",
                              color: "hsl(var(--text-main))",
                              fontSize: 14,
                              fontFamily: "inherit",
                              outline: "none",
                              opacity: isPendingAplicar ? 0.6 : 1,
                            }}
                          />
                        </td>
                        <td style={{ padding: "8px 14px", textAlign: "center" }}>
                          {r.fisicaNum === null ? (
                            <span style={{ color: sem.text, fontSize: 13 }}>—</span>
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: sem.bg,
                                color: sem.text,
                                borderRadius: 6,
                                padding: "3px 10px",
                                fontSize: 13,
                                fontWeight: 700,
                                fontVariantNumeric: "tabular-nums",
                              }}
                            >
                              {r.diff! >= 0 ? "+" : "−"}
                              {fmtQty(Math.abs(r.diff!))} {r.item.unidad}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            {sesion.zonasVisitadas.length === 0 ? (
              <button
                onClick={resetTodo}
                disabled={isPendingAplicar}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  border: "1.5px solid hsl(var(--border))",
                  background: "hsl(var(--surface))",
                  color: "hsl(var(--text-main))",
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  cursor: isPendingAplicar ? "not-allowed" : "pointer",
                }}
              >
                ← Cambiar zona
              </button>
            ) : (
              <span />
            )}
            <button
              onClick={handleSiguienteOResumen}
              disabled={btnPrincipalDisabled}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: btnPrincipalDisabled ? "hsl(var(--border))" : "hsl(var(--terracota))",
                color: btnPrincipalDisabled ? "hsl(var(--text-muted))" : "white",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: btnPrincipalDisabled ? "not-allowed" : "pointer",
              }}
            >
              {(isPendingCargando || siguientesZonas === null) && todosLlenos && (
                <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />
              )}
              {btnPrincipalLabel}
            </button>
          </div>
        </div>
      )}

      {fase === "resumen" && sesion && resumenFinalPreview && (
        <div>
          <h3 style={{ margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: "hsl(var(--text-main))" }}>
            Resumen del conteo
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 12, color: "hsl(var(--text-muted))" }}>
            Stock calculado al momento de iniciar el conteo
          </p>

          <div
            style={{
              background: "hsl(var(--surface))",
              borderRadius: 10,
              border: "1.5px solid hsl(var(--border))",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              padding: "16px 20px",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {resumenFinalPreview.rows.map((r) => {
                const badge =
                  r.diff > 0
                    ? { label: "Entrada", bg: "hsl(var(--green) / 0.15)", color: "hsl(var(--green))" }
                    : r.diff < 0
                      ? { label: "Salida", bg: "hsl(var(--terracota) / 0.15)", color: "hsl(var(--terracota))" }
                      : { label: "Sin cambio", bg: "hsl(var(--text-muted) / 0.15)", color: "hsl(var(--text-sub))" };
                const diffTexto =
                  r.diff === 0
                    ? "sin cambio"
                    : `${r.diff > 0 ? "+" : "−"}${fmtQty(Math.abs(r.diff))} ${r.diff > 0 ? "entrada" : "salida"}`;
                const detalle =
                  r.breakdown.length > 1
                    ? `${r.breakdown.map((b) => `${b.zonaNombre}: ${fmtQty(b.qty)}`).join(" + ")} = Total: ${fmtQty(r.total)} (sistema: ${fmtQty(r.stock_original)})`
                    : `${fmtQty(r.total)} ${r.unidad} (sistema: ${fmtQty(r.stock_original)})`;
                return (
                  <div
                    key={r.product_id}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "4px 0", fontSize: 13, flexWrap: "wrap" }}
                  >
                    <span style={{ color: "hsl(var(--text-main))" }}>
                      <strong>{r.nombre}</strong> — {detalle} → {diffTexto}
                    </span>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: badge.bg,
                        color: badge.color,
                        flexShrink: 0,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid hsl(var(--border))", fontSize: 13, color: "hsl(var(--text-sub))", fontWeight: 600 }}>
              {resumenFinalPreview.ajustados} productos ajustados · {resumenFinalPreview.entradas} entradas · {resumenFinalPreview.salidas} salidas · {resumenFinalPreview.sin_cambio} sin cambio
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={() => setFase("conteo")}
              disabled={isPendingAplicar}
              style={{
                padding: "9px 18px",
                borderRadius: 8,
                border: "1.5px solid hsl(var(--border))",
                background: "hsl(var(--surface))",
                color: "hsl(var(--text-main))",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: isPendingAplicar ? "not-allowed" : "pointer",
              }}
            >
              ← Revisar conteo
            </button>
            <button
              onClick={handleAplicarAjustes}
              disabled={isPendingAplicar}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 22px",
                borderRadius: 8,
                border: "none",
                background: isPendingAplicar ? "hsl(var(--border))" : "#106653",
                color: isPendingAplicar ? "hsl(var(--text-muted))" : "white",
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: isPendingAplicar ? "not-allowed" : "pointer",
              }}
            >
              {isPendingAplicar && <Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} />}
              {isPendingAplicar ? "Aplicando..." : "✓ Aplicar ajustes"}
            </button>
          </div>
        </div>
      )}

      {/* ══ ÉXITO ══ */}
      {resumenFinal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 50,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              backgroundColor: "hsl(var(--surface))",
              borderRadius: 12,
              boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
              maxWidth: isTablet ? "calc(100% - 24px)" : 440,
              width: "100%",
              animation: "modalIn 0.18s ease-out",
              padding: "32px 28px 24px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "#EAF3DE",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <CheckCircle size={30} color="#106653" />
            </div>
            <h2 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 800, color: "hsl(var(--text-main))" }}>
              ¡Conteo aplicado!
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "hsl(var(--text-sub))" }}>
              Los ajustes se registraron en el inventario
            </p>

            <div style={{ backgroundColor: "hsl(var(--surface-alt))", borderRadius: 10, padding: "14px 16px", textAlign: "left", marginBottom: 20 }}>
              <ResumenRow label="Ajustes aplicados" value={resumenFinal.ajustados} />
              <ResumenRow label="Entradas" value={resumenFinal.entradas} />
              <ResumenRow label="Salidas" value={resumenFinal.salidas} />
              <ResumenRow label="Sin cambio" value={resumenFinal.sin_cambio} last />
            </div>

            <button
              onClick={resetTodo}
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 8,
                border: "none",
                backgroundColor: "hsl(var(--terracota))",
                color: "white",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              Hacer otro conteo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ZonaBreadcrumb({
  completadas,
  zonaActualId,
  siguiente,
}: {
  completadas: ZonaVisitada[];
  zonaActualId: string | null;
  siguiente: ZonaPendiente | null;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
      {completadas.map((z, i) => {
        const esActual = z.zonaId === zonaActualId;
        return (
          <div key={z.zonaId} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {i > 0 && <span style={{ color: "hsl(var(--text-muted))", fontSize: 12 }}>→</span>}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 99,
                fontSize: 12,
                fontWeight: 700,
                background: esActual ? "hsl(var(--terracota) / 0.10)" : "hsl(var(--green) / 0.12)",
                color: esActual ? "hsl(var(--terracota))" : "hsl(var(--green))",
                border: esActual ? "1.5px solid hsl(var(--terracota))" : "none",
              }}
            >
              {!esActual && <Check size={11} />}
              {z.zonaNombre}
              {esActual && " ← estás aquí"}
            </span>
          </div>
        );
      })}
      {siguiente && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "hsl(var(--text-muted))", fontSize: 12 }}>→</span>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              background: "hsl(var(--surface-alt))",
              color: "hsl(var(--text-muted))",
            }}
          >
            {siguiente.nombre}
          </span>
        </div>
      )}
    </div>
  );
}

function ResumenRow({ label, value, last }: { label: string; value: number; last?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "5px 0",
        borderBottom: last ? "none" : "1px solid hsl(var(--border))",
      }}
    >
      <span style={{ fontSize: 13, color: "hsl(var(--text-sub))" }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: "hsl(var(--text-main))", fontVariantNumeric: "tabular-nums" }}>
        {value}
      </span>
    </div>
  );
}

function StepPill({ num, label, active, done }: { num: number; label: string; active: boolean; done: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
          fontWeight: 700,
          flexShrink: 0,
          background: done ? "#106653" : active ? "hsl(var(--terracota))" : "hsl(var(--surface-alt))",
          color: done || active ? "white" : "hsl(var(--text-muted))",
          border: done || active ? "none" : "1.5px solid hsl(var(--border))",
        }}
      >
        {done ? <Check size={13} /> : num}
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: active ? 700 : 500,
          color: active ? "hsl(var(--text-main))" : "hsl(var(--text-sub))",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}

const sectionLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: "0.4px",
  textTransform: "uppercase",
  color: "hsl(var(--text-sub))",
  marginBottom: 8,
};
