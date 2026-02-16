"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNearWallet } from "near-connect-hooks";
import { ArrowDownUp, ChevronDown, Info, Wallet } from "lucide-react";
import {
  fetchAccountFtBalances,
  fetchFtMetadata,
  fetchUsdPrices,
  formatTokenBalance,
  isLpToken,
  mapSymbolToCoinGeckoId,
  toDisplayNumber,
  type QuoteResult,
  type TradeToken,
} from "@/lib/tradeData";

const NATIVE_NEAR_DECIMALS = 24;
const TRADE_NETWORK = "testnet";
const TESTNET_BUY_TOKEN_CONTRACTS = [
  "fusd.router_v3.nkta.testnet",
  "feth.router_v3.nkta.testnet",
  "fbtc.router_v3.nkta.testnet",
];

const EMPTY_QUOTE: QuoteResult = {
  buyAmount: "0",
  rateText: "Rate unavailable for selected pair",
  sellUsdText: "~ $0.00",
  buyUsdText: "Rate unavailable",
  hasQuote: false,
};

function formatCompactNumber(value: number, maxDecimals = 6): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "0";
  }

  if (value < 0.000001) {
    return value.toExponential(2);
  }

  return value.toFixed(maxDecimals).replace(/\.?0+$/, "");
}

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) {
    return "Rate unavailable";
  }
  return `~ $${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type TokenPickerProps = {
  label: "sell" | "buy";
  selectedToken: TradeToken | null;
  tokens: TradeToken[];
  open: boolean;
  onToggle: () => void;
  onSelect: (tokenId: string) => void;
};

const TokenPicker: React.FC<TokenPickerProps> = ({
  label,
  selectedToken,
  tokens,
  open,
  onToggle,
  onSelect,
}) => {
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
        <ChevronDown size={16} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 mt-2 z-30 min-w-[260px] max-h-64 overflow-y-auto rounded-xl border border-white/10 bg-[#1E1F25] shadow-xl p-2">
          {tokens.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-400">No tokens available</p>
          ) : (
            tokens.map((token) => (
              <button
                key={`${label}-${token.id}`}
                type="button"
                onClick={() => onSelect(token.id)}
                className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{token.symbol}</p>
                  <p className="text-xs text-gray-400 truncate">{token.name}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">
                  {formatTokenBalance(token.balanceRaw, token.decimals, 4)}
                </p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

const SwapCard: React.FC = () => {
  const {
    signedAccountId,
    signIn,
    getBalance,
    viewFunction,
    loading: walletLoading,
  } = useNearWallet();

  const [tokens, setTokens] = useState<TradeToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [sellTokenId, setSellTokenId] = useState("");
  const [buyTokenId, setBuyTokenId] = useState("");
  const [sellAmount, setSellAmount] = useState("0");
  const [buyAmount, setBuyAmount] = useState("0");
  const [quote, setQuote] = useState<QuoteResult>(EMPTY_QUOTE);
  const [sellMenuOpen, setSellMenuOpen] = useState(false);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);

  const sellMenuRef = useRef<HTMLDivElement | null>(null);
  const buyMenuRef = useRef<HTMLDivElement | null>(null);

  const loadTradeTokens = useCallback(async () => {
    if (!signedAccountId) {
      setTokens([]);
      setTokenError(null);
      setSellTokenId("");
      setBuyTokenId("");
      setLoadingTokens(false);
      return;
    }

    setLoadingTokens(true);
    setTokenError(null);

    try {
      const [nearBalance, ftBalances] = await Promise.all([
        getBalance(signedAccountId),
        fetchAccountFtBalances(signedAccountId, TRADE_NETWORK),
      ]);

      const balanceByContract = new Map(
        ftBalances.map((token) => [token.contract_id, token.balance]),
      );
      const candidateContracts = Array.from(
        new Set([
          ...ftBalances.map((token) => token.contract_id),
          ...TESTNET_BUY_TOKEN_CONTRACTS,
        ]),
      );

      const ftTokens = (
        await Promise.all(
          candidateContracts.map(async (contractId) => {
            const metadata = await fetchFtMetadata(viewFunction, contractId);
            if (!metadata) {
              return null;
            }

            if (isLpToken(metadata.symbol, metadata.name)) {
              return null;
            }

            return {
              id: contractId,
              symbol: metadata.symbol,
              name: metadata.name,
              decimals: metadata.decimals,
              balanceRaw: balanceByContract.get(contractId) ?? "0",
              balanceUi: toDisplayNumber(
                balanceByContract.get(contractId) ?? "0",
                metadata.decimals,
              ),
              usdPrice: null,
              isNative: false,
            } satisfies TradeToken;
          }),
        )
      ).filter((token) => token !== null);

      const nearToken: TradeToken = {
        id: "near-native",
        symbol: "NEAR",
        name: "Near",
        decimals: NATIVE_NEAR_DECIMALS,
        balanceRaw: nearBalance.toString(),
        balanceUi: toDisplayNumber(nearBalance.toString(), NATIVE_NEAR_DECIMALS),
        usdPrice: null,
        isNative: true,
      };

      const mergedTokens = [nearToken, ...ftTokens];
      const coingeckoIds = Array.from(
        new Set(
          mergedTokens
            .map((token) => mapSymbolToCoinGeckoId(token.symbol))
            .filter((id): id is string => Boolean(id)),
        ),
      );

      let usdPrices: Record<string, number> = {};
      if (coingeckoIds.length > 0) {
        try {
          usdPrices = await fetchUsdPrices(coingeckoIds);
        } catch {
          usdPrices = {};
        }
      }

      const pricedTokens = mergedTokens.map((token) => {
        const coingeckoId = mapSymbolToCoinGeckoId(token.symbol);
        return {
          ...token,
          usdPrice: coingeckoId ? (usdPrices[coingeckoId] ?? null) : null,
        };
      });

      setTokens(pricedTokens);
    } catch (error) {
      setTokens([]);
      setTokenError(
        error instanceof Error ? error.message : "Failed to load token balances",
      );
    } finally {
      setLoadingTokens(false);
    }
  }, [getBalance, signedAccountId, viewFunction]);

  useEffect(() => {
    void loadTradeTokens();
  }, [loadTradeTokens]);

  useEffect(() => {
    if (!sellMenuOpen && !buyMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;

      if (sellMenuRef.current && !sellMenuRef.current.contains(target)) {
        setSellMenuOpen(false);
      }
      if (buyMenuRef.current && !buyMenuRef.current.contains(target)) {
        setBuyMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [buyMenuOpen, sellMenuOpen]);

  useEffect(() => {
    if (tokens.length === 0) {
      setSellTokenId("");
      setBuyTokenId("");
      return;
    }

    setSellTokenId((current) => {
      if (current && tokens.some((token) => token.id === current)) {
        return current;
      }

      const nearToken = tokens.find((token) => token.isNative);
      return nearToken?.id ?? tokens[0].id;
    });
  }, [tokens]);

  useEffect(() => {
    if (tokens.length === 0) {
      setBuyTokenId("");
      return;
    }

    setBuyTokenId((current) => {
      if (
        current &&
        current !== sellTokenId &&
        tokens.some((token) => token.id === current)
      ) {
        return current;
      }

      if (!sellTokenId) {
        return tokens[0].id;
      }

      return tokens.find((token) => token.id !== sellTokenId)?.id ?? sellTokenId;
    });
  }, [sellTokenId, tokens]);

  const sellToken = useMemo(
    () => tokens.find((token) => token.id === sellTokenId) ?? null,
    [sellTokenId, tokens],
  );

  const buyToken = useMemo(
    () => tokens.find((token) => token.id === buyTokenId) ?? null,
    [buyTokenId, tokens],
  );

  useEffect(() => {
    if (!sellToken || !buyToken || sellToken.id === buyToken.id) {
      setBuyAmount("0");
      setQuote(EMPTY_QUOTE);
      return;
    }

    const parsedSellAmount = Number.parseFloat(sellAmount);
    const sellUsdPrice = sellToken.usdPrice;
    const buyUsdPrice = buyToken.usdPrice;

    if (
      !Number.isFinite(parsedSellAmount) ||
      parsedSellAmount <= 0 ||
      !sellUsdPrice ||
      !buyUsdPrice
    ) {
      setBuyAmount("0");
      setQuote({
        ...EMPTY_QUOTE,
        sellUsdText:
          Number.isFinite(parsedSellAmount) && parsedSellAmount > 0 && sellUsdPrice
            ? formatUsd(parsedSellAmount * sellUsdPrice)
            : "~ $0.00",
      });
      return;
    }

    const nextBuyAmount = (parsedSellAmount * sellUsdPrice) / buyUsdPrice;
    const rate = sellUsdPrice / buyUsdPrice;
    const normalizedBuyAmount = formatCompactNumber(nextBuyAmount, 6);
    setBuyAmount(normalizedBuyAmount);

    setQuote({
      buyAmount: normalizedBuyAmount,
      rateText: `1 ${sellToken.symbol} = ${formatCompactNumber(rate, 6)} ${buyToken.symbol}`,
      sellUsdText: formatUsd(parsedSellAmount * sellUsdPrice),
      buyUsdText: formatUsd(nextBuyAmount * buyUsdPrice),
      hasQuote: true,
    });
  }, [buyToken, sellAmount, sellToken]);

  const hasNonLpFtToken = tokens.some((token) => !token.isNative);

  const handleSellChange = (value: string) => {
    if (/^\d*\.?\d*$/.test(value)) {
      setSellAmount(value);
    }
  };

  const handleSelectSellToken = (tokenId: string) => {
    setSellTokenId(tokenId);
    setSellMenuOpen(false);

    if (tokenId === buyTokenId) {
      const nextBuy = tokens.find((token) => token.id !== tokenId)?.id;
      if (nextBuy) {
        setBuyTokenId(nextBuy);
      }
    }
  };

  const handleSelectBuyToken = (tokenId: string) => {
    setBuyTokenId(tokenId);
    setBuyMenuOpen(false);

    if (tokenId === sellTokenId) {
      const nextSell = tokens.find((token) => token.id !== tokenId)?.id;
      if (nextSell) {
        setSellTokenId(nextSell);
      }
    }
  };

  const handleSwapDirection = () => {
    if (!sellTokenId || !buyTokenId || sellTokenId === buyTokenId) {
      return;
    }
    setSellTokenId(buyTokenId);
    setBuyTokenId(sellTokenId);
  };

  const actionDisabled = walletLoading || Boolean(signedAccountId);
  const actionLabel = walletLoading
    ? "Loading wallet..."
    : signedAccountId
      ? "Swap Coming Soon"
      : "Connect Wallet";

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="flex flex-col gap-6 mt-20">
        {(walletLoading || loadingTokens || tokenError || (!tokenError && signedAccountId && !hasNonLpFtToken)) && (
          <div className="rounded-xl border border-white/10 bg-[#1E1F25] px-4 py-3 text-sm text-gray-300">
            {walletLoading && <p>Loading wallet...</p>}
            {!walletLoading && signedAccountId && loadingTokens && <p>Loading tokens...</p>}
            {!walletLoading && !signedAccountId && <p>Connect wallet to load balances.</p>}
            {!walletLoading && signedAccountId && !loadingTokens && !tokenError && !hasNonLpFtToken && (
              <p>No non-LP FT tokens found on testnet.</p>
            )}
            {tokenError && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-red-400">{tokenError}</p>
                <button
                  type="button"
                  onClick={() => void loadTradeTokens()}
                  className="px-3 py-1 rounded-md border border-white/20 hover:bg-white/10 transition-colors text-xs text-white"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 relative">
          <div className="bg-[#18191D] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-sm font-medium">You Sell</span>
              <span className="text-gray-500 text-xs">
                Balance:{" "}
                {sellToken
                  ? `${formatTokenBalance(sellToken.balanceRaw, sellToken.decimals, 6)} ${
                      sellToken.symbol
                    }`
                  : "0"}
              </span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <div ref={sellMenuRef}>
                <TokenPicker
                  label="sell"
                  selectedToken={sellToken}
                  tokens={tokens}
                  open={sellMenuOpen}
                  onToggle={() => {
                    setSellMenuOpen((open) => !open);
                    setBuyMenuOpen(false);
                  }}
                  onSelect={handleSelectSellToken}
                />
              </div>
              <input
                type="text"
                value={sellAmount}
                onChange={(event) => handleSellChange(event.target.value)}
                className="bg-transparent text-right text-3xl md:text-4xl text-white font-light outline-none w-1/2 placeholder-gray-600"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-gray-500 text-sm">{sellToken?.name ?? "Token"}</span>
              <span className="text-gray-500 text-sm">{quote.sellUsdText}</span>
            </div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="bg-[#18191D] p-1.5 rounded-full">
              <button
                type="button"
                onClick={handleSwapDirection}
                className="w-10 h-10 bg-[#2C2D35] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3C3D49] border border-white/5 shadow-lg transition-all active:rotate-180"
              >
                <ArrowDownUp size={18} />
              </button>
            </div>
          </div>

          <div className="bg-[#18191D] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-gray-400 text-sm font-medium">You Buy</span>
              <span className="text-gray-500 text-xs">
                Balance:{" "}
                {buyToken
                  ? `${formatTokenBalance(buyToken.balanceRaw, buyToken.decimals, 6)} ${
                      buyToken.symbol
                    }`
                  : "0"}
              </span>
            </div>

            <div className="flex justify-between items-center mb-1">
              <div ref={buyMenuRef}>
                <TokenPicker
                  label="buy"
                  selectedToken={buyToken}
                  tokens={tokens}
                  open={buyMenuOpen}
                  onToggle={() => {
                    setBuyMenuOpen((open) => !open);
                    setSellMenuOpen(false);
                  }}
                  onSelect={handleSelectBuyToken}
                />
              </div>
              <input
                type="text"
                readOnly
                value={buyAmount}
                className="bg-transparent text-right text-3xl md:text-4xl text-white font-light outline-none w-1/2 placeholder-gray-600 cursor-default"
                placeholder="0"
              />
            </div>

            <div className="flex justify-between items-center px-1">
              <span className="text-gray-500 text-sm">{buyToken?.name ?? "Token"}</span>
              <span className={`text-sm ${quote.hasQuote ? "text-gray-500" : "text-[#FF5656]"}`}>
                {quote.buyUsdText}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-[#1E1F25] rounded-xl p-4 flex items-center justify-between border border-white/5">
          <div className="flex items-center gap-2 text-[#E8CCA7] text-sm font-medium">
            <Info size={16} />
            <span>
              {quote.rateText}{" "}
              <span className="text-gray-500 font-normal">
                ({sellToken?.usdPrice ? `${formatUsd(sellToken.usdPrice)} per ${sellToken.symbol}` : "Price unavailable"})
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>{quote.hasQuote ? quote.buyUsdText : "—"}</span>
            <ChevronDown size={14} />
          </div>
        </div>

        <button
          type="button"
          disabled={actionDisabled}
          onClick={!signedAccountId ? () => void signIn() : undefined}
          className={`w-full py-4 rounded-xl border font-semibold text-lg transition-all flex items-center justify-center gap-2 group ${
            actionDisabled
              ? "border-white/20 text-gray-400 cursor-not-allowed"
              : "border-[#FF7E56]/30 text-[#FF7E56] hover:bg-[#FF7E56]/10"
          }`}
        >
          <Wallet className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

const SwapWidget: React.FC = () => <SwapCard />;

export default SwapWidget;
