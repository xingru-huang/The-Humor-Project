import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase-config";

const AUTH_EXEMPT_PATHS = new Set(["/login", "/auth/callback"]);

function isProtectedPath(pathname: string) {
  return (
    pathname === "/vote" ||
    pathname.startsWith("/vote/") ||
    pathname === "/upload" ||
    pathname.startsWith("/upload/")
  );
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (AUTH_EXEMPT_PATHS.has(request.nextUrl.pathname)) {
      return supabaseResponse;
    }

    if (isProtectedPath(request.nextUrl.pathname) && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    return supabaseResponse;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
