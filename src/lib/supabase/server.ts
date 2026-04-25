import { createServerClient as createSupabaseClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

let cachedClient: any = null;

export async function createServerClient() {
  if (cachedClient) return cachedClient;

  const cookieStore = await cookies();

  cachedClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {
            // Ignorar en Server Components sin cookies
          }
        },
      },
    }
  );

  return cachedClient;
}
