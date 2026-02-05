import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { supabase } from "@/lib/supabase";

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

  if (!supabase) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white text-black">
          <h1 className="text-2xl font-semibold">Supabase client not initialized</h1>
        </div>
    );
  }

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
        <div className="flex min-h-screen items-center justify-center bg-white text-black">
          <h1 className="text-2xl font-semibold">Failed to load images.</h1>
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
      <div className="min-h-screen bg-[#f7f7f5] text-black">
        <main key={page} className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-black/45">
              Curated humor
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              The Humor Project
            </h1>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((row) => {
              const src = row.image?.url ?? null;
              const caption = row.content ?? "";
              const likeCount = row.like_count ?? 0;
              const alt = caption;

              const name = row.profile
                  ? `${row.profile.first_name ?? ""} ${row.profile.last_name ?? ""}`.trim()
                  : "";
              const author = name || "Unknown";

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
                      className="flex flex-col overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm transition-shadow hover:shadow-md"
                  >
                    {src ? (
                        <img
                            src={src}
                            alt={alt}
                            className="aspect-4/3 w-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="flex aspect-4/3 items-center justify-center bg-black/5 text-sm text-black/50">
                          No image
                        </div>
                    )}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <h2 className="text-lg font-semibold leading-7">{caption}</h2>
                      <div className="mt-auto flex items-center justify-between text-xs text-black/55">
                        <span>{author}</span>
                        <span>{created ?? "Date unknown"}</span>
                      </div>
                      <div className="text-xs text-black/55">Likes {likeCount}</div>
                    </div>
                  </article>
              );
            })}
          </div>

          <div className="mt-10 flex items-center justify-center gap-4 text-sm text-black/70">
            <Link
                prefetch={false}
                scroll={false}
                href={`/?page=${prevPage}`}
                className={`rounded-full border border-black/10 px-4 py-2 transition-colors hover:border-black/30 ${
                    page <= 1 ? "pointer-events-none opacity-40" : ""
                }`}
            >
              Previous
            </Link>

            <span className="text-xs uppercase tracking-[0.2em] text-black/45">
            Page {page} of {totalPages}
          </span>

            <Link
                prefetch={false}
                scroll={false}
                href={`/?page=${nextPage}`}
                className={`rounded-full border border-black/10 px-4 py-2 transition-colors hover:border-black/30 ${
                    page >= totalPages ? "pointer-events-none opacity-40" : ""
                }`}
            >
              Next
            </Link>
          </div>
        </main>
      </div>
  );
}
