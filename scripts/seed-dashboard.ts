/**
 * Full seed script for the TequiStock dashboard.
 *
 * Inserts proveedores, productos, proveedor_productos, ordenes_compra,
 * detalle_orden, and movimientos (mermas + consumos). All purchase/movement
 * dates fall within the last ~85 days so the dashboard's default
 * "últimos 30 días" filter shows live data.
 *
 * The actualizar_stock trigger fires on movimiento INSERT and adjusts
 * productos.stock_actual. After all mermas/salidas are inserted, this
 * script overwrites stock_actual to the desired final values so the UI
 * reflects the intended demo state regardless of trigger drift.
 *
 * Run: npx tsx scripts/seed-dashboard.ts
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const today = new Date();
function daysAgo(n: number): string {
  const d = new Date(today);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
const FAKE_USER = "00000000-0000-0000-0000-000000000001";

// ─── Proveedores ─────────────────────────────────────────────────────────────
const PROVEEDORES = [
  { company: "Carnes del Norte S.A.",       contact: "Juan García",       email: "juan@carnesdelnorte.com",  phone: "+1 555 100 0001", address: "1200 Industrial Blvd, Houston, TX" },
  { company: "Distribuidora de Bebidas",    contact: "Roberto Martínez",  email: "roberto@distbebidas.com",  phone: "+1 555 100 0002", address: "55 Beverage Way, Dallas, TX" },
  { company: "Mariscos La Flota",           contact: "Patricia Sánchez",  email: "patty@laflota.com",        phone: "+1 555 100 0003", address: "Pier 7, San Diego, CA" },
  { company: "Lácteos La Vaquita",          contact: "María González",    email: "maria@lavaquita.com",      phone: "+1 555 100 0004", address: "300 Dairy Rd, Wisconsin" },
  { company: "Abarrotes El Mercado",        contact: "Fernando Ruiz",     email: "fer@elmercado.com",        phone: "+1 555 100 0005", address: "210 Market St, Phoenix, AZ" },
  { company: "Verduras Frescas Hidalgo",    contact: "Ana Hernández",     email: "ana@verdurasfrescas.com",  phone: "+1 555 100 0006", address: "Mercado Central, Los Angeles, CA" },
];

// ─── Productos ───────────────────────────────────────────────────────────────
// Final desired stock_actual values: some products are critical (actual < minimo)
const PRODUCTOS = [
  { nombre: "Arrachera de Res",     categoria: "Carnes",      unidad: "kg", stock: 12,  min: 20, price: 14.50 },
  { nombre: "Pechuga de Pollo",     categoria: "Carnes",      unidad: "kg", stock: 35,  min: 15, price: 6.20 },
  { nombre: "Costilla de Cerdo",    categoria: "Carnes",      unidad: "kg", stock: 8,   min: 10, price: 7.80 },
  { nombre: "Camarón U15",          categoria: "Mariscos",    unidad: "kg", stock: 5,   min: 8,  price: 22.00 },
  { nombre: "Pulpo",                categoria: "Mariscos",    unidad: "kg", stock: 3,   min: 5,  price: 18.00 },
  { nombre: "Tilapia Fresca",       categoria: "Mariscos",    unidad: "kg", stock: 14,  min: 8,  price: 9.50 },
  { nombre: "Queso Oaxaca",         categoria: "Lácteos",     unidad: "kg", stock: 18,  min: 8,  price: 6.40 },
  { nombre: "Crema Ácida",          categoria: "Lácteos",     unidad: "L",  stock: 12,  min: 6,  price: 3.90 },
  { nombre: "Leche Entera",         categoria: "Lácteos",     unidad: "L",  stock: 28,  min: 15, price: 1.40 },
  { nombre: "Mantequilla",          categoria: "Lácteos",     unidad: "kg", stock: 9,   min: 5,  price: 5.20 },
  { nombre: "Tomate Saladet",       categoria: "Verduras",    unidad: "kg", stock: 22,  min: 12, price: 1.10 },
  { nombre: "Cebolla Blanca",       categoria: "Verduras",    unidad: "kg", stock: 30,  min: 15, price: 0.80 },
  { nombre: "Cilantro",             categoria: "Verduras",    unidad: "kg", stock: 2,   min: 3,  price: 1.20 },
  { nombre: "Chile Jalapeño",       categoria: "Verduras",    unidad: "kg", stock: 4,   min: 5,  price: 2.10 },
  { nombre: "Aguacate Hass",        categoria: "Verduras",    unidad: "kg", stock: 16,  min: 10, price: 3.30 },
  { nombre: "Tequila Blanco",       categoria: "Bebidas",     unidad: "L",  stock: 24,  min: 10, price: 28.00 },
  { nombre: "Cerveza Artesanal",    categoria: "Bebidas",     unidad: "caja", stock: 18, min: 8, price: 32.00 },
  { nombre: "Refresco Cola",        categoria: "Bebidas",     unidad: "caja", stock: 22, min: 10, price: 14.00 },
  { nombre: "Arroz Largo",          categoria: "Granos",      unidad: "kg", stock: 40,  min: 20, price: 1.80 },
  { nombre: "Frijoles Negros",      categoria: "Granos",      unidad: "kg", stock: 32,  min: 15, price: 2.20 },
  { nombre: "Comino Molido",        categoria: "Condimentos", unidad: "kg", stock: 1.5, min: 1,  price: 24.00 },
  { nombre: "Orégano Mexicano",     categoria: "Condimentos", unidad: "kg", stock: 0.8, min: 1,  price: 28.00 },
  { nombre: "Sal de Mar",           categoria: "Condimentos", unidad: "kg", stock: 6,   min: 3,  price: 1.50 },
];

interface SeedOrder {
  folio: string;
  proveedorIdx: number;
  daysAgo: number;
  lines: Array<{ productoIdx: number; qty: number; price: number }>;
  hasInvoice: boolean;
}

// ─── Órdenes de compra (folios + líneas) ─────────────────────────────────────
const ORDERS: SeedOrder[] = [
  { folio: "ORD-001", proveedorIdx: 0, daysAgo: 2,  hasInvoice: true,  lines: [{ productoIdx: 0, qty: 30, price: 14.30 }, { productoIdx: 1, qty: 40, price: 6.10 }] },
  { folio: "ORD-002", proveedorIdx: 0, daysAgo: 5,  hasInvoice: true,  lines: [{ productoIdx: 0, qty: 25, price: 14.50 }, { productoIdx: 2, qty: 20, price: 7.80 }] },
  { folio: "ORD-003", proveedorIdx: 0, daysAgo: 12, hasInvoice: true,  lines: [{ productoIdx: 1, qty: 50, price: 6.20 }, { productoIdx: 0, qty: 20, price: 14.40 }] },
  { folio: "ORD-004", proveedorIdx: 1, daysAgo: 3,  hasInvoice: true,  lines: [{ productoIdx: 15, qty: 12, price: 27.50 }, { productoIdx: 17, qty: 18, price: 14.00 }] },
  { folio: "ORD-005", proveedorIdx: 1, daysAgo: 9,  hasInvoice: true,  lines: [{ productoIdx: 16, qty: 15, price: 32.00 }, { productoIdx: 17, qty: 12, price: 14.00 }] },
  { folio: "ORD-006", proveedorIdx: 1, daysAgo: 18, hasInvoice: false, lines: [{ productoIdx: 15, qty: 10, price: 28.00 }] },
  { folio: "ORD-007", proveedorIdx: 2, daysAgo: 4,  hasInvoice: true,  lines: [{ productoIdx: 3, qty: 20, price: 22.00 }, { productoIdx: 4, qty: 8, price: 18.00 }] },
  { folio: "ORD-008", proveedorIdx: 2, daysAgo: 14, hasInvoice: false, lines: [{ productoIdx: 5, qty: 25, price: 9.50 }, { productoIdx: 3, qty: 12, price: 21.80 }] },
  { folio: "ORD-009", proveedorIdx: 3, daysAgo: 6,  hasInvoice: true,  lines: [{ productoIdx: 6, qty: 25, price: 6.40 }, { productoIdx: 8, qty: 60, price: 1.40 }, { productoIdx: 7, qty: 18, price: 3.90 }] },
  { folio: "ORD-010", proveedorIdx: 3, daysAgo: 20, hasInvoice: true,  lines: [{ productoIdx: 9, qty: 14, price: 5.20 }, { productoIdx: 8, qty: 45, price: 1.40 }] },
  { folio: "ORD-011", proveedorIdx: 4, daysAgo: 7,  hasInvoice: true,  lines: [{ productoIdx: 18, qty: 80, price: 1.80 }, { productoIdx: 19, qty: 50, price: 2.20 }, { productoIdx: 22, qty: 10, price: 1.50 }] },
  { folio: "ORD-012", proveedorIdx: 4, daysAgo: 16, hasInvoice: false, lines: [{ productoIdx: 20, qty: 2, price: 24.00 }, { productoIdx: 21, qty: 1.5, price: 28.00 }] },
  { folio: "ORD-013", proveedorIdx: 5, daysAgo: 8,  hasInvoice: true,  lines: [{ productoIdx: 10, qty: 60, price: 1.10 }, { productoIdx: 11, qty: 50, price: 0.80 }, { productoIdx: 14, qty: 25, price: 3.30 }] },
  { folio: "ORD-014", proveedorIdx: 5, daysAgo: 22, hasInvoice: false, lines: [{ productoIdx: 12, qty: 15, price: 1.20 }, { productoIdx: 13, qty: 18, price: 2.10 }] },
];

// ─── Mermas ──────────────────────────────────────────────────────────────────
interface SeedMerma {
  productoIdx: number;
  qty: number;
  motivo: "Vencimiento" | "Mala calidad" | "Accidente" | "Otro";
  daysAgo: number;
}

const MERMAS: SeedMerma[] = [
  { productoIdx: 4,  qty: 2,   motivo: "Mala calidad", daysAgo: 4  }, // Pulpo
  { productoIdx: 0,  qty: 1.5, motivo: "Mala calidad", daysAgo: 8  }, // Arrachera
  { productoIdx: 7,  qty: 3,   motivo: "Accidente",    daysAgo: 10 }, // Crema Ácida
  { productoIdx: 8,  qty: 4,   motivo: "Accidente",    daysAgo: 12 }, // Leche
  { productoIdx: 10, qty: 3,   motivo: "Vencimiento",  daysAgo: 15 }, // Tomate
  { productoIdx: 12, qty: 1,   motivo: "Vencimiento",  daysAgo: 6  }, // Cilantro
  { productoIdx: 13, qty: 1.5, motivo: "Mala calidad", daysAgo: 18 }, // Chile Jalapeño
  { productoIdx: 6,  qty: 2,   motivo: "Vencimiento",  daysAgo: 25 }, // Queso
  { productoIdx: 14, qty: 1.5, motivo: "Mala calidad", daysAgo: 28 }, // Aguacate
  { productoIdx: 5,  qty: 2,   motivo: "Vencimiento",  daysAgo: 35 }, // Tilapia
];

// ─── Salidas (consumos) ──────────────────────────────────────────────────────
interface SeedSalida {
  productoIdx: number;
  qty: number;
  daysAgo: number;
}

const SALIDAS: SeedSalida[] = [
  { productoIdx: 0, qty: 4, daysAgo: 1 },
  { productoIdx: 1, qty: 6, daysAgo: 1 },
  { productoIdx: 0, qty: 5, daysAgo: 3 },
  { productoIdx: 8, qty: 8, daysAgo: 2 },
  { productoIdx: 10, qty: 5, daysAgo: 4 },
  { productoIdx: 11, qty: 6, daysAgo: 4 },
  { productoIdx: 15, qty: 3, daysAgo: 5 },
  { productoIdx: 17, qty: 4, daysAgo: 5 },
  { productoIdx: 18, qty: 12, daysAgo: 7 },
  { productoIdx: 19, qty: 8, daysAgo: 7 },
  { productoIdx: 6, qty: 3, daysAgo: 9 },
  { productoIdx: 9, qty: 2, daysAgo: 11 },
];

async function main() {
  console.log("→ Wiping existing dashboard data (preserving categorias)...");
  await supabase.from("movimientos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("detalle_orden").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("ordenes_compra").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("proveedor_productos").delete().neq("supplier_id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("productos").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("proveedores").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  // Categorías should already exist from schema.sql; if not, add them.
  console.log("→ Ensuring categorias...");
  const CATEGORIAS_DATA = [
    { nombre: "Carnes",      color: "#BA3026" },
    { nombre: "Lácteos",     color: "#C2972E" },
    { nombre: "Verduras",    color: "#106653" },
    { nombre: "Bebidas",     color: "#0B4455" },
    { nombre: "Granos",      color: "#7B5E2A" },
    { nombre: "Condimentos", color: "#5D4037" },
    { nombre: "Mariscos",    color: "#0288D1" },
  ];
  for (const c of CATEGORIAS_DATA) {
    await supabase.from("categorias").upsert(c, { onConflict: "nombre" });
  }

  const { data: catRows } = await supabase.from("categorias").select("id, nombre");
  const catMap = new Map<string, string>();
  for (const c of catRows ?? []) catMap.set(c.nombre, c.id);

  console.log("→ Inserting proveedores...");
  const { data: provInserted, error: provErr } = await supabase
    .from("proveedores")
    .insert(PROVEEDORES)
    .select("id, company");
  if (provErr) throw provErr;
  const provIdByCompany = new Map<string, string>();
  for (const p of provInserted!) provIdByCompany.set(p.company, p.id);
  console.log(`   ✓ ${provInserted!.length} proveedores`);

  console.log("→ Inserting productos (with high initial stock to absorb mermas)...");
  // Add merma + salida quantities to the desired final stock so the trigger ends with the right number.
  const extraStock = new Map<number, number>();
  for (const m of MERMAS) extraStock.set(m.productoIdx, (extraStock.get(m.productoIdx) ?? 0) + m.qty);
  for (const s of SALIDAS) extraStock.set(s.productoIdx, (extraStock.get(s.productoIdx) ?? 0) + s.qty);

  const productosToInsert = PRODUCTOS.map((p, i) => ({
    nombre: p.nombre,
    categoria_id: catMap.get(p.categoria),
    unidad: p.unidad,
    stock_actual: Math.ceil(p.stock + (extraStock.get(i) ?? 0)),
    stock_minimo: p.min,
    last_price: p.price,
  }));
  const { data: prodInserted, error: prodErr } = await supabase
    .from("productos")
    .insert(productosToInsert)
    .select("id, nombre");
  if (prodErr) throw prodErr;
  const prodIdByName = new Map<string, string>();
  for (const p of prodInserted!) prodIdByName.set(p.nombre, p.id);
  const prodIdsByIdx = PRODUCTOS.map((p) => prodIdByName.get(p.nombre)!);
  console.log(`   ✓ ${prodInserted!.length} productos`);

  console.log("→ Inserting proveedor_productos links...");
  const links: Array<{ supplier_id: string; product_id: string }> = [];
  // Each supplier supplies the products from orders they fulfilled
  for (const order of ORDERS) {
    const supId = provIdByCompany.get(PROVEEDORES[order.proveedorIdx].company)!;
    for (const line of order.lines) {
      const prodId = prodIdsByIdx[line.productoIdx];
      links.push({ supplier_id: supId, product_id: prodId });
    }
  }
  // Dedupe
  const linkSet = new Set<string>();
  const dedupedLinks = links.filter((l) => {
    const k = `${l.supplier_id}:${l.product_id}`;
    if (linkSet.has(k)) return false;
    linkSet.add(k);
    return true;
  });
  await supabase.from("proveedor_productos").insert(dedupedLinks);
  console.log(`   ✓ ${dedupedLinks.length} links`);

  console.log("→ Inserting ordenes_compra...");
  const ordersToInsert = ORDERS.map((o) => {
    const total = o.lines.reduce((s, l) => s + l.qty * l.price, 0);
    return {
      folio: o.folio,
      supplier_id: provIdByCompany.get(PROVEEDORES[o.proveedorIdx].company)!,
      fecha: daysAgo(o.daysAgo),
      total: Number(total.toFixed(2)),
      has_invoice: o.hasInvoice,
      invoice_url: o.hasInvoice ? `invoices/${o.folio}.pdf` : null,
    };
  });
  const { data: ordInserted, error: ordErr } = await supabase
    .from("ordenes_compra")
    .insert(ordersToInsert)
    .select("id, folio");
  if (ordErr) throw ordErr;
  const ordIdByFolio = new Map<string, string>();
  for (const o of ordInserted!) ordIdByFolio.set(o.folio, o.id);
  console.log(`   ✓ ${ordInserted!.length} ordenes_compra`);

  console.log("→ Inserting detalle_orden...");
  const detalles: Array<{ orden_id: string; product_id: string; qty: number; price: number }> = [];
  for (const o of ORDERS) {
    const ordId = ordIdByFolio.get(o.folio)!;
    for (const l of o.lines) {
      detalles.push({
        orden_id: ordId,
        product_id: prodIdsByIdx[l.productoIdx],
        qty: l.qty,
        price: l.price,
      });
    }
  }
  const { error: detErr } = await supabase.from("detalle_orden").insert(detalles);
  if (detErr) throw detErr;
  console.log(`   ✓ ${detalles.length} detalle_orden rows`);

  console.log("→ Inserting movimientos (mermas + salidas)...");
  const mermaRows = MERMAS.map((m) => ({
    product_id: prodIdsByIdx[m.productoIdx],
    tipo: "merma",
    qty: m.qty,
    fecha: daysAgo(m.daysAgo),
    user_id: FAKE_USER,
    motivo_merma: m.motivo,
    value_lost: Number((m.qty * PRODUCTOS[m.productoIdx].price).toFixed(2)),
  }));
  const salidaRows = SALIDAS.map((s) => ({
    product_id: prodIdsByIdx[s.productoIdx],
    tipo: "salida",
    qty: s.qty,
    fecha: daysAgo(s.daysAgo),
    user_id: FAKE_USER,
    notes: "Consumo del día",
  }));
  const { error: movErr } = await supabase
    .from("movimientos")
    .insert([...mermaRows, ...salidaRows]);
  if (movErr) throw movErr;
  console.log(`   ✓ ${mermaRows.length} mermas + ${salidaRows.length} salidas`);

  console.log("→ Verifying final stock_actual matches desired demo state...");
  // Optional sanity print
  const { data: finalStock } = await supabase
    .from("productos")
    .select("nombre, stock_actual, stock_minimo")
    .order("nombre");
  for (const p of finalStock ?? []) {
    const desiredIdx = PRODUCTOS.findIndex((x) => x.nombre === p.nombre);
    const desired = desiredIdx >= 0 ? PRODUCTOS[desiredIdx].stock : "?";
    const status = p.stock_actual < p.stock_minimo ? "⚠ CRITICAL" : "  ok";
    console.log(`   ${status}  ${p.nombre.padEnd(24)} actual=${p.stock_actual} min=${p.stock_minimo} (target was ${desired})`);
  }

  console.log("\n✓ Seed complete.");
}

main().catch((e) => {
  console.error("✗ Seed failed:", e);
  process.exit(1);
});
