const projectId = process.env.SUPABASE_PROJECT_ID;
const anonKey = process.env.SUPABASE_ANON_KEY;

export const supabaseUrl = projectId ? `https://${projectId}.supabase.co` : "";
export const supabaseAnonKey = anonKey ?? "";

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseConfig() {
  if (!hasSupabaseConfig()) {
    throw new Error("SUPABASE_PROJECT_ID or SUPABASE_ANON_KEY is missing.");
  }

  return { supabaseUrl, supabaseAnonKey };
}
