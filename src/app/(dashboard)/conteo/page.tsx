import { getZonas } from "@/lib/actions/zonas.actions";
import { getAllProductos } from "@/lib/actions/productos.actions";
import ConteoClient from "./ConteoClient";

export const metadata = { title: "Conteo por Zonas" };

export default async function ConteoPage() {
  const [{ data: zonas }, { data: productos }] = await Promise.all([
    getZonas(),
    getAllProductos(),
  ]);

  return <ConteoClient zonas={zonas ?? []} productos={productos} />;
}
