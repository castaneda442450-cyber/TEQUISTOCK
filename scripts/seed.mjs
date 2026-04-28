import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://xqlnhuqiwifwjixccwgp.supabase.co",
  "sb_secret_gJd_-L699J4DsJi2DiDkBw_hG2ilK91",
  { auth: { persistSession: false } }
);

// Fixed user ID for Carlos Nieto (no Supabase Auth, just a consistent UUID)
const CARLOS_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  console.log("🌱 Starting seed...\n");

  // ── Categorias (already seeded, just fetch IDs) ─────────────────────────
  const { data: cats } = await sb.from("categorias").select("id,nombre");
  const catId = Object.fromEntries(cats.map((c) => [c.nombre, c.id]));
  console.log("✅ Categorias loaded:", Object.keys(catId).join(", "));

  // ── Proveedores ──────────────────────────────────────────────────────────
  const proveedoresData = [
    { company: "Carnes Premium SA", contact: "Carlos López",    email: "carlos@carnespremium.mx",   phone: "+52 55 1234 5678", address: "Calle 5 de Febrero 123, CDMX",         total_spent: 0, activo: true },
    { company: "Verduras Frescas",  contact: "María González",  email: "maria@verdurasfrescas.mx",   phone: "+52 55 9876 5432", address: "Mercado Central Local 45, CDMX",      total_spent: 0, activo: true },
    { company: "Bebidas México",    contact: "Roberto Martínez",email: "roberto@bebidasmx.mx",       phone: "+52 55 5555 5555", address: "Blvd. Tolstoi 456, CDMX",             total_spent: 0, activo: true },
    { company: "Lácteos Puros",     contact: "Patricia Sánchez",email: "patricia@lacteosp.mx",       phone: "+52 55 3333 3333", address: "Calzada de Tlalpan 789, CDMX",        total_spent: 0, activo: true },
    { company: "Especias Gourmet",  contact: "Fernando Ruiz",   email: "fernando@especiasg.mx",      phone: "+52 55 2222 2222", address: "Avenida Paseo 321, CDMX",             total_spent: 0, activo: true },
    { company: "Distribuidora Gen", contact: "Juan García",     email: "juan@distgen.mx",            phone: "+52 55 4444 4444", address: "Av. Paseo de la Reforma 505, CDMX",   total_spent: 0, activo: true },
  ];
  const { data: provs, error: provErr } = await sb.from("proveedores").insert(proveedoresData).select("id,company");
  if (provErr) { console.error("❌ Proveedores:", provErr.message); process.exit(1); }
  const provId = Object.fromEntries(provs.map((p) => [p.company, p.id]));
  console.log("✅ Proveedores insertados:", provs.length);

  // ── Productos ────────────────────────────────────────────────────────────
  const productosData = [
    // Carnes
    { nombre: "Carne de Res",        categoria_id: catId["Carnes"],      unidad: "kg",     stock_actual: 45,  stock_minimo: 20, last_price: 150.00 },
    { nombre: "Pechuga de Pollo",    categoria_id: catId["Carnes"],      unidad: "kg",     stock_actual: 60,  stock_minimo: 25, last_price: 80.00  },
    { nombre: "Filete de Cerdo",     categoria_id: catId["Carnes"],      unidad: "kg",     stock_actual: 35,  stock_minimo: 15, last_price: 120.00 },
    { nombre: "Costillas de Res",    categoria_id: catId["Carnes"],      unidad: "kg",     stock_actual: 28,  stock_minimo: 10, last_price: 180.00 },
    // Mariscos
    { nombre: "Camarones Jumbo",     categoria_id: catId["Mariscos"],    unidad: "kg",     stock_actual: 20,  stock_minimo: 10, last_price: 350.00 },
    { nombre: "Pulpo Limpio",        categoria_id: catId["Mariscos"],    unidad: "kg",     stock_actual: 8,   stock_minimo: 5,  last_price: 280.00 },
    // Lácteos
    { nombre: "Queso Oaxaca",        categoria_id: catId["Lácteos"],     unidad: "kg",     stock_actual: 12,  stock_minimo: 5,  last_price: 85.00  },
    { nombre: "Leche Entera",        categoria_id: catId["Lácteos"],     unidad: "litro",  stock_actual: 40,  stock_minimo: 20, last_price: 22.00  },
    { nombre: "Crema Ácida",         categoria_id: catId["Lácteos"],     unidad: "litro",  stock_actual: 18,  stock_minimo: 8,  last_price: 45.00  },
    { nombre: "Mantequilla",         categoria_id: catId["Lácteos"],     unidad: "kg",     stock_actual: 6,   stock_minimo: 3,  last_price: 95.00  },
    // Verduras
    { nombre: "Lechuga Romana",      categoria_id: catId["Verduras"],    unidad: "pieza",  stock_actual: 50,  stock_minimo: 15, last_price: 8.00   },
    { nombre: "Tomate Rojo",         categoria_id: catId["Verduras"],    unidad: "kg",     stock_actual: 35,  stock_minimo: 15, last_price: 12.00  },
    { nombre: "Cebolla Blanca",      categoria_id: catId["Verduras"],    unidad: "kg",     stock_actual: 40,  stock_minimo: 20, last_price: 10.00  },
    { nombre: "Chile Poblano",       categoria_id: catId["Verduras"],    unidad: "kg",     stock_actual: 25,  stock_minimo: 10, last_price: 25.00  },
    { nombre: "Cilantro Fresco",     categoria_id: catId["Verduras"],    unidad: "manojo", stock_actual: 30,  stock_minimo: 10, last_price: 5.00   },
    { nombre: "Aguacate Hass",       categoria_id: catId["Verduras"],    unidad: "kg",     stock_actual: 15,  stock_minimo: 8,  last_price: 45.00  },
    { nombre: "Limón Persa",         categoria_id: catId["Verduras"],    unidad: "kg",     stock_actual: 20,  stock_minimo: 10, last_price: 18.00  },
    // Bebidas
    { nombre: "Cerveza Corona",      categoria_id: catId["Bebidas"],     unidad: "caja",   stock_actual: 15,  stock_minimo: 5,  last_price: 250.00 },
    { nombre: "Coca-Cola 2L",        categoria_id: catId["Bebidas"],     unidad: "caja",   stock_actual: 20,  stock_minimo: 8,  last_price: 180.00 },
    { nombre: "Agua Mineral 1L",     categoria_id: catId["Bebidas"],     unidad: "caja",   stock_actual: 50,  stock_minimo: 20, last_price: 60.00  },
    // Granos
    { nombre: "Arroz Blanco",        categoria_id: catId["Granos"],      unidad: "kg",     stock_actual: 25,  stock_minimo: 10, last_price: 18.00  },
    { nombre: "Frijoles Negros",     categoria_id: catId["Granos"],      unidad: "kg",     stock_actual: 20,  stock_minimo: 8,  last_price: 22.00  },
    { nombre: "Masa para Tortillas", categoria_id: catId["Granos"],      unidad: "kg",     stock_actual: 4,   stock_minimo: 5,  last_price: 12.00  },
    // Condimentos
    { nombre: "Comino",              categoria_id: catId["Condimentos"], unidad: "kg",     stock_actual: 2,   stock_minimo: 1,  last_price: 180.00 },
    { nombre: "Orégano Seco",        categoria_id: catId["Condimentos"], unidad: "kg",     stock_actual: 1,   stock_minimo: 1,  last_price: 220.00 },
    { nombre: "Pimienta Negra",      categoria_id: catId["Condimentos"], unidad: "kg",     stock_actual: 1,   stock_minimo: 1,  last_price: 250.00 },
    { nombre: "Sal de Mar",          categoria_id: catId["Condimentos"], unidad: "kg",     stock_actual: 5,   stock_minimo: 2,  last_price: 15.00  },
  ];
  const { data: prods, error: prodErr } = await sb.from("productos").insert(productosData).select("id,nombre,last_price");
  if (prodErr) { console.error("❌ Productos:", prodErr.message); process.exit(1); }
  const prodId = Object.fromEntries(prods.map((p) => [p.nombre, p.id]));
  const prodPrice = Object.fromEntries(prods.map((p) => [p.nombre, p.last_price]));
  console.log("✅ Productos insertados:", prods.length);

  // ── Proveedor-Productos links ─────────────────────────────────────────────
  const links = [
    // Carnes Premium → carnes
    [provId["Carnes Premium SA"], prodId["Carne de Res"]],
    [provId["Carnes Premium SA"], prodId["Pechuga de Pollo"]],
    [provId["Carnes Premium SA"], prodId["Filete de Cerdo"]],
    [provId["Carnes Premium SA"], prodId["Costillas de Res"]],
    [provId["Carnes Premium SA"], prodId["Camarones Jumbo"]],
    [provId["Carnes Premium SA"], prodId["Pulpo Limpio"]],
    // Verduras Frescas → verduras
    [provId["Verduras Frescas"],  prodId["Lechuga Romana"]],
    [provId["Verduras Frescas"],  prodId["Tomate Rojo"]],
    [provId["Verduras Frescas"],  prodId["Cebolla Blanca"]],
    [provId["Verduras Frescas"],  prodId["Chile Poblano"]],
    [provId["Verduras Frescas"],  prodId["Cilantro Fresco"]],
    [provId["Verduras Frescas"],  prodId["Aguacate Hass"]],
    [provId["Verduras Frescas"],  prodId["Limón Persa"]],
    // Bebidas México → bebidas
    [provId["Bebidas México"],    prodId["Cerveza Corona"]],
    [provId["Bebidas México"],    prodId["Coca-Cola 2L"]],
    [provId["Bebidas México"],    prodId["Agua Mineral 1L"]],
    // Lácteos Puros → lácteos
    [provId["Lácteos Puros"],     prodId["Queso Oaxaca"]],
    [provId["Lácteos Puros"],     prodId["Leche Entera"]],
    [provId["Lácteos Puros"],     prodId["Crema Ácida"]],
    [provId["Lácteos Puros"],     prodId["Mantequilla"]],
    // Especias Gourmet → condimentos
    [provId["Especias Gourmet"],  prodId["Comino"]],
    [provId["Especias Gourmet"],  prodId["Orégano Seco"]],
    [provId["Especias Gourmet"],  prodId["Pimienta Negra"]],
    [provId["Especias Gourmet"],  prodId["Sal de Mar"]],
    // Distribuidora Gen → granos
    [provId["Distribuidora Gen"], prodId["Arroz Blanco"]],
    [provId["Distribuidora Gen"], prodId["Frijoles Negros"]],
    [provId["Distribuidora Gen"], prodId["Masa para Tortillas"]],
  ];
  const { error: linkErr } = await sb.from("proveedor_productos").insert(
    links.map(([supplier_id, product_id]) => ({ supplier_id, product_id }))
  );
  if (linkErr) { console.error("❌ proveedor_productos:", linkErr.message); process.exit(1); }
  console.log("✅ Proveedor-Productos links:", links.length);

  // ── Ordenes de Compra + Detalle ──────────────────────────────────────────
  // Each order: { folio, supplier_id, fecha, products: [{nombre, qty}] }
  const ordersSpec = [
    // Abril (mes actual)
    { folio: "ORD-2025-001", prov: "Carnes Premium SA",  fecha: "2025-04-01T10:00:00", items: [["Carne de Res",15],["Pechuga de Pollo",20],["Filete de Cerdo",10]] },
    { folio: "ORD-2025-002", prov: "Verduras Frescas",   fecha: "2025-04-03T09:00:00", items: [["Lechuga Romana",40],["Tomate Rojo",25],["Cebolla Blanca",30],["Cilantro Fresco",20]] },
    { folio: "ORD-2025-003", prov: "Bebidas México",     fecha: "2025-04-05T11:00:00", items: [["Cerveza Corona",10],["Coca-Cola 2L",15],["Agua Mineral 1L",30]] },
    { folio: "ORD-2025-004", prov: "Lácteos Puros",      fecha: "2025-04-08T08:00:00", items: [["Queso Oaxaca",8],["Leche Entera",25],["Crema Ácida",12]] },
    { folio: "ORD-2025-005", prov: "Especias Gourmet",   fecha: "2025-04-10T10:30:00", items: [["Comino",2],["Orégano Seco",1],["Pimienta Negra",1],["Sal de Mar",5]] },
    { folio: "ORD-2025-006", prov: "Distribuidora Gen",  fecha: "2025-04-12T09:30:00", items: [["Arroz Blanco",15],["Frijoles Negros",12],["Masa para Tortillas",10]] },
    { folio: "ORD-2025-007", prov: "Carnes Premium SA",  fecha: "2025-04-15T10:00:00", items: [["Carne de Res",12],["Costillas de Res",8],["Camarones Jumbo",10]] },
    { folio: "ORD-2025-008", prov: "Verduras Frescas",   fecha: "2025-04-18T09:00:00", items: [["Aguacate Hass",10],["Limón Persa",15],["Chile Poblano",12]] },
    { folio: "ORD-2025-009", prov: "Bebidas México",     fecha: "2025-04-22T11:00:00", items: [["Cerveza Corona",8],["Coca-Cola 2L",12],["Agua Mineral 1L",20]] },
    { folio: "ORD-2025-010", prov: "Lácteos Puros",      fecha: "2025-04-24T08:00:00", items: [["Leche Entera",20],["Mantequilla",5],["Crema Ácida",8]] },
    // Marzo (mes anterior)
    { folio: "ORD-2025-M01", prov: "Carnes Premium SA",  fecha: "2025-03-05T10:00:00", items: [["Carne de Res",18],["Pechuga de Pollo",22]] },
    { folio: "ORD-2025-M02", prov: "Verduras Frescas",   fecha: "2025-03-10T09:00:00", items: [["Lechuga Romana",35],["Tomate Rojo",20],["Cebolla Blanca",25]] },
    { folio: "ORD-2025-M03", prov: "Bebidas México",     fecha: "2025-03-15T11:00:00", items: [["Cerveza Corona",12],["Agua Mineral 1L",25]] },
    { folio: "ORD-2025-M04", prov: "Distribuidora Gen",  fecha: "2025-03-20T09:30:00", items: [["Arroz Blanco",12],["Frijoles Negros",10]] },
  ];

  for (const spec of ordersSpec) {
    const total = spec.items.reduce((s, [nombre, qty]) => s + qty * prodPrice[nombre], 0);
    const { data: orden, error: oErr } = await sb.from("ordenes_compra").insert({
      folio: spec.folio,
      supplier_id: provId[spec.prov],
      fecha: spec.fecha,
      total,
      has_invoice: Math.random() > 0.3,
    }).select("id").single();
    if (oErr) { console.error("❌ Orden", spec.folio, oErr.message); continue; }

    const detalles = spec.items.map(([nombre, qty]) => ({
      orden_id: orden.id,
      product_id: prodId[nombre],
      qty,
      price: prodPrice[nombre],
    }));
    const { error: dErr } = await sb.from("detalle_orden").insert(detalles);
    if (dErr) { console.error("❌ Detalle", spec.folio, dErr.message); continue; }

    // Register entrada in movimientos (stock trigger will update stock_actual)
    const movs = spec.items.map(([nombre, qty]) => ({
      product_id: prodId[nombre],
      tipo: "entrada",
      qty,
      fecha: spec.fecha,
      user_id: CARLOS_ID,
      notes: "Compra " + spec.folio,
      ref_id: orden.id,
    }));
    const { error: mErr } = await sb.from("movimientos").insert(movs);
    if (mErr) { console.error("❌ Movimientos entrada", spec.folio, mErr.message); }
  }
  console.log("✅ Ordenes + detalle_orden + movimientos entrada:", ordersSpec.length, "órdenes");

  // ── Consumos (salidas) de Abril ──────────────────────────────────────────
  const salidas = [
    { nombre: "Carne de Res",      qty: 8,  fecha: "2025-04-02T14:00:00", notes: "Consumo servicio" },
    { nombre: "Pechuga de Pollo",  qty: 12, fecha: "2025-04-04T14:00:00", notes: "Consumo servicio" },
    { nombre: "Lechuga Romana",    qty: 15, fecha: "2025-04-06T14:00:00", notes: "Ensaladas" },
    { nombre: "Tomate Rojo",       qty: 8,  fecha: "2025-04-07T14:00:00", notes: "Consumo diario" },
    { nombre: "Cebolla Blanca",    qty: 10, fecha: "2025-04-09T14:00:00", notes: "Consumo diario" },
    { nombre: "Queso Oaxaca",      qty: 3,  fecha: "2025-04-11T14:00:00", notes: "Platillos especiales" },
    { nombre: "Leche Entera",      qty: 8,  fecha: "2025-04-13T14:00:00", notes: "Bebidas" },
    { nombre: "Arroz Blanco",      qty: 5,  fecha: "2025-04-14T14:00:00", notes: "Guarnición" },
    { nombre: "Frijoles Negros",   qty: 4,  fecha: "2025-04-16T14:00:00", notes: "Guarnición" },
    { nombre: "Aguacate Hass",     qty: 4,  fecha: "2025-04-19T14:00:00", notes: "Guacamole" },
    { nombre: "Limón Persa",       qty: 5,  fecha: "2025-04-20T14:00:00", notes: "Bebidas y garnish" },
    { nombre: "Cilantro Fresco",   qty: 8,  fecha: "2025-04-21T14:00:00", notes: "Garnish" },
    { nombre: "Filete de Cerdo",   qty: 5,  fecha: "2025-04-23T14:00:00", notes: "Especial del día" },
    { nombre: "Camarones Jumbo",   qty: 6,  fecha: "2025-04-25T14:00:00", notes: "Especial del día" },
  ];
  const { error: salErr } = await sb.from("movimientos").insert(
    salidas.map(({ nombre, qty, fecha, notes }) => ({
      product_id: prodId[nombre],
      tipo: "salida",
      qty,
      fecha,
      user_id: CARLOS_ID,
      notes,
    }))
  );
  if (salErr) { console.error("❌ Salidas:", salErr.message); }
  else console.log("✅ Consumos (salidas) insertados:", salidas.length);

  // ── Mermas ───────────────────────────────────────────────────────────────
  const mermas = [
    { nombre: "Cilantro Fresco",  qty: 3, motivo: "Vencimiento",  fecha: "2025-04-05T08:00:00" },
    { nombre: "Tomate Rojo",      qty: 2, motivo: "Mala calidad", fecha: "2025-04-09T08:00:00" },
    { nombre: "Lechuga Romana",   qty: 4, motivo: "Vencimiento",  fecha: "2025-04-13T08:00:00" },
    { nombre: "Leche Entera",     qty: 2, motivo: "Accidente",    fecha: "2025-04-17T08:00:00" },
    { nombre: "Queso Oaxaca",     qty: 1, motivo: "Mala calidad", fecha: "2025-04-19T08:00:00" },
    { nombre: "Pechuga de Pollo", qty: 2, motivo: "Vencimiento",  fecha: "2025-04-23T08:00:00" },
    { nombre: "Chile Poblano",    qty: 3, motivo: "Mala calidad", fecha: "2025-04-25T08:00:00" },
  ];
  const { error: merErr } = await sb.from("movimientos").insert(
    mermas.map(({ nombre, qty, motivo, fecha }) => ({
      product_id: prodId[nombre],
      tipo: "merma",
      qty,
      fecha,
      user_id: CARLOS_ID,
      motivo_merma: motivo,
      value_lost: qty * prodPrice[nombre],
    }))
  );
  if (merErr) { console.error("❌ Mermas:", merErr.message); }
  else console.log("✅ Mermas insertadas:", mermas.length);

  console.log("\n🎉 Seed completado.\n");
}

main().catch(console.error);
