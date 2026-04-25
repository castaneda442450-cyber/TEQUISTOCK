import { z } from "zod";

export const proveedorSchema = z.object({
  company: z.string().min(2, "Nombre mínimo 2 caracteres"),
  contact: z.string().min(2, "Contacto requerido"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
});

export type ProveedorInput = z.infer<typeof proveedorSchema>;
