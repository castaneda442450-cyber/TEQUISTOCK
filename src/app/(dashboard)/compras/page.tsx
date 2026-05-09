import { getOrdenes } from "@/lib/actions/compras.actions";
import { getProveedores } from "@/lib/actions/proveedores.actions";
import { getProductos } from "@/lib/actions/productos.actions";
import ComprasClient from "./ComprasClient";

interface SearchParams {
  desde?: string;
  hasta?: string;
  supplier_id?: string;
  page?: string;
}

export default async function ComprasPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [{ data: ordenes }, { data: proveedores }, { data: productos }] = await Promise.all([
    getOrdenes({
      desde: params.desde,
      hasta: params.hasta,
      supplier_id: params.supplier_id,
    }),
    getProveedores(),
    getProductos(),
  ]);

  return (
    <ComprasClient
      ordenes={ordenes ?? []}
      proveedores={(proveedores ?? []).filter((p) => p.activo)}
      productos={productos ?? []}
      initialFilters={{
        desde: params.desde ?? "",
        hasta: params.hasta ?? "",
        supplier_id: params.supplier_id ?? "",
      }}
    />
  );
}
