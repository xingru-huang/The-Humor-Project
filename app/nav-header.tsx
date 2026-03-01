import Link from "next/link";
import { signOut } from "@/app/actions";

type NavHeaderProps = {
  email?: string | null;
  active?: "gallery" | "vote" | "upload";
};

export default function NavHeader({ email, active }: NavHeaderProps) {
  const isAuthenticated = Boolean(email);

  const links = [
    { href: "/", label: "Gallery", key: "gallery" as const },
    ...(isAuthenticated
      ? [
          { href: "/vote", label: "Rate", key: "vote" as const },
          { href: "/upload", label: "Upload", key: "upload" as const },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-black/[0.04] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-lg tracking-tight text-zinc-900">
            The Humor Project
          </Link>
          <nav className="hidden items-center gap-4 sm:flex">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`text-[13px] transition-colors ${
                  active === link.key
                    ? "font-semibold text-zinc-900"
                    : "font-medium text-zinc-400 hover:text-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <div className="group relative">
                <button
                  type="button"
                  className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white shadow-sm shadow-zinc-900/20"
                  aria-label="Show account email"
                >
                  {email?.[0]?.toUpperCase() ?? "U"}
                </button>
                <div className="pointer-events-none absolute right-2 top-1/2 z-0 -translate-y-1/2 translate-x-1 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100">
                  <div className="max-w-64 truncate rounded-full border border-zinc-200/90 bg-white/95 px-3 py-1.5 pr-7 text-xs text-zinc-600 shadow-md shadow-zinc-900/[0.08] backdrop-blur-sm">
                    {email}
                  </div>
                </div>
              </div>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-200 px-4 py-1.5 text-[13px] font-medium text-zinc-500 transition-all duration-200 hover:border-zinc-400 hover:text-zinc-900"
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-[13px] font-medium text-zinc-500 transition-all duration-200 hover:border-zinc-400 hover:text-zinc-900"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
