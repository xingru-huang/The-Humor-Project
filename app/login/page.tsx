import { unstable_noStore as noStore } from "next/cache";
import GoogleSignInButton from "@/app/google-sign-in-button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseConfig } from "@/lib/supabase-config";
import { signOut } from "@/app/actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function LoginPage() {
  noStore();

  let supabase;
  let config;

  try {
    supabase = await createSupabaseServerClient();
    config = getSupabaseConfig();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Service unavailable</p>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[600px] w-[600px] rounded-full bg-gradient-to-br from-zinc-200/60 via-transparent to-zinc-300/40 blur-3xl" />
      </div>

      <div className="pointer-events-none absolute -right-12 top-16 select-none text-[8rem] font-bold leading-none text-zinc-900/[0.03] sm:text-[12rem]">
        ha.
      </div>
      <div className="pointer-events-none absolute -left-8 bottom-20 select-none text-[6rem] font-bold leading-none text-zinc-900/[0.03] sm:text-[10rem]">
        lol
      </div>

      <div className="animate-fade-up relative w-full max-w-sm">
        <div className="pointer-events-none absolute -right-6 -top-10 select-none animate-float text-4xl opacity-20">
          ;)
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/80 px-8 py-12 text-center shadow-xl shadow-zinc-900/[0.04] backdrop-blur-xl sm:px-10 sm:py-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-400">
            Private collection
          </p>

          <h1 className="font-display mt-6 text-4xl leading-[1.1] tracking-tight text-zinc-900 sm:text-5xl">
            The Humor
            <br />
            Project
          </h1>

          <p className="mt-5 text-[13px] leading-relaxed text-zinc-500">
            Where laughter needs a password.
          </p>

          <div className="mt-10">
            {user ? (
              <div className="flex flex-col items-center gap-5">
                <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-4 py-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
                    {(user.email ?? "U")[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-zinc-600">{user.email}</span>
                </div>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="rounded-full border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-600 transition-all duration-200 hover:border-zinc-400 hover:text-zinc-900"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            ) : (
              <GoogleSignInButton
                supabaseUrl={config.supabaseUrl}
                supabaseAnonKey={config.supabaseAnonKey}
              />
            )}
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[11px] text-zinc-400">
          curated absurdity since 2025
        </p>
      </div>
    </div>
  );
}
