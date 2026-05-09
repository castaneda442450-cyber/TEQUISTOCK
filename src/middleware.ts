import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";

const PROTECTED = ["/dashboard", "/productos", "/proveedores", "/compras", "/salidas", "/reportes"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  const supabase = createMiddlewareClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthed = !!user;

  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (pathname === "/") {
    return NextResponse.redirect(new URL(isAuthed ? "/dashboard" : "/login", request.url));
  }

  if (isProtected && !isAuthed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/login" && isAuthed) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
