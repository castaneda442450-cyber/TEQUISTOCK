import { z } from "zod";

export const porcionConfigSchema = z.object({
  product_id: z.string().uuid(),
  porcion_size: z.number().positive("El tamaño de porción debe ser mayor a 0"),
  porcion_unit: z.string().min(1, "Unidad requerida"),
  min_porciones: z.number().int().min(0, "No puede ser negativo"),
  merma_alerta_pct: z
    .number()
    .min(0, "No puede ser negativo")
    .max(100, "Máximo 100%"),
});

export const registrarPorcionadoSchema = z.object({
  product_id: z.string().uuid(),
  cantidad_usada: z.number().positive("La cantidad debe ser mayor a 0"),
  unidad_usada: z.string().min(1, "Unidad requerida"),
  porciones_obtenidas: z
    .number()
    .int("Debe ser un número entero")
    .positive("Debe obtener al menos 1 porción"),
  porcion_size_real: z.number().positive("El tamaño de porción debe ser mayor a 0"),
  porcion_unit: z.string().min(1, "Unidad requerida"),
  notas: z.string().optional(),
});

export type PorcionConfigInput = z.infer<typeof porcionConfigSchema>;
export type RegistrarPorcionadoInput = z.infer<typeof registrarPorcionadoSchema>;
