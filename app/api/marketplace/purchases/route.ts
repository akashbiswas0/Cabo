import { NextRequest, NextResponse } from "next/server";
import { getPurchasesForAccount } from "@/lib/purchases";

/**
 * GET /api/marketplace/purchases?accountId=...
 * Returns strategies the user has purchased (from Supabase, joined with listing details).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const accountId = searchParams.get("accountId");

  if (!accountId) {
    return NextResponse.json(
      { error: "Missing accountId", detail: "Query param accountId is required" },
      { status: 400 }
    );
  }

  try {
    const purchases = await getPurchasesForAccount(accountId);
    const strategies = purchases.map((row) => {
      const priceNum = parseFloat(row.price) || 0;
      const priceDisplay =
        row.price_type === "subscription"
          ? `${row.price} NEAR/mo`
          : `${row.price} NEAR`;
      return {
        id: row.group_id,
        name: row.name,
        teaser: row.description || "Encrypted strategy. Full details after purchase.",
        avgMonthlyReturn: "—",
        price: priceDisplay,
        priceType: row.price_type,
        rating: null,
        riskLevel: "medium" as const,
        assetFocus: ["NEAR"] as string[],
        seller: row.seller,
        priceInNear: priceNum,
        cid: row.cid ?? undefined,
        purchasedAt: row.purchased_at,
      };
    });
    return NextResponse.json(strategies);
  } catch (e) {
    console.error("Purchases read error:", e);
    return NextResponse.json([], { status: 200 });
  }
}
