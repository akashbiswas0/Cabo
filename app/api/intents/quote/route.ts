import { NextResponse } from "next/server";
import { getIntentsQuote, toApiError } from "@/lib/intents/server";
import type { QuoteRequestInput } from "@/lib/intents/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidAmount(value: string): boolean {
  if (!/^\d+$/.test(value)) {
    return false;
  }
  try {
    return BigInt(value) > BigInt(0);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QuoteRequestInput;

    if (!body || typeof body !== "object") {
      return NextResponse.json({ message: "Invalid request payload" }, { status: 400 });
    }

    if (typeof body.destinationAsset !== "string" || !body.destinationAsset.trim()) {
      return NextResponse.json({ message: "destinationAsset is required" }, { status: 400 });
    }

    if (typeof body.recipient !== "string" || !body.recipient.trim()) {
      return NextResponse.json({ message: "recipient is required" }, { status: 400 });
    }

    if (typeof body.amount !== "string" || !isValidAmount(body.amount)) {
      return NextResponse.json(
        { message: "amount must be a positive integer string" },
        { status: 400 },
      );
    }

    const quote = await getIntentsQuote(body);
    return NextResponse.json(quote);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.payload, { status: apiError.status });
  }
}
