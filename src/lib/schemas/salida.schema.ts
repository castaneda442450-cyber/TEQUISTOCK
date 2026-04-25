import { z } from "zod";
import { MERMA_TYPES } from "@/lib/constants";

export const consumoSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().positive("Cantidad debe ser positiva"),
  notes: z.string().optional(),
});

export const mermaSchema = z.object({
  product_id: z.string().uuid(),
  qty: z.number().positive("Cantidad debe ser positiva"),
  motivo_merma: z.enum(MERMA_TYPES as [string, ...string[]]),
  notes: z.string().optional(),
});

export type ConsumoInput = z.infer<typeof consumoSchema>;
export type MermaInput = z.infer<typeof mermaSchema>;
