import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import NavHeader from "@/app/nav-header";
import VoteCarousel from "@/app/vote-carousel";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";


export default async function VotePage() {
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

  if (!user) {
    redirect("/login");
  }

  const { data: captionRows } = await supabase
    .from("captions")
    .select(
      "id, content, image_id, image:images!captions_image_id_fkey(url), profile:profiles!captions_profile_id_fkey(first_name,last_name)"
    )
    .not("image_id", "is", null);

  const captions = (captionRows ?? [])
    .map((row) => {
      const image = Array.isArray(row.image) ? row.image[0] : row.image ?? null;
      const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile ?? null;
      const name = profile
        ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
        : "";

      return {
        id: row.id as string,
        content: (row.content ?? "") as string,
        imageUrl: (image?.url ?? null) as string | null,
        author: name || "Anonymous",
      };
    })
    .filter((c): c is typeof c & { imageUrl: string } => c.imageUrl !== null);

  const [{ data: userVotes }, { data: allVotes }] = await Promise.all([
    supabase
      .from("caption_votes")
      .select("caption_id, vote_value, created_datetime_utc")
      .eq("profile_id", user.id)
      .order("created_datetime_utc", { ascending: false }),
    supabase
      .from("caption_votes")
      .select("caption_id, vote_value"),
  ]);

  const initialVotes: Record<string, number> = {};
  const voteOrder: string[] = [];
  for (const v of userVotes ?? []) {
    initialVotes[v.caption_id] = v.vote_value;
    voteOrder.push(v.caption_id);
  }

  const voteStats: Record<string, { up: number; down: number; total: number }> = {};
  for (const v of allVotes ?? []) {
    if (!voteStats[v.caption_id]) {
      voteStats[v.caption_id] = { up: 0, down: 0, total: 0 };
    }
    if (v.vote_value === 1) voteStats[v.caption_id].up++;
    else if (v.vote_value === -1) voteStats[v.caption_id].down++;
    voteStats[v.caption_id].total++;
  }

  return (
    <div className="min-h-screen">
      <NavHeader email={user.email ?? "Unknown"} active="vote" />

      <main className="mx-auto w-full max-w-6xl px-6 pb-20 pt-10">
        <VoteCarousel
          captions={captions}
          initialVotes={initialVotes}
          initialVoteOrder={voteOrder}
          voteStats={voteStats}
        />
      </main>
    </div>
  );
}
