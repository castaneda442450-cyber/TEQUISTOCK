import { z } from "zod";

export const detalleOrdenSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().positive("Cantidad debe ser positiva"),
  price: z.number().positive("Precio debe ser positivo"),
});

export const ordenSchema = z.object({
  supplier_id: z.string().uuid(),
  fecha: z.string().min(1, "Fecha requerida"),
  detalles: z.array(detalleOrdenSchema).min(1, "Mínimo un detalle"),
  has_invoice: z.boolean().optional().default(false),
  invoice_url: z.string().nullable().optional(),
  folio: z.string().optional(),
});

export const updateOrdenSchema = ordenSchema.partial({
  supplier_id: true,
  fecha: true,
  detalles: true,
});

export type OrdenInput = z.infer<typeof ordenSchema>;
export type UpdateOrdenInput = z.infer<typeof updateOrdenSchema>;
export type DetalleOrdenInput = z.infer<typeof detalleOrdenSchema>;
