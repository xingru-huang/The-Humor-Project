import Link from "next/link";
import { signOut } from "@/app/actions";

type NavHeaderProps = {
  email: string;
  active?: "gallery" | "vote";
};

export default function NavHeader({ email, active }: NavHeaderProps) {
  const links = [
    { href: "/", label: "Gallery", key: "gallery" as const },
    { href: "/vote", label: "Rate", key: "vote" as const },
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
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-[10px] font-bold text-white">
              {email[0].toUpperCase()}
            </div>
            <span className="text-sm text-zinc-500">{email}</span>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-zinc-200 px-4 py-1.5 text-[13px] font-medium text-zinc-500 transition-all duration-200 hover:border-zinc-400 hover:text-zinc-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
