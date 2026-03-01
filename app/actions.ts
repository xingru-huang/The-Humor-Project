"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

type SubmitVoteResult = {
  vote: number | null;
  error?: string;
};

export async function submitVote(
  captionId: string,
  voteValue: number
): Promise<SubmitVoteResult> {
  if (voteValue !== 1 && voteValue !== -1) {
    return { vote: null, error: "Invalid vote value." };
  }

  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { vote: null, error: "Please sign in to vote." };
    }

    // SELECT from caption_votes WHERE profile_id = user.id AND caption_id = captionId
    const { data: existing, error: existingError } = await supabase
      .from("caption_votes")
      .select("id, vote_value")
      .eq("profile_id", user.id)
      .eq("caption_id", captionId)
      .maybeSingle();

    if (existingError) {
      return { vote: null, error: "Failed to load your existing vote." };
    }

    if (existing) {
      if (existing.vote_value === voteValue) {
        const { error: deleteError } = await supabase
          .from("caption_votes")
          .delete()
          .eq("id", existing.id);
        if (deleteError) {
          return { vote: existing.vote_value, error: "Failed to remove vote." };
        }
      } else {
        const { error: updateError } = await supabase
          .from("caption_votes")
          .update({
            vote_value: voteValue,
            modified_datetime_utc: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (updateError) {
          return { vote: existing.vote_value, error: "Failed to update vote." };
        }
      }
    } else {
      const { error: insertError } = await supabase.from("caption_votes").insert({
        vote_value: voteValue,
        profile_id: user.id,
        caption_id: captionId,
        created_datetime_utc: new Date().toISOString(),
        modified_datetime_utc: new Date().toISOString(),
      });
      if (insertError) {
        return { vote: null, error: "Failed to save vote." };
      }
    }

    // Confirm the vote state from database
    // SELECT from caption_votes WHERE profile_id = user.id AND caption_id = captionId
    const { data: confirmed, error: confirmError } = await supabase
      .from("caption_votes")
      .select("vote_value")
      .eq("profile_id", user.id)
      .eq("caption_id", captionId)
      .maybeSingle();

    if (confirmError) {
      return { vote: null, error: "Failed to confirm vote state." };
    }

    return { vote: confirmed?.vote_value ?? null };
  } catch {
    return { vote: null, error: "Unexpected error while saving vote." };
  }
}
