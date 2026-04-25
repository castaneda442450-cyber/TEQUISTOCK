"use server";

import { loginSchema, registerSchema } from "@/lib/schemas/auth.schema";
import { createServerClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/ratelimit";
import { headers } from "next/headers";
import { z } from "zod";

export async function signIn(input: z.infer<typeof loginSchema>) {
  try {
    const parsed = loginSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Datos inválidos", issues: parsed.error.flatten() };
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";

    const rateLimit = await checkRateLimit(ip);
    if (!rateLimit.success) {
      return { error: "Demasiados intentos. Intenta de nuevo en 15 minutos." };
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { error: "Correo o contraseña incorrectos" };
    }

    return { data };
  } catch {
    return { error: "Error al iniciar sesión" };
  }
}

export async function signUp(input: z.infer<typeof registerSchema>) {
  try {
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      return { error: "Datos inválidos", issues: parsed.error.flatten() };
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { error: "Este correo ya está registrado" };
      }
      return { error: error.message };
    }

    return { data };
  } catch {
    return { error: "Error al crear la cuenta" };
  }
}

export async function signOut() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch {
    return { error: "Error al cerrar sesión" };
  }
}

export async function getSession() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    return { user };
  } catch {
    return { user: null };
  }
}
