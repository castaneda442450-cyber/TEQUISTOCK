"use server";

import { loginSchema } from "@/lib/schemas/auth.schema";
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
      return { error: "Demasiados intentos. Intenta más tarde." };
    }

    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return { error: "Email o contraseña inválidos" };
    }

    return { data };
  } catch (error) {
    console.error("Sign in error:", error);
    return { error: "Error al iniciar sesión" };
  }
}

export async function signOut() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { error: "Error al cerrar sesión" };
  }
}

export async function getSession() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { user };
  } catch (error) {
    return { user: null };
  }
}
