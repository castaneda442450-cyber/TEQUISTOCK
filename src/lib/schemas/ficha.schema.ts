import { z } from "zod";

const ingredienteSchema = z.object({
  producto_id: z.string().uuid("Selecciona un producto válido"),
  qty_por_porcion: z.number().positive("La cantidad debe ser mayor a 0"),
});

export const nuevoPlatilloSchema = z
  .object({
    platillo_nombre: z
      .string()
      .min(2, "Nombre mínimo 2 caracteres")
      .max(100, "Nombre máximo 100 caracteres"),
    ingredientes: z
      .array(ingredienteSchema)
      .min(1, "Agrega al menos un ingrediente"),
  })
  .refine(
    (data) => {
      const ids = data.ingredientes.map((i) => i.producto_id);
      return new Set(ids).size === ids.length;
    },
    {
      message: "No puedes agregar el mismo ingrediente dos veces",
      path: ["ingredientes"],
    }
  );

export type NuevoPlatilloInput = z.infer<typeof nuevoPlatilloSchema>;
