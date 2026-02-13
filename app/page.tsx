import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import GoogleSignInButton from "@/app/google-sign-in-button";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseConfig } from "@/lib/supabase-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home() {
  noStore();

  let supabase;
  let config;

  try {
    supabase = await createSupabaseServerClient();
    config = getSupabaseConfig();
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black">
        <h1 className="text-2xl font-semibold">Supabase client not initialized</h1>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f7f5] text-black">
      <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] [background-size:24px_24px]" />
      <div className="pointer-events-none absolute -left-20 top-24 h-56 w-56 rounded-full bg-black/[0.05] blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-20 h-72 w-72 rounded-full bg-black/[0.06] blur-3xl" />

      <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-16 sm:py-20">
        <section className="soft-pop relative w-full max-w-2xl">
          <div className="absolute inset-0 -rotate-1 rounded-[2rem] border border-black/10 bg-[#f3f1ec]" />
          <div className="relative rounded-[2rem] border border-black/10 bg-white/92 px-8 py-10 text-center shadow-[0_40px_70px_-54px_rgba(0,0,0,0.8)] backdrop-blur sm:px-12 sm:py-12">

            <p className="text-xs uppercase tracking-[0.28em] text-black/45">Private access</p>
            <h1 className="font-display mt-5 text-5xl leading-[1.02] tracking-tight sm:text-6xl">
              The Humor
              <br />
              Project
            </h1>
            <div className="mx-auto mt-5 h-px w-20 bg-black/20" />
            <p className="mt-4 text-sm text-black/55">Serious auth. Silly content.</p>

            <div className="mt-8 flex items-center justify-center">
              {user ? (
                <Link
                  href="/protected"
                  className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black/80"
                >
                  Enter Protected Feed
                </Link>
              ) : (
                <GoogleSignInButton
                  supabaseUrl={config.supabaseUrl}
                  supabaseAnonKey={config.supabaseAnonKey}
                />
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
