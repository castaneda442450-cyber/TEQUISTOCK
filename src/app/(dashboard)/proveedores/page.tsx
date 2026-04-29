import { getProveedores } from "@/lib/actions/proveedores.actions";
import { getAllProductos } from "@/lib/actions/productos.actions";
import ProveedoresClient from "./ProveedoresClient";

interface ProveedoresPageProps {
  searchParams: Promise<{
    search?: string;
  }>;
}

export default async function ProveedoresPage({ searchParams }: ProveedoresPageProps) {
  const params = await searchParams;

  const [{ data: proveedores }, { data: productos }] = await Promise.all([
    getProveedores(params.search),
    getAllProductos(),
  ]);

  return (
    <ProveedoresClient
      proveedores={proveedores ?? []}
      productos={productos ?? []}
      initialSearch={params.search ?? ""}
    />
  );
}
