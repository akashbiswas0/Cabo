import { NextRequest, NextResponse } from "next/server";
import { NovaSdk } from "nova-sdk-js";
import { getCheckoutReturnByToken } from "@/lib/pingpay-checkout";
import { checkIfPurchased, recordPurchase } from "@/lib/purchases";

const PINGPAY_BASE = "https://pay.pingpay.io/api";

/**
 * POST /api/marketplace/pingpay-complete
 * Body: { token: string, buyerAccountId: string }
 * Verifies Pingpay session is COMPLETED, then records purchase and adds buyer to NOVA group.
 */
export async function POST(request: NextRequest) {
  const key = process.env.PINGPAY_PUBLISHABLE_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Pingpay not configured" },
      { status: 503 }
    );
  }

  let body: { token?: string; buyerAccountId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { token, buyerAccountId } = body;
  if (!token || typeof token !== "string" || !buyerAccountId || typeof buyerAccountId !== "string") {
    return NextResponse.json(
      { error: "Missing token or buyerAccountId" },
      { status: 400 }
    );
  }

  const row = await getCheckoutReturnByToken(token);
  if (!row) {
    return NextResponse.json(
      { error: "Checkout session not found or expired" },
      { status: 404 }
    );
  }

  const { sessionId, groupId } = row;

  const sessionRes = await fetch(`${PINGPAY_BASE}/checkout/sessions/${sessionId}`, {
    method: "GET",
    headers: { "x-publishable-key": key },
  });
  const sessionData = await sessionRes.json().catch(() => ({}));
  if (!sessionRes.ok) {
    return NextResponse.json(
      { error: "Could not verify payment", detail: sessionData.message },
      { status: 502 }
    );
  }

  const status = sessionData.session?.status;
  if (status !== "COMPLETED") {
    return NextResponse.json(
      { error: "Payment not completed", detail: `Session status: ${status || "unknown"}` },
      { status: 400 }
    );
  }

  const alreadyPurchased = await checkIfPurchased(buyerAccountId, groupId);
  if (alreadyPurchased) {
    return NextResponse.json({
      success: true,
      groupId,
      message: "You already have access to this strategy.",
    });
  }

  const accountId = process.env.NOVA_ACCOUNT_ID;
  const apiKey = process.env.NOVA_API_KEY;
  if (!accountId || !apiKey) {
    return NextResponse.json(
      { error: "NOVA not configured" },
      { status: 503 }
    );
  }

  const config = {
    apiKey,
    rpcUrl: process.env.NOVA_RPC_URL ?? "https://rpc.mainnet.near.org",
    contractId: process.env.NOVA_CONTRACT_ID ?? "nova-sdk.near",
  } as { apiKey: string; rpcUrl: string; contractId: string; mcpUrl?: string };
  if (process.env.NOVA_MCP_URL) config.mcpUrl = process.env.NOVA_MCP_URL;

  try {
    const sdk = new NovaSdk(accountId, config);
    await sdk.addGroupMember(groupId, buyerAccountId);
    await recordPurchase(buyerAccountId, groupId);
    return NextResponse.json({
      success: true,
      groupId,
      message: "Access granted. You can now view the strategy.",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Failed to grant access";
    console.error("Pingpay complete (add_group_member) error:", err);
    return NextResponse.json(
      { error: "Failed to grant access", detail },
      { status: 500 }
    );
  }
}
