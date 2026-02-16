import { NextRequest, NextResponse } from "next/server";
import { NovaSdk } from "nova-sdk-js";

/**
 * Grant NOVA group access after purchase.
 * Caller (your app) uses NOVA_ACCOUNT_ID (group owner) to add the buyer as a member.
 * Frontend should send NEAR payment to the seller first, then call this to grant access.
 */
export async function POST(request: NextRequest) {
  const accountId = process.env.NOVA_ACCOUNT_ID;
  const apiKey = process.env.NOVA_API_KEY;

  if (!accountId || !apiKey) {
    return NextResponse.json(
      { error: "NOVA not configured", detail: "Set NOVA_ACCOUNT_ID and NOVA_API_KEY in .env" },
      { status: 503 }
    );
  }

  let body: { groupId?: string; buyerAccountId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { groupId, buyerAccountId } = body;
  if (!groupId || !buyerAccountId) {
    return NextResponse.json(
      { error: "Missing fields", detail: "Provide groupId and buyerAccountId" },
      { status: 400 }
    );
  }

  const config: { apiKey: string; rpcUrl: string; contractId: string; mcpUrl?: string } = {
    apiKey,
    rpcUrl: process.env.NOVA_RPC_URL ?? "https://rpc.mainnet.near.org",
    contractId: process.env.NOVA_CONTRACT_ID ?? "nova-sdk.near",
  };
  if (process.env.NOVA_MCP_URL) config.mcpUrl = process.env.NOVA_MCP_URL;

  try {
    const sdk = new NovaSdk(accountId, config);
    await sdk.addGroupMember(groupId, buyerAccountId);
    return NextResponse.json({
      success: true,
      groupId,
      buyerAccountId,
      message: "Buyer added to group. They now have secure access to the strategy.",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Failed to add group member";
    console.error("NOVA purchase (add_group_member) error:", err);
    return NextResponse.json(
      { error: "Purchase failed", detail },
      { status: 500 }
    );
  }
}
