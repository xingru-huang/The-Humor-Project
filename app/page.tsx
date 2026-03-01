import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import ClickableImage from "@/app/clickable-image";
import NavHeader from "@/app/nav-header";

const PAGE_SIZE = 12;

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  noStore();

  let supabase;

  try {
    supabase = await createSupabaseServerClient();
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

  const sp = (await searchParams) ?? {};
  const pageParam = sp.page;
  const page = Math.max(
    1,
    Number(Array.isArray(pageParam) ? pageParam[0] : pageParam) || 1
  );

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("captions")
      .select(
        "id, content, like_count, created_datetime_utc, image_id, image:images!captions_image_id_fkey(url), profile:profiles!captions_profile_id_fkey(first_name,last_name)"
      )
      .order("like_count", { ascending: false, nullsFirst: false })
      .order("id", { ascending: false })
      .range(from, to),
    supabase.from("captions").select("*", { count: "exact", head: true }),
  ]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Something went wrong. Try refreshing.</p>
      </div>
    );
  }

  const rows = (data ?? []).map((row) => {
    const image = Array.isArray(row.image) ? row.image[0] : row.image ?? null;
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile ?? null;
    return { ...row, image, profile };
  });

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);

  return (
    <div className="min-h-screen">
      <NavHeader email={user?.email ?? null} active="gallery" />

      <main key={page} className="mx-auto w-full max-w-6xl px-6 pb-20 pt-12">
        {page === 1 && (
          <div className="animate-fade-up mb-14 text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-400">
              Curated laughs
            </p>
            <h2 className="font-display mt-3 text-3xl tracking-tight text-zinc-900 sm:text-4xl">
              Humor Cards
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
              A hand-picked collection of the internet&apos;s finest humor,
              ranked by the people who know funny
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row, index) => {
            const src = row.image?.url ?? null;
            const caption = row.content ?? "";
            const likeCount = row.like_count ?? 0;
            const alt = caption;

            const name = row.profile
              ? `${row.profile.first_name ?? ""} ${row.profile.last_name ?? ""}`.trim()
              : "";
            const author = name || "Anonymous";

            const created = row.created_datetime_utc
              ? new Date(row.created_datetime_utc).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })
              : null;

            return (
              <article
                key={row.id}
                className="animate-card-in group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-zinc-900/[0.06]"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {src ? (
                  <ClickableImage src={src} alt={alt} />
                ) : (
                  <div className="flex aspect-4/3 items-center justify-center bg-zinc-50 font-mono text-xs text-zinc-400">
                    no image
                  </div>
                )}

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-[15px] font-semibold leading-snug text-zinc-900">
                    {caption}
                  </h3>

                  <div className="mt-auto flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-500">
                        {author[0].toUpperCase()}
                      </div>
                      <span className="text-xs text-zinc-500">{author}</span>
                    </div>
                    <span className="text-[11px] text-zinc-400">{created}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 border-t border-zinc-100 pt-3">
                    <svg
                      className="h-3.5 w-3.5 text-zinc-400 transition-colors group-hover:text-rose-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                    <span className="font-mono text-xs text-zinc-500">{likeCount}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {totalPages > 1 && (
          <nav className="mt-14 flex items-center justify-center gap-2">
            <Link
              prefetch={false}
              scroll={false}
              href={`/?page=${prevPage}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-500 transition-all hover:border-zinc-400 hover:text-zinc-900 ${
                page <= 1 ? "pointer-events-none opacity-30" : ""
              }`}
              aria-label="Previous page"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>

            <div className="flex items-center gap-1 px-2">
              <span className="font-mono text-sm text-zinc-900">{page}</span>
              <span className="font-mono text-sm text-zinc-400">/</span>
              <span className="font-mono text-sm text-zinc-400">{totalPages}</span>
            </div>

            <Link
              prefetch={false}
              scroll={false}
              href={`/?page=${nextPage}`}
              className={`flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-sm text-zinc-500 transition-all hover:border-zinc-400 hover:text-zinc-900 ${
                page >= totalPages ? "pointer-events-none opacity-30" : ""
              }`}
              aria-label="Next page"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </nav>
        )}

        <footer className="mt-16 border-t border-zinc-200/60 pt-8 text-center">
          <p className="font-mono text-[11px] text-zinc-400">
            built for giggles
          </p>
        </footer>
      </main>
    </div>
  );
}
