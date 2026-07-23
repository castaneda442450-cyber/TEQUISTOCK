import { getResumenPorciones } from "@/lib/actions/porcionado.actions";
import { getAllProductos } from "@/lib/actions/productos.actions";
import PorcionadoClient from "./PorcionadoClient";

export const metadata = { title: "Porcionado" };

export default async function PorcionadoPage() {
  const [{ data: resumen }, { data: productos }] = await Promise.all([
    getResumenPorciones(),
    getAllProductos(),
  ]);

  return <PorcionadoClient resumen={resumen} productos={productos} />;
}
