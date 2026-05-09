"use server";

import { loginSchema } from "@/lib/schemas/auth.schema";
import { checkRateLimit } from "@/lib/ratelimit";
import { createServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
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
      email: parsed.data.username,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      return { error: "Usuario o contraseña incorrectos" };
    }

    return { data: { user: { username: data.user.email ?? "" } } };
  } catch {
    return { error: "Error al iniciar sesión" };
  }
}

export async function signOut() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  redirect("/login");
}

export async function getSession() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return { user: { username: user.email ?? "" } };
    }
    return { user: null };
  } catch {
    return { user: null };
  }
}
