import { z } from "zod";

export const categoriaSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre mínimo 2 caracteres").max(40, "Máximo 40 caracteres"),
  color: z.string().regex(/^#([0-9A-Fa-f]{6})$/, "Color hex inválido (formato #RRGGBB)"),
});

export type CategoriaInput = z.infer<typeof categoriaSchema>;
