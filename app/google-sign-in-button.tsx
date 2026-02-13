"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type GoogleSignInButtonProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export default function GoogleSignInButton({
  supabaseUrl,
  supabaseAnonKey,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const onSignIn = async () => {
    setLoading(true);

    const supabase = createSupabaseBrowserClient(
      supabaseUrl,
      supabaseAnonKey
    );

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <button
      type="button"
      onClick={onSignIn}
      disabled={loading}
      className="group relative inline-flex items-center justify-center gap-2 whitespace-nowrap overflow-hidden rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-medium text-black/80 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-black/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(0,0,0,0.08),transparent_65%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width="18"
        height="18"
        aria-hidden="true"
      >
        <path fill="#EA4335" d="M24 9.5c3.3 0 6.3 1.1 8.6 3.2l6.4-6.4C34.6 2.4 29.7 0 24 0 14.8 0 6.8 5.5 2.9 13.4l7.7 6C12.4 13.2 17.7 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.6H24v9h12.4c-.5 2.7-2 5-4.3 6.6l6.6 5.1c3.9-3.6 6.2-8.9 6.2-16.1z" />
        <path fill="#FBBC05" d="M10.6 28.4c-.5-1.4-.8-2.9-.8-4.4s.3-3 .8-4.4l-7.7-6C1 17.3 0 20.5 0 24s1 6.7 2.9 9.4l7.7-6z" />
        <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-6.6-5.1c-1.8 1.2-4.1 2-7.4 2-6.3 0-11.6-3.7-13.4-8.9l-7.7 6C6.8 42.5 14.8 48 24 48z" />
      </svg>

      <span className="relative">{loading ? "Redirecting..." : "Sign In with Google"}</span>

      {loading ? (
        <span
          className="relative h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}
