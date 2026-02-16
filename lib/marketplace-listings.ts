import { getSupabase, isSupabaseConfigured } from "./supabase";

export type StoredListing = {
  groupId: string;
  name: string;
  description: string;
  price: string;
  priceType: "one-time" | "subscription";
  seller: string;
  createdAt: string;
  /** IPFS CID from NOVA upload (for retrieve / display). */
  cid?: string;
};

/** If seller is provided, only return listings by that seller (e.g. "my listings"). */
export async function readListings(seller?: string): Promise<StoredListing[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabase();
    let q = supabase
      .from("marketplace_listings")
      .select("group_id, name, description, price, price_type, seller, created_at, cid")
      .order("created_at", { ascending: false });
    if (seller) q = q.eq("seller", seller);
    const { data, error } = await q;

    if (error) {
      console.error("Supabase readListings error:", error);
      return [];
    }

    const rows = (data ?? []) as Array<{
      group_id: string;
      name: string;
      description: string | null;
      price: string;
      price_type: "one-time" | "subscription";
      seller: string;
      created_at: string;
      cid: string | null;
    }>;
    return rows.map((row) => ({
      groupId: row.group_id,
      name: row.name,
      description: row.description ?? "",
      price: row.price,
      priceType: row.price_type,
      seller: row.seller,
      createdAt: row.created_at,
      cid: row.cid ?? undefined,
    }));
  } catch (e) {
    console.error("readListings:", e);
    return [];
  }
}

/** Get a single listing by group_id (e.g. to get cid for retrieve). */
export async function getListingByGroupId(groupId: string): Promise<StoredListing | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("group_id, name, description, price, price_type, seller, created_at, cid")
      .eq("group_id", groupId)
      .maybeSingle();

    if (error || !data) return null;
    const row = data as {
      group_id: string;
      name: string;
      description: string | null;
      price: string;
      price_type: "one-time" | "subscription";
      seller: string;
      created_at: string;
      cid: string | null;
    };
    return {
      groupId: row.group_id,
      name: row.name,
      description: row.description ?? "",
      price: row.price,
      priceType: row.price_type,
      seller: row.seller,
      createdAt: row.created_at,
      cid: row.cid ?? undefined,
    };
  } catch (e) {
    console.error("getListingByGroupId:", e);
    return null;
  }
}

export async function appendListing(entry: StoredListing): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured; skipping listing persist.");
    return;
  }
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("marketplace_listings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        group_id: entry.groupId,
        name: entry.name,
        description: entry.description,
        price: entry.price,
        price_type: entry.priceType,
        seller: entry.seller,
        ...(entry.cid != null && entry.cid !== "" ? { cid: entry.cid } : {}),
      } as any);

    if (error) {
      console.error("Supabase appendListing error:", error);
      throw new Error(error.message);
    }
  } catch (e) {
    console.error("appendListing:", e);
    throw e;
  }
}
