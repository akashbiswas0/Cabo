import { NextRequest, NextResponse } from "next/server";
import { readListings } from "@/lib/marketplace-listings";

/**
 * GET /api/marketplace/listings
 * Listings are read from Supabase (table marketplace_listings), not from NOVA.
 * Use ?mine=1&accountId=... to return only listings created by that NEAR account (My Listings).
 * Use ?debug=1 to include _source and count in the response (for troubleshooting).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "1";
    const accountId = searchParams.get("accountId")?.trim();
    const debug = searchParams.get("debug") === "1";
    const options =
      mine && accountId
        ? { listerAccountId: accountId }
        : mine
          ? undefined
          : undefined;
    const stored = mine && !accountId ? [] : await readListings(options);
    const strategies = stored.map((row) => {
      const priceNum = parseFloat(row.price) || 0;
      const priceDisplay =
        row.priceType === "subscription"
          ? `${row.price} NEAR/mo`
          : `${row.price} NEAR`;
      return {
        id: row.groupId,
        name: row.name,
        teaser: row.description || "Encrypted strategy. Full details after purchase.",
        avgMonthlyReturn: "—",
        price: priceDisplay,
        priceType: row.priceType,
        rating: null,
        riskLevel: "medium" as const,
        assetFocus: ["NEAR"] as string[],
        seller: row.seller,
        priceInNear: priceNum,
        cid: row.cid,
      };
    });
    if (debug) {
      return NextResponse.json({
        strategies,
        _debug: { source: "supabase", table: "marketplace_listings", count: strategies.length },
      });
    }
    return NextResponse.json(strategies);
  } catch (e) {
    console.error("Listings read error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
