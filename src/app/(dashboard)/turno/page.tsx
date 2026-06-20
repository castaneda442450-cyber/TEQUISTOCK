import { getProductosParaCierre } from "@/lib/actions/turno.actions";
import TurnoClient from "./TurnoClient";

export const metadata = { title: "Cierre de Turno" };

export default async function TurnoPage() {
  const { data: productos } = await getProductosParaCierre();
  return <TurnoClient productos={productos ?? []} />;
}
