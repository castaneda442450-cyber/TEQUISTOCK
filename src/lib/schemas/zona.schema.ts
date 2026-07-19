import { z } from "zod";

export const zonaSchema = z.object({
  nombre:      z.string().min(2, "Mínimo 2 caracteres").max(50),
  descripcion: z.string().max(200).optional(),
  color:       z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color hex inválido"),
  icono:       z.string().min(1),
});

export const conteoZonaItemSchema = z.object({
  product_id:       z.string().uuid(),
  cantidad_contada: z.number().min(0),
});

// total_productos = cuántos productos se mostraron en el Paso 2 (de
// getProductosDeZona), no solo los que trae `items` — permite calcular
// sin_contar en el action sin una query extra.
export const conteoZonaSchema = z.object({
  zona_id:         z.string().uuid(),
  frecuencia:      z.enum(["diario", "semanal", "mensual"]),
  items:           z.array(conteoZonaItemSchema).min(1).max(200),
  total_productos: z.number().int().min(1),
});

export type ZonaInput          = z.infer<typeof zonaSchema>;
export type ConteoZonaItemInput = z.infer<typeof conteoZonaItemSchema>;
export type ConteoZonaInput    = z.infer<typeof conteoZonaSchema>;
