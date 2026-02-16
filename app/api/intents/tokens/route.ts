import { NextResponse } from "next/server";
import { getIntentsTokens, toApiError } from "@/lib/intents/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tokens = await getIntentsTokens();
    return NextResponse.json(tokens);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.payload, { status: apiError.status });
  }
}
