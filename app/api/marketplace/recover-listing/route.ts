import { NextRequest, NextResponse } from "next/server";
import { getListingByGroupId, appendListing } from "@/lib/marketplace-listings";

/**
 * POST /api/marketplace/recover-listing
 * Body: { groupId: string, name: string, description?: string, price: string }
 * Inserts a listing into Supabase when the NOVA tx succeeded but the API failed before saving.
 * Uses NOVA_ACCOUNT_ID as seller. No cid (retrieve may not work until file is re-uploaded).
 */
export async function POST(request: NextRequest) {
  const accountId = process.env.NOVA_ACCOUNT_ID;
  if (!accountId) {
    return NextResponse.json(
      { error: "NOVA_ACCOUNT_ID not set" },
      { status: 503 }
    );
  }

  let body: { groupId?: string; name?: string; description?: string; price?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { groupId, name, price } = body;
  const description = body.description ?? "";

  if (!groupId || typeof groupId !== "string" || !name || typeof name !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid groupId or name" },
      { status: 400 }
    );
  }

  const existing = await getListingByGroupId(groupId);
  if (existing) {
    return NextResponse.json(
      { error: "Listing already exists for this group", groupId },
      { status: 409 }
    );
  }

  const priceStr = typeof price === "string" && price !== "" ? price : "0";

  try {
    await appendListing({
      groupId,
      name,
      description,
      price: priceStr,
      priceType: "one-time",
      seller: accountId,
      createdAt: new Date().toISOString(),
      listerAccountId: undefined,
    });
    return NextResponse.json({
      success: true,
      groupId,
      message: "Listing recovered. It will appear on Discover. (No file/CID — retrieve may require re-upload.)",
    });
  } catch (e) {
    console.error("Recover listing error:", e);
    return NextResponse.json(
      { error: "Failed to save listing", detail: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
