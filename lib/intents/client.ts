import type {
  ApiErrorPayload,
  ExecutionStatusPayload,
  IntentsToken,
  QuoteRequestInput,
  QuoteResponsePayload,
  SubmitDepositPayload,
} from "@/lib/intents/types";

type RequestOptions = {
  signal?: AbortSignal;
};

function parseErrorMessage(error: ApiErrorPayload): string {
  if (error.correlationId) {
    return `${error.message} (correlation: ${error.correlationId})`;
  }
  return error.message;
}

async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(input, init);
  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      throw new Error("Response could not be parsed");
    }
  }

  if (!response.ok) {
    if (
      payload &&
      typeof payload === "object" &&
      "message" in (payload as Record<string, unknown>)
    ) {
      throw new Error(parseErrorMessage(payload as ApiErrorPayload));
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload as T;
}

export async function fetchIntentsTokens(
  options?: RequestOptions,
): Promise<IntentsToken[]> {
  return requestJson<IntentsToken[]>("/api/intents/tokens", {
    method: "GET",
    signal: options?.signal,
  });
}

export async function fetchIntentsQuote(
  input: QuoteRequestInput,
  options?: RequestOptions,
): Promise<QuoteResponsePayload> {
  return requestJson<QuoteResponsePayload>("/api/intents/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: options?.signal,
  });
}

export async function submitIntentsDeposit(
  payload: SubmitDepositPayload,
): Promise<void> {
  await requestJson<{ ok: true }>("/api/intents/submit-deposit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchIntentsExecutionStatus(
  depositAddress: string,
  depositMemo?: string,
): Promise<ExecutionStatusPayload> {
  const params = new URLSearchParams({ depositAddress });
  if (depositMemo) {
    params.set("depositMemo", depositMemo);
  }

  return requestJson<ExecutionStatusPayload>(
    `/api/intents/status?${params.toString()}`,
    { method: "GET" },
  );
}
