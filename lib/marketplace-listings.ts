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
  /** NEAR account of the user who created the listing (for "My Listings"). */
  listerAccountId?: string;
};

type ReadListingsOptions = {
  /** Filter by NOVA/seller account (legacy). */
  seller?: string;
  /** Filter by lister (owner) NEAR account — use for "My Listings". */
  listerAccountId?: string;
};

const LISTING_SELECT =
  "group_id, name, description, price, price_type, seller, created_at, cid, lister_account_id";
const LISTING_SELECT_LEGACY =
  "group_id, name, description, price, price_type, seller, created_at, cid";

function mapListingRows(rows: Array<Record<string, unknown>>): StoredListing[] {
  return rows.map((row) => ({
    groupId: String(row.group_id),
    name: String(row.name),
    description: row.description != null ? String(row.description) : "",
    price: String(row.price),
    priceType: (row.price_type as "one-time" | "subscription") || "one-time",
    seller: String(row.seller),
    createdAt: String(row.created_at),
    cid: row.cid != null && row.cid !== "" ? String(row.cid) : undefined,
    listerAccountId:
      row.lister_account_id != null && row.lister_account_id !== ""
        ? String(row.lister_account_id)
        : undefined,
  }));
}

/** Listings for Discover (no filter) or My Listings (listerAccountId). */
export async function readListings(options?: ReadListingsOptions): Promise<StoredListing[]> {
  if (!isSupabaseConfigured()) return [];
  const { seller, listerAccountId } = options ?? {};
  const supabase = getSupabase();
  try {
    let q = supabase
      .from("marketplace_listings")
      .select(LISTING_SELECT)
      .order("created_at", { ascending: false });
    if (seller) q = q.eq("seller", seller);
    if (listerAccountId != null && listerAccountId !== "") q = q.eq("lister_account_id", listerAccountId);
    const { data, error } = await q;

    if (error) {
      const msg = error.message || "";
      const missingColumn = /lister_account_id|column.*does not exist/i.test(msg);
      if (missingColumn) {
        let qLegacy = supabase
          .from("marketplace_listings")
          .select(LISTING_SELECT_LEGACY)
          .order("created_at", { ascending: false });
        if (seller) qLegacy = qLegacy.eq("seller", seller);
        const { data: legacyData, error: legacyError } = await qLegacy;
        if (legacyError) {
          console.error("Supabase readListings error:", legacyError);
          return [];
        }
        return mapListingRows((legacyData ?? []) as Array<Record<string, unknown>>);
      }
      console.error("Supabase readListings error:", error);
      return [];
    }
    return mapListingRows((data ?? []) as Array<Record<string, unknown>>);
  } catch (e) {
    console.error("readListings:", e);
    return [];
  }
}

/** Get the most recently created listing (by created_at desc). */
export async function getLatestListing(): Promise<StoredListing | null> {
  const list = await readListings(undefined);
  return list.length > 0 ? list[0] : null;
}

/** Get a single listing by group_id (e.g. to get cid for retrieve). */
export async function getListingByGroupId(groupId: string): Promise<StoredListing | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  let result = await supabase
    .from("marketplace_listings")
    .select(LISTING_SELECT)
    .eq("group_id", groupId)
    .maybeSingle();
  if (result.error && /lister_account_id|column.*does not exist/i.test(result.error.message || "")) {
    result = await supabase
      .from("marketplace_listings")
      .select(LISTING_SELECT_LEGACY)
      .eq("group_id", groupId)
      .maybeSingle();
  }
  if (result.error || !result.data) return null;
  const row = result.data as Record<string, unknown>;
  const list = mapListingRows([row]);
  return list[0] ?? null;
}

export async function appendListing(entry: StoredListing): Promise<void> {
  if (!isSupabaseConfigured()) {
    console.warn("Supabase not configured; skipping listing persist.");
    return;
  }
  const supabase = getSupabase();
  const baseRow = {
    group_id: entry.groupId,
    name: entry.name,
    description: entry.description,
    price: entry.price,
    price_type: entry.priceType,
    seller: entry.seller,
    ...(entry.cid != null && entry.cid !== "" ? { cid: entry.cid } : {}),
  };
  const rowWithLister = {
    ...baseRow,
    ...(entry.listerAccountId != null && entry.listerAccountId !== "" ? { lister_account_id: entry.listerAccountId } : {}),
  };

  const { error } = await supabase
    .from("marketplace_listings")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(rowWithLister as any);

  if (error) {
    const msg = error.message || "";
    const missingListerColumn =
      /lister_account_id|column.*does not exist/i.test(msg);
    if (missingListerColumn) {
      const { error: retryError } = await supabase
        .from("marketplace_listings")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(baseRow as any);
      if (retryError) {
        console.error("Supabase appendListing error:", retryError);
        throw new Error(retryError.message);
      }
      return;
    }
    console.error("Supabase appendListing error:", error);
    throw new Error(error.message);
  }
}
