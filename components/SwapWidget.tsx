"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNearWallet } from "near-connect-hooks";
import { ChevronDown, Info, Wallet } from "lucide-react";
import {
  decimalToUnits,
  formatUnits,
  isDecimalInput,
  isPositiveUnits,
  isWithinBalance,
} from "@/lib/intents/amount";
import {
  fetchIntentsExecutionStatus,
  fetchIntentsQuote,
  fetchIntentsTokens,
  submitIntentsDeposit,
} from "@/lib/intents/client";
import type {
  ExecutionStatus,
  ExecutionStatusPayload,
  IntentsToken,
  QuoteResponsePayload,
} from "@/lib/intents/types";

const NEAR_DECIMALS = 24;
const DEFAULT_SLIPPAGE_BPS = 100;
const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;
const DEPLOY_CONFIRMATION_DELAY_MS = 8000;
const DEPLOY_TOAST_TIMEOUT_MS = 3500;

function formatUsd(value?: string): string {
  if (!value) {
    return "Rate unavailable";
  }
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) {
    return "Rate unavailable";
  }
  return `~ $${amount.toFixed(4)}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unexpected error";
}

function isLikelyNearRecipient(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  if (normalized.endsWith(".near") || normalized.endsWith(".tg")) {
    return true;
  }
  return /^[a-f0-9]{64}$/.test(normalized);
}

function extractTxHash(result: unknown): string | null {
  if (!result || typeof result !== "object") {
    return null;
  }

  const record = result as Record<string, unknown>;
  const transaction = record.transaction as Record<string, unknown> | undefined;
  if (transaction && typeof transaction.hash === "string") {
    return transaction.hash;
  }

  if (typeof record.transactionHash === "string") {
    return record.transactionHash;
  }

  return null;
}

type DestinationTokenPickerProps = {
  tokens: IntentsToken[];
  selectedAssetId: string;
  open: boolean;
  onToggle: () => void;
  onSelect: (assetId: string) => void;
};

type PurchasedStrategyOption = {
  id: string;
  name: string;
  seller: string;
  purchasedAt: string;
  cid: string | null;
};

const DestinationTokenPicker: React.FC<DestinationTokenPickerProps> = ({
  tokens,
  selectedAssetId,
  open,
  onToggle,
  onSelect,
}) => {
  const selectedToken = tokens.find((token) => token.assetId === selectedAssetId);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 bg-[#2C2D35] hover:bg-[#363742] pl-2 pr-3 py-1.5 rounded-full transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-[#2A5ADA] flex items-center justify-center text-[10px] font-semibold text-white">
          {selectedToken?.symbol?.slice(0, 1) ?? "?"}
        </div>
        <span className="font-semibold text-lg text-white">
          {selectedToken?.symbol ?? "Select"}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-gray-400">
          {selectedToken?.blockchain ?? ""}
        </span>
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 z-30 min-w-[290px] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#1E1F25] shadow-xl p-2">
          {tokens.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No destination tokens</p>
          ) : (
            tokens.map((token) => (
              <button
                key={token.assetId}
                type="button"
                onClick={() => onSelect(token.assetId)}
                className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{token.symbol}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {token.blockchain.toUpperCase()} • {token.assetId}
                  </p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">${token.price}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const SwapCard: React.FC = () => {
  const { signedAccountId, signIn, getBalance, transfer, loading: walletLoading } =
    useNearWallet();

  const isMountedRef = useRef(true);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const pollSessionRef = useRef(0);

  const [nearBalanceRaw, setNearBalanceRaw] = useState("0");
  const [tokenOptions, setTokenOptions] = useState<IntentsToken[]>([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [tokensError, setTokensError] = useState<string | null>(null);
  const [tokenMenuOpen, setTokenMenuOpen] = useState(false);

  const [destinationAsset, setDestinationAsset] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sellAmountInput, setSellAmountInput] = useState("");

  const [dryQuote, setDryQuote] = useState<QuoteResponsePayload | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [swapSubmitting, setSwapSubmitting] = useState(false);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [depositSubmitWarning, setDepositSubmitWarning] = useState<string | null>(null);

  const [executionStatus, setExecutionStatus] =
    useState<ExecutionStatusPayload | null>(null);
  const [isPollingStatus, setIsPollingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [latestDepositAddress, setLatestDepositAddress] = useState<string | null>(null);
  const [latestDepositMemo, setLatestDepositMemo] = useState<string | null>(null);
  const [latestTxHash, setLatestTxHash] = useState<string | null>(null);
  const [purchasedStrategies, setPurchasedStrategies] = useState<PurchasedStrategyOption[]>([]);
  const [purchasesLoading, setPurchasesLoading] = useState(false);
  const [purchasesError, setPurchasesError] = useState<string | null>(null);
  const [selectedPurchasedStrategyId, setSelectedPurchasedStrategyId] = useState("");
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deployToastMessage, setDeployToastMessage] = useState<string | null>(null);
  const [deployingAgent, setDeployingAgent] = useState(false);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      pollSessionRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (!tokenMenuOpen) {
      return;
    }

    const onOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setTokenMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [tokenMenuOpen]);

  const loadTokens = useCallback(async () => {
    setTokensLoading(true);
    setTokensError(null);
    try {
      const tokens = await fetchIntentsTokens();
      const nearTokens = tokens.filter((token) => token.blockchain === "near");
      const sorted = [...nearTokens].sort((a, b) => {
        if (a.blockchain === b.blockchain) {
          return a.symbol.localeCompare(b.symbol);
        }
        return a.blockchain.localeCompare(b.blockchain);
      });

      if (!isMountedRef.current) {
        return;
      }

      setTokenOptions(sorted);
      setDestinationAsset((current) => current || sorted[0]?.assetId || "");
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      setTokenOptions([]);
      setTokensError(getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setTokensLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadTokens();
  }, [loadTokens]);

  useEffect(() => {
    if (!signedAccountId) {
      setNearBalanceRaw("0");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const balance = await getBalance(signedAccountId);
        if (!cancelled && isMountedRef.current) {
          setNearBalanceRaw(balance.toString());
        }
      } catch {
        if (!cancelled && isMountedRef.current) {
          setNearBalanceRaw("0");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [getBalance, signedAccountId]);

  useEffect(() => {
    if (!signedAccountId) {
      return;
    }
    setRecipient((current) => current || signedAccountId);
  }, [signedAccountId]);

  useEffect(() => {
    if (!signedAccountId) {
      setPurchasedStrategies([]);
      setSelectedPurchasedStrategyId("");
      setPurchasesLoading(false);
      setPurchasesError(null);
      setDeployError(null);
      return;
    }

    const abortController = new AbortController();
    setPurchasesLoading(true);
    setPurchasesError(null);

    fetch(`/api/marketplace/purchases?accountId=${encodeURIComponent(signedAccountId)}`, {
      signal: abortController.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load purchased strategies (${response.status})`);
        }
        return response.json();
      })
      .then((data: unknown) => {
        if (!isMountedRef.current || abortController.signal.aborted) {
          return;
        }

        if (!Array.isArray(data)) {
          setPurchasedStrategies([]);
          setSelectedPurchasedStrategyId("");
          return;
        }

        const mapped = data
          .map((row): PurchasedStrategyOption | null => {
            if (!row || typeof row !== "object") {
              return null;
            }
            const record = row as Record<string, unknown>;
            const id = typeof record.id === "string" ? record.id.trim() : "";
            const name =
              typeof record.name === "string" && record.name.trim()
                ? record.name.trim()
                : "Unnamed strategy";
            if (!id) {
              return null;
            }

            return {
              id,
              name,
              seller: typeof record.seller === "string" ? record.seller : "",
              purchasedAt:
                typeof record.purchasedAt === "string"
                  ? record.purchasedAt
                  : typeof record.purchased_at === "string"
                    ? record.purchased_at
                    : "",
              cid: typeof record.cid === "string" ? record.cid : null,
            };
          })
          .filter((strategy): strategy is PurchasedStrategyOption => strategy !== null);

        setPurchasedStrategies(mapped);
        setSelectedPurchasedStrategyId((current) =>
          current && mapped.some((strategy) => strategy.id === current) ? current : "",
        );
      })
      .catch((error) => {
        if (abortController.signal.aborted || !isMountedRef.current) {
          return;
        }
        setPurchasedStrategies([]);
        setSelectedPurchasedStrategyId("");
        setPurchasesError(getErrorMessage(error));
      })
      .finally(() => {
        if (!abortController.signal.aborted && isMountedRef.current) {
          setPurchasesLoading(false);
        }
      });

    return () => abortController.abort();
  }, [signedAccountId]);

  useEffect(() => {
    if (!deployToastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setDeployToastMessage(null);
    }, DEPLOY_TOAST_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [deployToastMessage]);

  const selectedDestinationToken = useMemo(
    () => tokenOptions.find((token) => token.assetId === destinationAsset) || null,
    [destinationAsset, tokenOptions],
  );

  const selectedPurchasedStrategy = useMemo(
    () =>
      purchasedStrategies.find((strategy) => strategy.id === selectedPurchasedStrategyId) ?? null,
    [purchasedStrategies, selectedPurchasedStrategyId],
  );

  const amountYocto = useMemo(
    () => decimalToUnits(sellAmountInput, NEAR_DECIMALS),
    [sellAmountInput],
  );

  const nearBalanceUi = useMemo(
    () => formatUnits(nearBalanceRaw, NEAR_DECIMALS, 6),
    [nearBalanceRaw],
  );

  const validationMessage = useMemo(() => {
    if (!signedAccountId) {
      return null;
    }
    if (!selectedDestinationToken) {
      return "Select destination token.";
    }
    if (!recipient.trim()) {
      return "Recipient is required.";
    }
    if (!isLikelyNearRecipient(recipient)) {
      return "Recipient must be a valid NEAR account for NEAR assets.";
    }
    if (!sellAmountInput.trim()) {
      return "Enter amount to swap.";
    }
    if (!amountYocto || !isPositiveUnits(amountYocto)) {
      return "Amount must be greater than 0.";
    }
    if (!isWithinBalance(amountYocto, nearBalanceRaw)) {
      return "Amount exceeds available NEAR balance.";
    }
    return null;
  }, [
    amountYocto,
    nearBalanceRaw,
    recipient,
    sellAmountInput,
    selectedDestinationToken,
    signedAccountId,
  ]);

  useEffect(() => {
    setDryQuote(null);
    setQuoteError(null);

    if (!signedAccountId || !selectedDestinationToken || validationMessage || !amountYocto) {
      return;
    }

    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const quote = await fetchIntentsQuote(
          {
            dry: true,
            destinationAsset: selectedDestinationToken.assetId,
            destinationBlockchain: selectedDestinationToken.blockchain,
            amount: amountYocto,
            recipient: recipient.trim(),
            refundTo: signedAccountId,
            slippageTolerance: DEFAULT_SLIPPAGE_BPS,
          },
          { signal: abortController.signal },
        );

        if (isMountedRef.current) {
          setDryQuote(quote);
          setQuoteError(null);
        }
      } catch (error) {
        if (abortController.signal.aborted || !isMountedRef.current) {
          return;
        }
        setDryQuote(null);
        setQuoteError(getErrorMessage(error));
      } finally {
        if (!abortController.signal.aborted && isMountedRef.current) {
          setQuoteLoading(false);
        }
      }
    }, 400);

    return () => {
      abortController.abort();
      clearTimeout(timer);
      setQuoteLoading(false);
    };
  }, [
    amountYocto,
    recipient,
    selectedDestinationToken,
    signedAccountId,
    validationMessage,
  ]);

  const pollExecutionUntilTerminal = useCallback(
    async (depositAddress: string, depositMemo?: string) => {
      const sessionId = Date.now();
      pollSessionRef.current = sessionId;
      setIsPollingStatus(true);
      setStatusError(null);

      const startedAt = Date.now();
      while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
        if (!isMountedRef.current || pollSessionRef.current !== sessionId) {
          return;
        }

        try {
          const status = await fetchIntentsExecutionStatus(
            depositAddress,
            depositMemo,
          );
          if (!isMountedRef.current || pollSessionRef.current !== sessionId) {
            return;
          }

          setExecutionStatus(status);

          if (
            status.status === "SUCCESS" ||
            status.status === "REFUNDED" ||
            status.status === "FAILED"
          ) {
            setIsPollingStatus(false);
            return;
          }
        } catch (error) {
          if (isMountedRef.current) {
            setStatusError(getErrorMessage(error));
          }
        }

        await sleep(POLL_INTERVAL_MS);
      }

      if (isMountedRef.current) {
        setStatusError("Status polling timed out. Please check again shortly.");
        setIsPollingStatus(false);
      }
    },
    [],
  );

  const handleSwap = useCallback(async () => {
    if (!signedAccountId) {
      await signIn();
      return;
    }

    if (!selectedDestinationToken || !amountYocto || validationMessage) {
      return;
    }

    setSwapSubmitting(true);
    setSwapError(null);
    setStatusError(null);
    setDepositSubmitWarning(null);
    setExecutionStatus(null);

    try {
      const executableQuote = await fetchIntentsQuote({
        dry: false,
        destinationAsset: selectedDestinationToken.assetId,
        destinationBlockchain: selectedDestinationToken.blockchain,
        amount: amountYocto,
        recipient: recipient.trim(),
        refundTo: signedAccountId,
        slippageTolerance: DEFAULT_SLIPPAGE_BPS,
      });

      const depositAddress = executableQuote.quote.depositAddress;
      const depositMemo = executableQuote.quote.depositMemo;

      if (!depositAddress) {
        throw new Error("Quote did not include a deposit address.");
      }

      setLatestDepositAddress(depositAddress);
      setLatestDepositMemo(depositMemo || null);

      const transferResult = await transfer({
        receiverId: depositAddress,
        amount: executableQuote.quote.amountIn,
      });

      const txHash = extractTxHash(transferResult);
      if (!txHash) {
        throw new Error("Swap transaction hash could not be read from wallet response.");
      }

      setLatestTxHash(txHash);

      try {
        await submitIntentsDeposit({ txHash, depositAddress });
      } catch (error) {
        setDepositSubmitWarning(
          `Deposit submit skipped: ${getErrorMessage(error)}. Status polling will continue.`,
        );
      }

      await pollExecutionUntilTerminal(depositAddress, depositMemo);
    } catch (error) {
      setSwapError(getErrorMessage(error));
    } finally {
      if (isMountedRef.current) {
        setSwapSubmitting(false);
      }
    }
  }, [
    amountYocto,
    pollExecutionUntilTerminal,
    recipient,
    selectedDestinationToken,
    signIn,
    signedAccountId,
    transfer,
    validationMessage,
  ]);

  const handleDeployShadeAgent = useCallback(async () => {
    setDeployError(null);

    if (!signedAccountId) {
      await signIn();
      return;
    }

    if (!selectedPurchasedStrategy) {
      setDeployError("Select a purchased strategy to deploy.");
      return;
    }

    setDeployToastMessage(null);
    setDeployingAgent(true);
    try {
      await sleep(DEPLOY_CONFIRMATION_DELAY_MS);
      if (!isMountedRef.current) {
        return;
      }
      const destinationSymbol = selectedDestinationToken?.symbol ?? "Token";
      setDeployToastMessage(
        `Agent deployed for ${selectedPurchasedStrategy.name} on NEAR -> ${destinationSymbol}`,
      );
    } finally {
      if (isMountedRef.current) {
        setDeployingAgent(false);
      }
    }
  }, [selectedDestinationToken, selectedPurchasedStrategy, signIn, signedAccountId]);

  const onAmountChange = (nextValue: string) => {
    if (isDecimalInput(nextValue)) {
      setSellAmountInput(nextValue);
    }
  };

  const actionLabel = !signedAccountId
    ? walletLoading
      ? "Loading wallet..."
      : "Connect Wallet"
    : swapSubmitting
      ? "Submitting Swap..."
      : isPollingStatus
        ? `Tracking ${executionStatus?.status ?? "PROCESSING"}...`
        : "Swap";

  const canSwap =
    Boolean(signedAccountId) &&
    !walletLoading &&
    !tokensLoading &&
    !quoteLoading &&
    !swapSubmitting &&
    !isPollingStatus &&
    !validationMessage &&
    !quoteError &&
    Boolean(dryQuote);

  const actionDisabled = signedAccountId ? !canSwap : walletLoading;
  const deployButtonLabel = deployingAgent
    ? "Deploying Agent..."
    : !signedAccountId
      ? "Connect Wallet to Deploy"
      : selectedPurchasedStrategy
        ? "Deploy Shade Agent"
        : "Select Strategy to Deploy";
  const deployButtonDisabled =
    walletLoading ||
    purchasesLoading ||
    deployingAgent ||
    (Boolean(signedAccountId) && !selectedPurchasedStrategy);

  const statusTone = (status: ExecutionStatus | undefined) => {
    if (status === "SUCCESS") return "text-green-400";
    if (status === "REFUNDED" || status === "FAILED") return "text-red-400";
    return "text-yellow-300";
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="flex flex-col gap-6 mt-20">
        {(walletLoading ||
          tokensLoading ||
          tokensError ||
          validationMessage ||
          quoteError ||
          swapError ||
          statusError ||
          depositSubmitWarning) && (
          <div className="rounded-xl border border-white/10 bg-[#1E1F25] px-4 py-3 text-sm text-gray-300 space-y-1">
            {walletLoading && <p>Loading wallet...</p>}
            {tokensLoading && <p>Loading destination tokens...</p>}
            {tokensError && <p className="text-red-400">{tokensError}</p>}
            {validationMessage && signedAccountId && (
              <p className="text-yellow-300">{validationMessage}</p>
            )}
            {quoteError && <p className="text-red-400">{quoteError}</p>}
            {swapError && <p className="text-red-400">{swapError}</p>}
            {statusError && <p className="text-red-400">{statusError}</p>}
            {depositSubmitWarning && (
              <p className="text-yellow-300">{depositSubmitWarning}</p>
            )}
            {tokensError && (
              <button
                type="button"
                onClick={() => void loadTokens()}
                className="mt-2 px-3 py-1 rounded-md border border-white/20 hover:bg-white/10 transition-colors text-xs text-white"
              >
                Retry Tokens
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 relative">
          <div className="bg-[#18191D] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-sm font-medium">You Sell</span>
              <span className="text-gray-500 text-xs">Balance: {nearBalanceUi} NEAR</span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <button
                type="button"
                className="flex items-center gap-2 bg-[#2C2D35] pl-2 pr-3 py-1.5 rounded-full"
              >
                <div className="w-6 h-6 rounded-full bg-[#2A5ADA] flex items-center justify-center text-[10px] font-semibold text-white">
                  N
                </div>
                <span className="font-semibold text-lg text-white">NEAR</span>
              </button>
              <input
                type="text"
                value={sellAmountInput}
                onChange={(event) => onAmountChange(event.target.value)}
                className="bg-transparent text-right text-3xl md:text-4xl text-white font-light outline-none w-1/2 placeholder-gray-600"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-gray-500 text-sm">Near</span>
              <span className="text-gray-500 text-sm">
                {formatUsd(dryQuote?.quote.amountInUsd)}
              </span>
            </div>
          </div>

          <div className="bg-[#18191D] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-sm font-medium">You Buy</span>
              <span className="text-gray-500 text-xs">
                Destination: NEAR
              </span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <div ref={menuRef}>
                <DestinationTokenPicker
                  tokens={tokenOptions}
                  selectedAssetId={destinationAsset}
                  open={tokenMenuOpen}
                  onToggle={() => setTokenMenuOpen((open) => !open)}
                  onSelect={(assetId) => {
                    setDestinationAsset(assetId);
                    setTokenMenuOpen(false);
                  }}
                />
              </div>
              <input
                type="text"
                readOnly
                value={dryQuote?.quote.amountOutFormatted ?? "0"}
                className="bg-transparent text-right text-3xl md:text-4xl text-white font-light outline-none w-1/2 placeholder-gray-600 cursor-default"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-gray-500 text-sm">
                {selectedDestinationToken
                  ? `${selectedDestinationToken.symbol} on ${selectedDestinationToken.blockchain.toUpperCase()}`
                  : "Token"}
              </span>
              <span
                className={`text-sm ${dryQuote ? "text-gray-500" : "text-[#FF5656]"}`}
              >
                {dryQuote ? formatUsd(dryQuote.quote.amountOutUsd) : "Rate unavailable"}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#18191D] rounded-2xl p-4 border border-white/5">
          <label className="block text-sm text-gray-400 mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(event) => setRecipient(event.target.value)}
            placeholder={
              "Enter NEAR account (e.g. alice.near)"
            }
            className="w-full rounded-xl bg-[#2C2D35] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
          />
          
        </div>

        <div className="bg-[#1E1F25] rounded-xl p-4 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-2 text-[#E8CCA7] text-sm font-medium">
            <Info size={16} />
            <span>
              {quoteLoading
                ? "Fetching quote..."
                : dryQuote
                  ? `Estimated output: ${dryQuote.quote.amountOutFormatted}`
                  : "Quote unavailable for current inputs"}
              <span className="text-gray-500 font-normal">
                {" "}
                (
                {dryQuote?.quote.timeEstimate
                  ? `~${dryQuote.quote.timeEstimate}s`
                  : "no estimate"}
                )
              </span>
            </span>
          </div>
          <div className="text-gray-400 text-sm">{formatUsd(dryQuote?.quote.amountOutUsd)}</div>
        </div>

        <button
          type="button"
          disabled={actionDisabled}
          onClick={() => void handleSwap()}
          className={`w-full py-4 rounded-xl border font-semibold text-lg transition-all flex items-center justify-center gap-2 group ${
            actionDisabled
              ? "border-white/20 text-gray-400 cursor-not-allowed"
              : "border-[#FF7E56]/30 text-[#FF7E56] hover:bg-[#FF7E56]/10"
          }`}
        >
          <Wallet className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {actionLabel}
        </button>

        <div className="rounded-xl border border-white/10 bg-[#1E1F25] px-4 py-4 space-y-3">
          <label
            htmlFor="deploy-strategy-select"
            className="block text-sm text-gray-400"
          >
            Strategy
          </label>
          <select
            id="deploy-strategy-select"
            value={selectedPurchasedStrategyId}
            onChange={(event) => {
              setSelectedPurchasedStrategyId(event.target.value);
              setDeployError(null);
            }}
            disabled={!signedAccountId || purchasesLoading || purchasedStrategies.length === 0}
            className="w-full rounded-xl bg-[#2C2D35] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-white/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">Select purchased strategy</option>
            {purchasedStrategies.map((strategy) => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>

          {!signedAccountId && (
            <p className="text-xs text-gray-400">Connect wallet to load purchased strategies.</p>
          )}
          {signedAccountId && purchasesLoading && (
            <p className="text-xs text-gray-400">Loading purchased strategies...</p>
          )}
          {signedAccountId && purchasesError && (
            <p className="text-xs text-red-400">{purchasesError}</p>
          )}
          {signedAccountId &&
            !purchasesLoading &&
            !purchasesError &&
            purchasedStrategies.length === 0 && (
              <p className="text-xs text-gray-400">
                No purchased strategies found. Buy one in Marketplace.
              </p>
            )}
          {deployError && <p className="text-xs text-red-400">{deployError}</p>}

          <button
            type="button"
            onClick={() => void handleDeployShadeAgent()}
            disabled={deployButtonDisabled}
            className={`w-full py-3 rounded-xl border font-semibold text-sm transition-all ${
              deployButtonDisabled
                ? "border-white/20 text-gray-400 cursor-not-allowed"
                : "border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/10"
            }`}
          >
            {deployButtonLabel}
          </button>
        </div>

        {deployToastMessage && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"
          >
            {deployToastMessage}
          </div>
        )}

        {(executionStatus || latestDepositAddress || latestTxHash) && (
          <div className="rounded-xl border border-white/10 bg-[#1E1F25] px-4 py-3 text-sm space-y-2">
            {executionStatus && (
              <p className={statusTone(executionStatus.status)}>
                Status: {executionStatus.status}
              </p>
            )}
            {latestDepositAddress && (
              <p className="text-gray-300 break-all">
                Deposit: <span className="font-mono">{latestDepositAddress}</span>
              </p>
            )}
            {latestDepositMemo && (
              <p className="text-gray-300 break-all">
                Memo: <span className="font-mono">{latestDepositMemo}</span>
              </p>
            )}
            {latestTxHash && (
              <p className="text-gray-300 break-all">
                Tx:{" "}
                <a
                  href={`https://nearblocks.io/txns/${latestTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:underline"
                >
                  {latestTxHash}
                </a>
              </p>
            )}
            {latestDepositAddress && (
              <a
                href={`https://explorer.near-intents.org/transactions/${latestDepositAddress}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-blue-300 hover:underline"
              >
                Open NEAR Intents Explorer
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SwapWidget: React.FC = () => <SwapCard />;

export default SwapWidget;
