export type IntentsToken = {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price: number;
  priceUpdatedAt: string;
  contractAddress?: string;
};

export type QuoteRequestInput = {
  dry: boolean;
  destinationAsset: string;
  amount: string;
  recipient: string;
  refundTo?: string;
  slippageTolerance?: number;
};

export type QuoteResponsePayload = {
  correlationId: string;
  timestamp: string;
  signature: string;
  quoteRequest: {
    dry: boolean;
    swapType: string;
    slippageTolerance: number;
    originAsset: string;
    depositType: string;
    destinationAsset: string;
    amount: string;
    refundTo: string;
    refundType: string;
    recipient: string;
    recipientType: string;
    deadline: string;
    quoteWaitingTimeMs?: number;
    referral?: string;
  };
  quote: {
    depositAddress?: string;
    depositMemo?: string;
    amountIn: string;
    amountInFormatted: string;
    amountInUsd: string;
    minAmountIn: string;
    amountOut: string;
    amountOutFormatted: string;
    amountOutUsd: string;
    minAmountOut: string;
    deadline?: string;
    timeWhenInactive?: string;
    timeEstimate: number;
  };
};

export type ExecutionStatus =
  | "KNOWN_DEPOSIT_TX"
  | "PENDING_DEPOSIT"
  | "INCOMPLETE_DEPOSIT"
  | "PROCESSING"
  | "SUCCESS"
  | "REFUNDED"
  | "FAILED";

export type ExecutionStatusPayload = {
  correlationId: string;
  quoteResponse: QuoteResponsePayload;
  status: ExecutionStatus;
  updatedAt: string;
  swapDetails?: unknown;
};

export type SubmitDepositPayload = {
  txHash: string;
  depositAddress: string;
};

export type ApiErrorPayload = {
  message: string;
  correlationId?: string;
};
