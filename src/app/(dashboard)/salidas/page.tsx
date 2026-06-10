import { getMovimientos } from "@/lib/actions/salidas.actions";
import { getAllProductos } from "@/lib/actions/productos.actions";
import SalidasClient from "./SalidasClient";

export default async function SalidasPage() {
  const [{ data: movimientos }, { data: productos }] = await Promise.all([
    getMovimientos(undefined, 200),
    getAllProductos(),
  ]);

  return (
    <SalidasClient
      movimientos={movimientos ?? []}
      productos={productos ?? []}
    />
  );
}
