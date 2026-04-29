import { z } from "zod";

// Schema used for form validation (all fields present, optional ones default to empty)
export const proveedorFormSchema = z.object({
  company: z.string().trim().min(2, "Nombre de empresa requerido"),
  contact: z.string().trim(),
  email: z.union([
    z.string().trim().email("Email inválido"),
    z.literal(""),
  ]),
  phone: z.string().trim(),
  address: z.string().trim(),
  producto_ids: z.array(z.string()),
});

// Schema used for server-action validation (tolerates optional/undefined)
export const proveedorSchema = z.object({
  company: z.string().trim().min(2, "Nombre de empresa requerido"),
  contact: z.string().trim().optional().default(""),
  email: z.union([
    z.string().trim().email("Email inválido"),
    z.literal(""),
  ]).optional().default(""),
  phone: z.string().trim().optional().default(""),
  address: z.string().trim().optional().default(""),
  producto_ids: z.array(z.string()).optional().default([]),
});

export type ProveedorFormValues = z.infer<typeof proveedorFormSchema>;
export type ProveedorInput = z.infer<typeof proveedorSchema>;
