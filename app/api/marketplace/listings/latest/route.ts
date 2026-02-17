import { NextResponse } from "next/server";
import { getLatestListing } from "@/lib/marketplace-listings";

/**
 * GET /api/marketplace/listings/latest
 * Returns the most recently uploaded strategy (from Supabase, by created_at desc).
 * Use this to get the id (group_id) of the last listing.
 */
export async function GET() {
  try {
    const listing = await getLatestListing();
    if (!listing) {
      return NextResponse.json(
        { error: "No listings found" },
        { status: 404 }
      );
    }
    return NextResponse.json({
      id: listing.groupId,
      name: listing.name,
      description: listing.description,
      price: listing.price,
      priceType: listing.priceType,
      seller: listing.seller,
      createdAt: listing.createdAt,
      cid: listing.cid,
    });
  } catch (e) {
    console.error("Latest listing error:", e);
    return NextResponse.json(
      { error: "Failed to fetch latest listing" },
      { status: 500 }
    );
  }
}
