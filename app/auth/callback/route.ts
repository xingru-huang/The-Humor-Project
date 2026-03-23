import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase-config";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("error", "auth_failed");

  if (!code) {
    return NextResponse.redirect(loginUrl);
  }

  try {
    const cookieStore = await cookies();
    const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}
