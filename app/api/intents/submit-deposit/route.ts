import { NextResponse } from "next/server";
import { submitIntentsDeposit, toApiError } from "@/lib/intents/server";
import type { SubmitDepositPayload } from "@/lib/intents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitDepositPayload;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }

    if (typeof body.txHash !== "string" || !body.txHash.trim()) {
      return NextResponse.json({ message: "txHash is required" }, { status: 400 });
    }

    if (typeof body.depositAddress !== "string" || !body.depositAddress.trim()) {
      return NextResponse.json({ message: "depositAddress is required" }, { status: 400 });
    }

    await submitIntentsDeposit(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.payload, { status: apiError.status });
  }
}
