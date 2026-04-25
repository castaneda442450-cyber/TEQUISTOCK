import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as CookieOptions)
          );
        },
      },
    }
  );

  // Refrescar sesión
  await supabase.auth.getUser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/auth");
  const isDashboardRoute = request.nextUrl.pathname.startsWith("/(dashboard)");

  // Si no hay usuario y trata de acceder a dashboard → login
  if (!user && isDashboardRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Si hay usuario y trata de acceder a login → dashboard
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Si trata de acceder a / → redirect a dashboard o login
  if (request.nextUrl.pathname === "/") {
    return NextResponse.redirect(
      new URL(user ? "/dashboard" : "/auth/login", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
