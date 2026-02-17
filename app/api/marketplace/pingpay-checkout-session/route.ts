import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { saveCheckoutReturn } from "@/lib/pingpay-checkout";

const PINGPAY_BASE = "https://pay.pingpay.io/api";
const NEAR_DECIMALS = 24;

function nearToYocto(near: number): string {
  return BigInt(Math.floor(near * 10 ** NEAR_DECIMALS)).toString();
}

/**
 * POST /api/marketplace/pingpay-checkout-session
 * Body: { groupId: string, seller: string, amountInNear: number }
 * Creates a Pingpay hosted checkout session and returns { sessionUrl }.
 * successUrl includes a token so we can verify and complete the purchase after redirect.
 */
export async function POST(request: NextRequest) {
  const key = process.env.PINGPAY_API_KEY ?? process.env.PINGPAY_PUBLISHABLE_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Pingpay not configured", detail: "Set PINGPAY_API_KEY or PINGPAY_PUBLISHABLE_KEY" },
      { status: 503 }
    );
  }

  let body: { groupId?: string; seller?: string; amountInNear?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { groupId, seller, amountInNear } = body;
  if (
    !groupId ||
    typeof groupId !== "string" ||
    !seller ||
    typeof seller !== "string" ||
    amountInNear == null ||
    typeof amountInNear !== "number" ||
    amountInNear <= 0
  ) {
    return NextResponse.json(
      { error: "Missing or invalid groupId, seller, or amountInNear" },
      { status: 400 }
    );
  }

  const token = randomUUID();
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    "http://localhost:3000";
  const successUrl = `${baseUrl}/marketplace?pingpay=success&token=${token}`;
  const cancelUrl = `${baseUrl}/marketplace`;

  const amountYocto = nearToYocto(amountInNear);
  const payload = {
    amount: amountYocto,
    asset: {
      chain: "NEAR",
      symbol: "NEAR",
    },
    recipient: {
      address: seller,
      chainId: "near-mainnet",
    },
    successUrl,
    cancelUrl,
  };

  const res = await fetch(`${PINGPAY_BASE}/checkout/sessions`, {
    method: "POST",
    headers: {
      "x-api-key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issues = data.data?.issues ?? data.issues ?? data.details;
    console.error("Pingpay checkout session error:", res.status, JSON.stringify(data));
    return NextResponse.json(
      {
        error: "Failed to create checkout session",
        detail: data.message || data.code,
        issues: issues ?? undefined,
      },
      { status: res.status >= 500 ? 502 : 400 }
    );
  }

  const sessionId = data.session?.sessionId;
  const sessionUrl = data.sessionUrl;
  if (!sessionId || !sessionUrl) {
    return NextResponse.json(
      { error: "Invalid response from Pingpay", detail: "Missing sessionId or sessionUrl" },
      { status: 502 }
    );
  }

  try {
    await saveCheckoutReturn(token, sessionId, groupId);
  } catch (e) {
    console.error("Failed to save checkout return token:", e);
    return NextResponse.json(
      { error: "Failed to save checkout state" },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionUrl });
}
