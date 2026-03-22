import { unstable_noStore as noStore } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getSupabaseConfig } from "@/lib/supabase-config";
import NavHeader from "@/app/nav-header";
import UploadForm from "@/app/upload/upload-form";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function UploadPage() {
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

  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();

  // Fetch user's most recent caption to find their latest uploaded image
  const { data: latestCaption } = await supabase
    .from("captions")
    .select(
      "image_id, image:images!captions_image_id_fkey(url)"
    )
    .eq("profile_id", user.id)
    .not("image_id", "is", null)
    .order("created_datetime_utc", { ascending: false })
    .limit(1)
    .maybeSingle();

  let initialImageUrl: string | null = null;
  let initialCaptions: { id: string; content: string }[] = [];

  if (latestCaption?.image_id) {
    const image = Array.isArray(latestCaption.image)
      ? latestCaption.image[0]
      : latestCaption.image ?? null;
    initialImageUrl = image?.url ?? null;

    if (initialImageUrl) {
      // Fetch all captions for this image by this user
      const { data: captionRows } = await supabase
        .from("captions")
        .select("id, content")
        .eq("image_id", latestCaption.image_id)
        .eq("profile_id", user.id);

      initialCaptions = (captionRows ?? []).map((c) => ({
        id: c.id,
        content: c.content ?? "",
      }));
    }
  }

  return (
    <div className="min-h-screen">
      <NavHeader email={user.email ?? "Unknown"} active="upload" />

      <main className="mx-auto w-full max-w-2xl px-6 pb-20 pt-12">
        <div className="animate-fade-up mb-10 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-zinc-400">
            AI-powered
          </p>
          <h2 className="font-display mt-3 text-3xl tracking-tight text-zinc-900 sm:text-4xl">
            Caption Generator
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-zinc-500">
            Upload an image and let AI generate witty captions for you
          </p>
        </div>

        <UploadForm
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
          initialImageUrl={initialImageUrl}
          initialCaptions={initialCaptions}
        />
      </main>
    </div>
  );
}
