import { NextRequest, NextResponse } from "next/server";
import { readListings } from "@/lib/marketplace-listings";

/**
 * GET /api/marketplace/listings
 * Returns NOVA listings. Use ?mine=1 to return only listings by this app's NOVA account (my listings).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mine = searchParams.get("mine") === "1";
    const seller = mine ? process.env.NOVA_ACCOUNT_ID : undefined;
    const stored = await readListings(seller);
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
    return NextResponse.json(strategies);
  } catch (e) {
    console.error("Listings read error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
