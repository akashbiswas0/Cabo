import { NextResponse } from "next/server";
import { getIntentsExecutionStatus, toApiError } from "@/lib/intents/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const depositAddress = searchParams.get("depositAddress")?.trim() || "";
    const depositMemo = searchParams.get("depositMemo")?.trim() || undefined;

    if (!depositAddress) {
      return NextResponse.json(
        { message: "depositAddress query param is required" },
        { status: 400 },
      );
    }

    const status = await getIntentsExecutionStatus(depositAddress, depositMemo);
    return NextResponse.json(status);
  } catch (error) {
    const apiError = toApiError(error);
    return NextResponse.json(apiError.payload, { status: apiError.status });
  }
}
