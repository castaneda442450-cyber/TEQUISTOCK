import { z } from "zod";

// Schema used for form validation (all fields present)
export const productoFormSchema = z.object({
  nombre: z.string().min(2, "Nombre mínimo 2 caracteres"),
  categoria_id: z.string().uuid("Categoría inválida"),
  unidad: z.string().min(1, "Unidad requerida"),
  stock_minimo: z.number().int().min(0, "Stock mínimo no puede ser negativo"),
  last_price: z.number().min(0, "Precio no puede ser negativo"),
  frecuencia_conteo: z.enum(["diario", "semanal", "mensual"]),
  supplier_ids: z.array(z.string().uuid()),
});

// Schema used for server-action validation (tolerates optional/undefined)
export const productoSchema = z.object({
  nombre: z.string().min(2, "Nombre mínimo 2 caracteres"),
  categoria_id: z.string().uuid("Categoría inválida"),
  unidad: z.string().min(1, "Unidad requerida"),
  stock_minimo: z.number().int().min(0, "Stock mínimo no puede ser negativo"),
  last_price: z.number().min(0, "Precio no puede ser negativo"),
  frecuencia_conteo: z.enum(["diario", "semanal", "mensual"]),
  supplier_ids: z.array(z.string().uuid()).optional().default([]),
});

export type ProductoFormValues = z.infer<typeof productoFormSchema>;
export type ProductoInput = z.infer<typeof productoSchema>;
