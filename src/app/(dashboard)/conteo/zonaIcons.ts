import { Warehouse, Snowflake, Wine, ChefHat, Package, Layers, type LucideIcon } from "lucide-react";

export const ZONA_COLORS = [
  "#0B4455",
  "#BA3026",
  "#C2972E",
  "#106653",
  "#185FA5",
  "#7B3F00",
  "#4A0072",
  "#1C1714",
] as const;

export const ZONA_ICON_KEYS = ["warehouse", "snowflake", "wine", "chef-hat", "package", "layers"] as const;

export type ZonaIconKey = (typeof ZONA_ICON_KEYS)[number];

const ZONA_ICON_MAP: Record<ZonaIconKey, LucideIcon> = {
  warehouse: Warehouse,
  snowflake: Snowflake,
  wine: Wine,
  "chef-hat": ChefHat,
  package: Package,
  layers: Layers,
};

export function getZonaIcon(icono: string): LucideIcon {
  return ZONA_ICON_MAP[icono as ZonaIconKey] ?? Warehouse;
}
