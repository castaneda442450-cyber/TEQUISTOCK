import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const tables = ["categorias", "productos", "proveedores", "proveedor_productos", "ordenes_compra", "detalle_orden", "movimientos"];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select("*", { count: "exact", head: true });
    console.log(`${t.padEnd(22)} ${error ? `ERROR: ${error.message}` : `count=${count}`}`);
  }

  const { data: orders } = await supabase
    .from("ordenes_compra")
    .select("id, folio, fecha, total")
    .order("fecha", { ascending: false })
    .limit(5);
  console.log("\nLatest ordenes_compra:");
  console.log(orders);

  const { data: detalles } = await supabase.from("detalle_orden").select("*").limit(3);
  console.log("\nSample detalle_orden:");
  console.log(detalles);

  const { data: mermas } = await supabase
    .from("movimientos")
    .select("id, fecha, tipo, qty, value_lost, motivo_merma")
    .eq("tipo", "merma")
    .order("fecha", { ascending: false })
    .limit(5);
  console.log("\nLatest mermas:");
  console.log(mermas);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
