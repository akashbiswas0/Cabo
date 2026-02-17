import { getSupabase, isSupabaseConfigured } from "./supabase";

export async function checkIfPurchased(
  buyerAccountId: string,
  groupId: string
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("purchases")
      .select("id")
      .eq("buyer_account_id", buyerAccountId)
      .eq("group_id", groupId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("checkIfPurchased error:", error);
      return false;
    }
    return data != null;
  } catch (e) {
    console.error("checkIfPurchased:", e);
    return false;
  }
}

export async function recordPurchase(
  buyerAccountId: string,
  groupId: string
): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured; skipping purchase record.");
    return;
  }
  const supabase = getSupabase();
  const { error } = await supabase.from("purchases").insert({
    buyer_account_id: buyerAccountId,
    group_id: groupId,
  });

  if (error) {
    console.error("recordPurchase error:", error);
    throw new Error(error.message);
  }
}

export type PurchaseWithListing = {
  group_id: string;
  buyer_account_id: string;
  purchased_at: string;
  name: string;
  description: string;
  price: string;
  price_type: "one-time" | "subscription";
  seller: string;
  cid: string | null;
};

/** Returns purchases for an account, joined with listing details. */
export async function getPurchasesForAccount(
  accountId: string
): Promise<PurchaseWithListing[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    const { data: purchases, error: pe } = await supabase
      .from("purchases")
      .select("group_id, buyer_account_id, purchased_at")
      .eq("buyer_account_id", accountId)
      .order("purchased_at", { ascending: false });

    if (pe || !purchases?.length) return [];

    const groupIds = purchases.map((p) => p.group_id);
    const { data: listings, error: le } = await supabase
      .from("marketplace_listings")
      .select("group_id, name, description, price, price_type, seller, cid")
      .in("group_id", groupIds);

    if (le || !listings?.length) {
      return purchases.map((p) => ({
        group_id: p.group_id,
        buyer_account_id: p.buyer_account_id,
        purchased_at: p.purchased_at,
        name: "Unknown",
        description: "",
        price: "0",
        price_type: "one-time" as const,
        seller: "",
        cid: null,
      }));
    }

    const byGroup = new Map(listings.map((l) => [l.group_id, l]));
    return purchases.map((p) => {
      const list = byGroup.get(p.group_id);
      return {
        group_id: p.group_id,
        buyer_account_id: p.buyer_account_id,
        purchased_at: p.purchased_at,
        name: list?.name ?? "Unknown",
        description: list?.description ?? "",
        price: list?.price ?? "0",
        price_type: (list?.price_type ?? "one-time") as "one-time" | "subscription",
        seller: list?.seller ?? "",
        cid: list?.cid ?? null,
      };
    });
  } catch (e) {
    console.error("getPurchasesForAccount:", e);
    return [];
  }
}
