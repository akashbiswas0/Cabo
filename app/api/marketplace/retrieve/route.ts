import { NextRequest, NextResponse } from "next/server";
import { NovaSdk } from "nova-sdk-js";
import { getListingByGroupId } from "@/lib/marketplace-listings";

/**
 * GET /api/marketplace/retrieve?groupId=...&cid=...  (cid optional)
 * Fetches encrypted file from IPFS via NOVA MCP and returns decrypted content.
 * If only groupId is given, CID is looked up from Supabase (marketplace_listings).
 * Uses your NOVA account (must be group owner or authorized member).
 */
export async function GET(request: NextRequest) {
  const accountId = process.env.NOVA_ACCOUNT_ID;
  const apiKey = process.env.NOVA_API_KEY;

  if (!accountId || !apiKey) {
    return NextResponse.json(
      { error: "NOVA not configured", detail: "Set NOVA_ACCOUNT_ID and NOVA_API_KEY" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  let groupId = searchParams.get("groupId");
  let cid = searchParams.get("cid");

  if (!groupId) {
    return NextResponse.json(
      { error: "Missing groupId", detail: "Query param groupId is required" },
      { status: 400 }
    );
  }

  if (!cid) {
    const listing = await getListingByGroupId(groupId);
    cid = listing?.cid ?? null;
    if (!cid) {
      return NextResponse.json(
        {
          error: "CID not found for this group",
          detail:
            "No IPFS CID stored for this group. Pass cid in the query, or ensure the listing was uploaded with CID saved (marketplace_listings.cid).",
        },
        { status: 404 }
      );
    }
  }

  const config: { apiKey: string; rpcUrl: string; contractId: string; mcpUrl?: string } = {
    apiKey,
    rpcUrl: process.env.NOVA_RPC_URL ?? "https://rpc.mainnet.near.org",
    contractId: process.env.NOVA_CONTRACT_ID ?? "nova-sdk.near",
  };
  if (process.env.NOVA_MCP_URL) config.mcpUrl = process.env.NOVA_MCP_URL;

  try {
    const sdk = new NovaSdk(accountId, config);
    const result = await sdk.retrieve(groupId, cid);

    const buffer = Buffer.isBuffer(result.data) ? result.data : Buffer.from(result.data);
    const utf8 = buffer.toString("utf8");
    const isLikelyText = /^[\x20-\x7E\n\r\t]*$/.test(utf8) || buffer.length < 1024;

    return NextResponse.json({
      success: true,
      group_id: result.group_id,
      ipfs_hash: result.ipfs_hash,
      data_base64: buffer.toString("base64"),
      data_text: isLikelyText ? utf8 : undefined,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Retrieve failed";
    console.error("NOVA retrieve error:", err);
    return NextResponse.json(
      { error: "Retrieve failed", detail },
      { status: 500 }
    );
  }
}
