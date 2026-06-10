import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PROTECTED = ["/dashboard", "/productos", "/proveedores", "/compras", "/salidas", "/reportes"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Pass a mutable response into the client so refreshed session cookies
  // are written back to the browser on every request.
  const response = NextResponse.next({ request });

  const supabase = createMiddlewareClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = !!user;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (pathname === "/") {
    const redirect = NextResponse.redirect(new URL(isAuthed ? "/dashboard" : "/login", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }

  if (isProtected && !isAuthed) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }

  if (pathname === "/login" && isAuthed) {
    const redirect = NextResponse.redirect(new URL("/dashboard", request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c.name, c.value));
    return redirect;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
