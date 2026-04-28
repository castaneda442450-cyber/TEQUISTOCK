import { getMovimientos } from "@/lib/actions/salidas.actions";
import { getProductos } from "@/lib/actions/productos.actions";
import SalidasClient from "./SalidasClient";

export default async function SalidasPage() {
  const [{ data: movimientos }, { data: productos }] = await Promise.all([
    getMovimientos(undefined, 200),
    getProductos(),
  ]);

  return (
    <SalidasClient
      movimientos={movimientos ?? []}
      productos={productos ?? []}
    />
  );
}
