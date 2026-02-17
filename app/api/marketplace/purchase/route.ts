import { NextRequest, NextResponse } from "next/server";
import { NovaSdk } from "nova-sdk-js";
import { checkIfPurchased, recordPurchase } from "@/lib/purchases";

/**
 * Grant NOVA group access after purchase.
 * One purchase per user per strategy; records purchase in Supabase.
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

  const alreadyPurchased = await checkIfPurchased(buyerAccountId, groupId);
  if (alreadyPurchased) {
    return NextResponse.json(
      { error: "Already purchased", detail: "You can only purchase this strategy once." },
      { status: 409 }
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
    await recordPurchase(buyerAccountId, groupId);
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
