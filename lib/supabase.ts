import { createClient } from "@supabase/supabase-js";

const projectId = process.env.SUPABASE_PROJECT_ID;
const anonKey = process.env.SUPABASE_ANON_KEY;

const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : "";

export const supabase = supabaseUrl && anonKey
  ? createClient(supabaseUrl, anonKey, {
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, cache: "no-store", next: { revalidate: 0 } }),
      },
    })
  : null;
