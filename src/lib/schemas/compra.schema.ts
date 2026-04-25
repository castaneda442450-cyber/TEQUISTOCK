import { z } from "zod";

export const detalleOrdenSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().positive("Cantidad debe ser positiva"),
  price: z.number().positive("Precio debe ser positivo"),
});

export const ordenSchema = z.object({
  supplier_id: z.string().uuid(),
  fecha: z.string().datetime().or(z.date()),
  detalles: z.array(detalleOrdenSchema).min(1, "Mínimo un detalle"),
  has_invoice: z.boolean().optional().default(false),
  invoice_url: z.string().optional(),
});

export type OrdenInput = z.infer<typeof ordenSchema>;
export type DetalleOrdenInput = z.infer<typeof detalleOrdenSchema>;
