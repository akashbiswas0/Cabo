import { getSupabase, isSupabaseConfigured } from "./supabase";

export async function saveCheckoutReturn(
  token: string,
  sessionId: string,
  groupId: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase not configured");
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("pingpay_checkout_returns").insert({
    token,
    session_id: sessionId,
    group_id: groupId,
  });
  if (error) throw new Error(error.message);
}

export async function getCheckoutReturnByToken(
  token: string
): Promise<{ sessionId: string; groupId: string } | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("pingpay_checkout_returns")
    .select("session_id, group_id")
    .eq("token", token)
    .maybeSingle();
  if (error || !data) return null;
  return {
    sessionId: (data as { session_id: string; group_id: string }).session_id,
    groupId: (data as { session_id: string; group_id: string }).group_id,
  };
}
