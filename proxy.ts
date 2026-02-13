import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase-middleware";

export async function proxy(request: NextRequest) {
  if (!request.nextUrl.pathname.startsWith("/protected")) {
    return NextResponse.next();
  }

  try {
    const { supabase, response } = updateSession(request);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/protected/:path*"],
};
