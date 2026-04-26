import { DollarSign, Trash2, Users } from "lucide-react";
import { CategoryBadge } from "@/components/shared/CategoryBadge";
import { MermaBadge } from "@/components/shared/MermaBadge";
import { RankingCard } from "./RankingCard";
import type { TopMermaRow, TopProductoRow, TopProveedorRow } from "@/types";

function PurchaseCountBadge({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center rounded-pill text-[11px] font-semibold whitespace-nowrap"
      style={{
        background: "rgba(11, 68, 85, 0.10)",
        color: "#0B4455",
        padding: "2px 10px",
      }}
    >
      {count} compra{count === 1 ? "" : "s"}
    </span>
  );
}

interface RankingsRowProps {
  topProductos: TopProductoRow[];
  topProveedores: TopProveedorRow[];
  topMerma: TopMermaRow[];
  totals: {
    compras: number;
    merma: number;
  };
}

export function RankingsRow({
  topProductos,
  topProveedores,
  topMerma,
  totals,
}: RankingsRowProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <RankingCard
        title="Top 5 Productos Más Costosos"
        icon={<DollarSign size={15} color="#BA3026" strokeWidth={2.2} />}
        iconBg="rgba(186, 48, 38, 0.13)"
        accentColor="#BA3026"
        total={totals.compras}
        items={topProductos.map((p) => ({
          key: p.id,
          name: p.nombre,
          value: p.spent,
          badge: <CategoryBadge category={p.categoria} />,
        }))}
      />
      <RankingCard
        title="Top 5 Proveedores"
        icon={<Users size={15} color="#0B4455" strokeWidth={2.2} />}
        iconBg="rgba(11, 68, 85, 0.13)"
        accentColor="#0B4455"
        total={totals.compras}
        items={topProveedores.map((p) => ({
          key: p.id,
          name: p.company,
          value: p.totalSpent,
          badge: <PurchaseCountBadge count={p.purchasesCount} />,
        }))}
      />
      <RankingCard
        title="Top 5 Mayor Merma"
        icon={<Trash2 size={15} color="#E67E22" strokeWidth={2.2} />}
        iconBg="rgba(230, 126, 34, 0.13)"
        accentColor="#BA3026"
        items={topMerma.map((m) => ({
          key: m.productoId,
          name: m.nombre,
          value: m.value,
          badge: <MermaBadge type={m.motivoMermaTop} />,
          sublabel: `${m.qty} ${m.unidad}`,
        }))}
      />
    </div>
  );
}
