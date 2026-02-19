"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function submitVote(captionId: string, voteValue: number) {
  if (voteValue !== 1 && voteValue !== -1) return { vote: null };

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { vote: null };

  // SELECT from caption_votes WHERE profile_id = user.id AND caption_id = captionId
  const { data: existing } = await supabase
    .from("caption_votes")
    .select("id, vote_value")
    .eq("profile_id", user.id)
    .eq("caption_id", captionId)
    .maybeSingle();

  if (existing) {
    if (existing.vote_value === voteValue) {
      await supabase.from("caption_votes").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("caption_votes")
        .update({
          vote_value: voteValue,
          modified_datetime_utc: new Date().toISOString(),
        })
        .eq("id", existing.id);
    }
  } else {
    await supabase.from("caption_votes").insert({
      vote_value: voteValue,
      profile_id: user.id,
      caption_id: captionId,
      created_datetime_utc: new Date().toISOString(),
      modified_datetime_utc: new Date().toISOString(),
    });
  }

  // Confirm the vote state from database
  // SELECT from caption_votes WHERE profile_id = user.id AND caption_id = captionId
  const { data: confirmed } = await supabase
    .from("caption_votes")
    .select("vote_value")
    .eq("profile_id", user.id)
    .eq("caption_id", captionId)
    .maybeSingle();

  return { vote: confirmed?.vote_value ?? null };
}
