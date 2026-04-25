"use server";

import { loginSchema } from "@/lib/schemas/auth.schema";
import { checkRateLimit } from "@/lib/ratelimit";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

// ─── Credenciales únicas autorizadas ─────────────────────────────────────────
const AUTHORIZED_USER = "Carlos Nieto";
const AUTHORIZED_PASSWORD = "TequilaMexicanStock";
const SESSION_COOKIE = "tequistock_session";
const SESSION_VALUE = "carlos_nieto_authenticated";

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

    // Validación estricta: solo Carlos Nieto + TequilaMexicanStock
    const usernameOk = parsed.data.username.trim() === AUTHORIZED_USER;
    const passwordOk = parsed.data.password === AUTHORIZED_PASSWORD;

    if (!usernameOk || !passwordOk) {
      return { error: "Usuario o contraseña incorrectos" };
    }

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    });

    return { data: { user: { username: AUTHORIZED_USER } } };
  } catch {
    return { error: "Error al iniciar sesión" };
  }
}

export async function signOut() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE);
  } catch {
    // ignore
  }
  redirect("/login");
}

export async function getSession() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(SESSION_COOKIE);
    if (session?.value === SESSION_VALUE) {
      return { user: { username: AUTHORIZED_USER } };
    }
    return { user: null };
  } catch {
    return { user: null };
  }
}
