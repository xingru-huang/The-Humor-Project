import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedPath =
    pathname === "/vote" ||
    pathname.startsWith("/vote/") ||
    pathname === "/upload" ||
    pathname.startsWith("/upload/");

  try {
    const { supabase, response } = updateSession(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtectedPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (user && pathname === "/login") {
      return response;
    }

    return response;
  } catch {
    if (isProtectedPath) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
