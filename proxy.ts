import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";

export async function proxy(request: NextRequest) {
  try {
    const { supabase, response } = updateSession(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    if (!user && pathname !== "/login" && !pathname.startsWith("/auth")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (user && pathname === "/login") {
      return response;
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
