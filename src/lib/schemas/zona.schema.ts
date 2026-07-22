import { z } from "zod";

export const zonaSchema = z.object({
  nombre:      z.string().min(2, "Mínimo 2 caracteres").max(50),
  descripcion: z.string().max(200).optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido"),
  icono:       z.string().min(1),
});

export const conteoMultiZonaTotalSchema = z.object({
  product_id:   z.string().uuid(),
  total_fisico: z.number().min(0),
});

// totales = un total_fisico por producto, ya sumado por el cliente a través
// de todas las zonas visitadas en la sesión.
export const conteoMultiZonaSchema = z
  .object({
    frecuencia: z.enum(["diario", "semanal", "mensual"]),
    totales:    z.array(conteoMultiZonaTotalSchema).min(1).max(500),
  })
  .refine(
    (data) => new Set(data.totales.map((t) => t.product_id)).size === data.totales.length,
    { message: "product_id duplicado en totales" },
  );

export type ZonaInput               = z.infer<typeof zonaSchema>;
export type ConteoMultiZonaTotalInput = z.infer<typeof conteoMultiZonaTotalSchema>;
export type ConteoMultiZonaInput      = z.infer<typeof conteoMultiZonaSchema>;
