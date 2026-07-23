export type UnitFamily = "weight" | "volume" | "count";

export type Unit = {
  key: string; // identificador único ej: 'kg', 'lb', 'oz'
  label: string; // texto a mostrar ej: 'Kilogramos (kg)'
  short: string; // abreviación ej: 'kg'
  family: UnitFamily;
  toBase: number; // factor de conversión a la unidad base
  // weight base = gramo (g)
  // volume base = mililitro (ml)
  // count base = 1 (no convierte)
};

export const UNITS: Unit[] = [
  // PESO — base: gramo
  { key: "g", label: "Gramos (g)", short: "g", family: "weight", toBase: 1 },
  { key: "kg", label: "Kilogramos (kg)", short: "kg", family: "weight", toBase: 1000 },
  { key: "lb", label: "Libras (lb)", short: "lb", family: "weight", toBase: 453.592 },
  { key: "oz", label: "Onzas peso (oz)", short: "oz", family: "weight", toBase: 28.3495 },

  // VOLUMEN — base: mililitro
  { key: "ml", label: "Mililitros (ml)", short: "ml", family: "volume", toBase: 1 },
  { key: "L", label: "Litros (L)", short: "L", family: "volume", toBase: 1000 },
  { key: "floz", label: "Fl oz (fl oz)", short: "fl oz", family: "volume", toBase: 29.5735 },
  { key: "gal", label: "Galones (gal)", short: "gal", family: "volume", toBase: 3785.41 },
  { key: "cup", label: "Tazas (cup)", short: "cup", family: "volume", toBase: 236.588 },

  // CONTEO — no convierten entre sí
  { key: "pz", label: "Pieza (pz)", short: "pz", family: "count", toBase: 1 },
  { key: "caja", label: "Caja", short: "caja", family: "count", toBase: 1 },
  { key: "bulto", label: "Bulto", short: "bulto", family: "count", toBase: 1 },
  { key: "bolsa", label: "Bolsa", short: "bolsa", family: "count", toBase: 1 },
  { key: "lata", label: "Lata", short: "lata", family: "count", toBase: 1 },
];

// Alias para cubrir variaciones de escritura ya presentes en productos existentes.
export const UNIT_ALIASES: Record<string, string> = {
  lbs: "lb",
  mL: "ml",
};

function normalizeUnitKey(key: string): string {
  return UNIT_ALIASES[key] ?? key;
}

function findUnit(key: string): Unit | undefined {
  return UNITS.find((u) => u.key === normalizeUnitKey(key));
}

// Función principal de conversión
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
): number | null {
  const fromKey = normalizeUnitKey(fromUnit);
  const toKey = normalizeUnitKey(toUnit);
  if (fromKey === toKey) return value;

  const from = findUnit(fromKey);
  const to = findUnit(toKey);

  if (!from || !to) return null;

  // No se puede convertir entre familias distintas
  if (from.family !== to.family) return null;

  // Unidades de conteo no convierten entre sí
  if (from.family === "count") return null;

  // Convertir: valor → base → unidad destino
  const inBase = value * from.toBase;
  return inBase / to.toBase;
}

// Retorna las unidades compatibles con una unidad dada
// (misma familia, para mostrar en el selector de conversión)
export function getCompatibleUnits(unitKey: string): Unit[] {
  const unit = findUnit(unitKey);
  if (!unit) return [];
  if (unit.family === "count") return [unit]; // count no convierte
  return UNITS.filter((u) => u.family === unit.family);
}

// Verifica si dos unidades son compatibles (misma familia)
export function areCompatible(unitA: string, unitB: string): boolean {
  const a = findUnit(unitA);
  const b = findUnit(unitB);
  if (!a || !b) return false;
  if (a.family === "count" || b.family === "count") return false;
  return a.family === b.family;
}
