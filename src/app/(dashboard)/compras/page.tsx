import { getOrdenes } from "@/lib/actions/compras.actions";
import { getProveedores } from "@/lib/actions/proveedores.actions";
import { getProductos } from "@/lib/actions/productos.actions";
import ComprasClient from "./ComprasClient";

export default async function ComprasPage() {
  const [{ data: ordenes }, { data: proveedores }, { data: productos }] = await Promise.all([
    getOrdenes(),
    getProveedores(),
    getProductos(),
  ]);

  return (
    <ComprasClient
      ordenes={ordenes ?? []}
      proveedores={(proveedores ?? []).filter((p) => p.activo)}
      productos={productos ?? []}
    />
  );
}
