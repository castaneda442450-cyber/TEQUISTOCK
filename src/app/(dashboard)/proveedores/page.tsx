import { getProveedores } from "@/lib/actions/proveedores.actions";
import { getProductos } from "@/lib/actions/productos.actions";
import ProveedoresClient from "./ProveedoresClient";

export default async function ProveedoresPage() {
  const [{ data: proveedores }, { data: productos }] = await Promise.all([
    getProveedores(),
    getProductos(),
  ]);

  return (
    <ProveedoresClient
      proveedores={proveedores ?? []}
      productos={productos ?? []}
    />
  );
}
