import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export type MarketplaceListingRow = {
  id: string;
  group_id: string;
  name: string;
  description: string;
  price: string;
  price_type: "one-time" | "subscription";
  seller: string;
  created_at: string;
  cid: string | null;
};

export type PurchaseRow = {
  id: string;
  buyer_account_id: string;
  group_id: string;
  purchased_at: string;
};

export type Database = {
  public: {
    Tables: {
      marketplace_listings: {
        Row: MarketplaceListingRow;
        Insert: Omit<MarketplaceListingRow, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<MarketplaceListingRow, "id">>;
        Relationships: [];
      };
      purchases: {
        Row: PurchaseRow;
        Insert: {
          buyer_account_id: string;
          group_id: string;
          id?: string;
          purchased_at?: string;
        };
        Update: Partial<Omit<PurchaseRow, "id">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};

/**
 * Server-side Supabase client (API routes only).
 * Uses service role so the app can read/write marketplace_listings without RLS.
 * Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */
export function getSupabase() {
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient<Database>(url, serviceRoleKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceRoleKey);
}
