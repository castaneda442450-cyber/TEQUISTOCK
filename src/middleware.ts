import { type NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/productos", "/proveedores", "/compras", "/salidas", "/reportes"];
const SESSION_COOKIE = "tequistock_session";
const SESSION_VALUE = "carlos_nieto_authenticated";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE);
  const isAuthed = session?.value === SESSION_VALUE;

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

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
