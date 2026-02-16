import {
  ApiError,
  OpenAPI,
  OneClickService,
  QuoteRequest,
} from "@defuse-protocol/one-click-sdk-typescript";
import type {
  ExecutionStatusPayload,
  IntentsToken,
  QuoteRequestInput,
  QuoteResponsePayload,
  SubmitDepositPayload,
  ApiErrorPayload,
} from "@/lib/intents/types";

const DEFAULT_BASE_URL = "https://1click.chaindefuser.com";
const DEFAULT_REFERRAL = "nova";

type ErrorResult = {
  status: number;
  payload: ApiErrorPayload;
};

function configureOneClickApi() {
  OpenAPI.BASE = process.env.ONE_CLICK_BASE_URL || DEFAULT_BASE_URL;
  OpenAPI.TOKEN = process.env.ONE_CLICK_JWT || undefined;
}

function getBodyErrorMessage(body: unknown): ApiErrorPayload | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = body as Record<string, unknown>;
  const message =
    typeof record.message === "string"
      ? record.message
      : typeof record.error === "string"
        ? record.error
        : null;
  const correlationId =
    typeof record.correlationId === "string" ? record.correlationId : undefined;

  if (!message) {
    return null;
  }

  return { message, correlationId };
}

export function toApiError(error: unknown): ErrorResult {
  if (error instanceof ApiError) {
    const bodyError = getBodyErrorMessage(error.body);
    return {
      status: error.status || 500,
      payload:
        bodyError || { message: error.message || "1-Click API request failed" },
    };
  }

  if (error && typeof error === "object") {
    const record = error as Record<string, unknown>;
    const bodyError = getBodyErrorMessage(record.body);
    const status =
      typeof record.status === "number" && Number.isFinite(record.status)
        ? record.status
        : 500;
    if (bodyError) {
      return { status, payload: bodyError };
    }

    if (typeof record.message === "string") {
      return { status, payload: { message: record.message } };
    }
  }

  return {
    status: 500,
    payload: { message: "Unexpected error while calling 1-Click API" },
  };
}

export async function getIntentsTokens(): Promise<IntentsToken[]> {
  configureOneClickApi();
  const tokens = await OneClickService.getTokens();
  return tokens as IntentsToken[];
}

export async function getIntentsQuote(
  input: QuoteRequestInput,
): Promise<QuoteResponsePayload> {
  configureOneClickApi();

  const recipient = input.recipient.trim();
  const refundTo = (input.refundTo || input.recipient).trim();
  const slippageTolerance =
    typeof input.slippageTolerance === "number" &&
    Number.isFinite(input.slippageTolerance)
      ? input.slippageTolerance
      : 100;

  const quoteRequest: QuoteRequest = {
    dry: input.dry,
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    slippageTolerance,
    originAsset: "nep141:wrap.near",
    depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
    destinationAsset: input.destinationAsset,
    amount: input.amount,
    refundTo,
    refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
    recipient,
    recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
    deadline: new Date(Date.now() + 3 * 60 * 1000).toISOString(),
    referral: process.env.ONE_CLICK_REFERRAL || DEFAULT_REFERRAL,
    quoteWaitingTimeMs: 3000,
  };

  const quote = await OneClickService.getQuote(quoteRequest);
  return quote as QuoteResponsePayload;
}

export async function submitIntentsDeposit(
  input: SubmitDepositPayload,
): Promise<void> {
  configureOneClickApi();
  await OneClickService.submitDepositTx({
    txHash: input.txHash,
    depositAddress: input.depositAddress,
  });
}

export async function getIntentsExecutionStatus(
  depositAddress: string,
  depositMemo?: string,
): Promise<ExecutionStatusPayload> {
  configureOneClickApi();
  const response = await OneClickService.getExecutionStatus(
    depositAddress,
    depositMemo,
  );
  return response as ExecutionStatusPayload;
}
