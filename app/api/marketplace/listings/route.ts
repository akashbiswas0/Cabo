import { NextResponse } from "next/server";
import { readListings } from "@/lib/marketplace-listings";

/**
 * GET /api/marketplace/listings
 * Returns NOVA listings with metadata (including price set by the creator).
 */
export async function GET() {
  try {
    const stored = await readListings();
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
      };
    });
    return NextResponse.json(strategies);
  } catch (e) {
    console.error("Listings read error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
