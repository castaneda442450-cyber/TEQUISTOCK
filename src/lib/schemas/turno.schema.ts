import { z } from "zod";

// stock_actual is client-supplied for Zod refines (first-pass UX validation only).
// The RPC enforces the same constraints at DB level as SECURITY DEFINER.
// last_price is NOT included here — always fetched fresh from DB after the RPC runs.
export const cierreTurnoItemSchema = z
  .object({
    product_id:    z.string().uuid(),
    qty_consumida: z.number().min(0),
    qty_fisica:    z.number().min(0),
    stock_actual:  z.number().min(0),
    notas:         z.string().max(200).optional(),
  })
  .refine(
    (d) => d.qty_consumida <= d.stock_actual,
    { message: "El consumo no puede ser mayor al stock del sistema.", path: ["qty_consumida"] },
  )
  .refine(
    (d) => d.qty_fisica <= d.stock_actual - d.qty_consumida,
    {
      message: "La cantidad física no puede ser mayor al stock teórico. Verifica el conteo o el consumo.",
      path: ["qty_fisica"],
    },
  );

export const cierreTurnoSchema = z.object({
  items: z.array(cierreTurnoItemSchema).min(1).max(50),
  fecha: z.string().optional().default(() => new Date().toISOString().split("T")[0]),
  tipo:  z.literal("diario"),
});

export type CierreTurnoItemInput = z.infer<typeof cierreTurnoItemSchema>;
export type CierreTurnoInput     = z.infer<typeof cierreTurnoSchema>;
