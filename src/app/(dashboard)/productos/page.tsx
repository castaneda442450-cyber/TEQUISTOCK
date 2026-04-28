import { getProductos, getCategorias } from "@/lib/actions/productos.actions";
import ProductosClient from "./ProductosClient";

export default async function ProductosPage() {
  const [productosResult, { data: categorias }] = await Promise.all([
    getProductos(),
    getCategorias(),
  ]);

  return (
    <ProductosClient
      productos={productosResult.data}
      categorias={categorias ?? []}
    />
  );
}
