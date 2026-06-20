import { getFichas } from "@/lib/actions/fichas.actions";
import { getAllProductos } from "@/lib/actions/productos.actions";
import { FichasClient } from "./FichasClient";

export const metadata = { title: "Fichas Técnicas — TequiStock" };

export default async function FichasPage() {
  const [{ data: fichas }, { data: productos }] = await Promise.all([
    getFichas(),
    getAllProductos(),
  ]);

  return <FichasClient fichas={fichas} productos={productos} />;
}
