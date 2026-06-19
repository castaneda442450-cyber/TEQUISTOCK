import { getProductos, getCategorias } from "@/lib/actions/productos.actions";
import ProductosClient from "./ProductosClient";

interface ProductosPageProps {
  searchParams: Promise<{
    search?: string;
    categoria?: string;
    frecuencia?: string;
    page?: string;
  }>;
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const params = await searchParams;
  const page = Number(params.page) > 0 ? Number(params.page) : 1;

  const [productosResult, { data: categorias }] = await Promise.all([
    getProductos({
      search: params.search,
      categoriaId: params.categoria,
      frecuencia: params.frecuencia,
      page,
    }),
    getCategorias(),
  ]);

  return (
    <ProductosClient
      productos={productosResult.data}
      count={productosResult.count}
      totalPages={productosResult.totalPages}
      currentPage={productosResult.page}
      categorias={categorias ?? []}
      initialSearch={params.search ?? ""}
      initialCategoria={params.categoria ?? ""}
      initialFrecuencia={params.frecuencia ?? ""}
    />
  );
}
