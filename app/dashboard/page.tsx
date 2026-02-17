"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useNearWallet } from "near-connect-hooks";
import Navbar from "@/components/Navbar";
import {
  User,
  Brain,
} from "lucide-react";
import {
  fetchAccountFtBalances,
  fetchFtMetadata,
  formatTokenBalance,
  mapSymbolToCoinGeckoId,
  toDisplayNumber,
} from "@/lib/tradeData";

const SIDEBAR_NAV_ITEMS = [
  { id: "user" as const, label: "User", icon: User },
  { id: "agent" as const, label: "Agent", icon: Brain },
];

const NEAR_DECIMALS = 24;
const ONE_NEAR_YOCTO = "1000000000000000000000000";

type PriceSnapshot = {
  usd: number;
  usd_24h_change: number | null;
};

type TokenRow = {
  id: string;
  symbol: string;
  name: string;
  sub: string;
  portfolioPct: string;
  price: string;
  priceChange: string;
  balanceUsd: string;
  balanceRaw: string;
  usdValue: number | null;
};

type PortfolioData = {
  tokens: TokenRow[];
  totalUsd: number;
  changePct: number | null;
};

type Holding = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  balanceRaw: string;
  balanceUi: number;
};

const EMPTY_PORTFOLIO: PortfolioData = {
  tokens: [],
  totalUsd: 0,
  changePct: null,
};

function formatUsdAmount(value: number): string {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatTokenPrice(value: number): string {
  if (value >= 1) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  if (value >= 0.01) {
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    })}`;
  }

  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 6,
    maximumFractionDigits: 8,
  })}`;
}

type CoinGeckoPriceEntry = {
  usd?: unknown;
  usd_24h_change?: unknown;
};

function toPriceSnapshot(entry: CoinGeckoPriceEntry | undefined): PriceSnapshot | null {
  if (!entry) {
    return null;
  }

  const usd = entry.usd;
  if (typeof usd !== "number" || !Number.isFinite(usd)) {
    return null;
  }

  const maybeChange = entry.usd_24h_change;
  return {
    usd,
    usd_24h_change:
      typeof maybeChange === "number" && Number.isFinite(maybeChange)
        ? maybeChange
        : null,
  };
}

async function fetchUsdPriceSnapshot(
  coinIds: string[],
): Promise<Record<string, PriceSnapshot>> {
  const uniqueCoinIds = Array.from(new Set(coinIds.filter(Boolean)));
  if (uniqueCoinIds.length === 0) {
    return {};
  }

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", uniqueCoinIds.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch token prices (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, CoinGeckoPriceEntry>;

  const snapshot: Record<string, PriceSnapshot> = {};
  for (const coinId of uniqueCoinIds) {
    const parsed = toPriceSnapshot(payload?.[coinId]);
    if (!parsed) {
      continue;
    }

    snapshot[coinId] = parsed;
  }

  return snapshot;
}

async function fetchNearFtPriceSnapshot(
  contractIds: string[],
): Promise<Record<string, PriceSnapshot>> {
  const uniqueContractIds = Array.from(
    new Set(contractIds.map((contractId) => contractId.trim()).filter(Boolean)),
  );
  if (uniqueContractIds.length === 0) {
    return {};
  }

  const url = new URL("https://api.coingecko.com/api/v3/simple/token_price/near");
  url.searchParams.set("contract_addresses", uniqueContractIds.join(","));
  url.searchParams.set("vs_currencies", "usd");
  url.searchParams.set("include_24hr_change", "true");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch FT token prices (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, CoinGeckoPriceEntry>;
  const snapshot: Record<string, PriceSnapshot> = {};
  for (const contractId of uniqueContractIds) {
    const lowerContractId = contractId.toLowerCase();
    const parsed =
      toPriceSnapshot(payload?.[lowerContractId]) ?? toPriceSnapshot(payload?.[contractId]);
    if (!parsed) {
      continue;
    }
    snapshot[lowerContractId] = parsed;
  }

  return snapshot;
}

function buildChangeLine(totalUsd: number, changePct: number | null): string {
  if (changePct === null) {
    return "—";
  }

  const changeUsd = totalUsd * (changePct / 100);
  const sign = changeUsd >= 0 ? "+" : "-";
  const absUsd = Math.abs(changeUsd).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const pctLabel = `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`;
  return `${sign}$${absUsd} (${pctLabel})`;
}

export default function DashboardPage() {
  const { signedAccountId, signIn, transfer, getBalance, viewFunction, network } =
    useNearWallet();
  const [viewMode, setViewMode] = useState<"user" | "agent">("user");

  const [userPortfolio, setUserPortfolio] = useState<PortfolioData>(EMPTY_PORTFOLIO);
  const [agentPortfolio, setAgentPortfolio] = useState<PortfolioData>(EMPTY_PORTFOLIO);

  const [userLoading, setUserLoading] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);

  const [userError, setUserError] = useState<string | null>(null);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [fundingAgent, setFundingAgent] = useState(false);
  const [fundAgentMessage, setFundAgentMessage] = useState<string | null>(null);
  const [fundAgentError, setFundAgentError] = useState<string | null>(null);

  const agentAccountId = process.env.NEXT_PUBLIC_AGENT_ADDRESS?.trim() || "";

  const buildPortfolio = useCallback(
    async (accountId: string): Promise<PortfolioData> => {
      const [nearBalance, ftBalances] = await Promise.all([
        getBalance(accountId),
        fetchAccountFtBalances(accountId, network),
      ]);

      const holdings: Holding[] = [
        {
          id: "near-native",
          symbol: "NEAR",
          name: "Near Protocol",
          decimals: NEAR_DECIMALS,
          balanceRaw: nearBalance.toString(),
          balanceUi: toDisplayNumber(nearBalance.toString(), NEAR_DECIMALS),
        },
      ];

      const ftHoldings = await Promise.all(
        ftBalances.map(async ({ contract_id, balance }) => {
          const metadata = await fetchFtMetadata(viewFunction, contract_id);
          if (!metadata) {
            return null;
          }

          return {
            id: contract_id,
            symbol: metadata.symbol,
            name: metadata.name,
            decimals: metadata.decimals,
            balanceRaw: balance,
            balanceUi: toDisplayNumber(balance, metadata.decimals),
          } satisfies Holding;
        }),
      );

      holdings.push(...ftHoldings.filter((holding): holding is Holding => holding !== null));
      const visibleHoldings = holdings;

      const coinIdByHoldingId = new Map<string, string>();
      const coinIds: string[] = [];
      const ftContractIds: string[] = [];
      for (const holding of visibleHoldings) {
        if (holding.id !== "near-native") {
          ftContractIds.push(holding.id);
        }

        const coinId = mapSymbolToCoinGeckoId(holding.symbol);
        if (!coinId) {
          continue;
        }
        coinIdByHoldingId.set(holding.id, coinId);
        coinIds.push(coinId);
      }

      let coinPrices: Record<string, PriceSnapshot> = {};
      let ftPrices: Record<string, PriceSnapshot> = {};

      await Promise.all([
        (async () => {
          try {
            coinPrices = await fetchUsdPriceSnapshot(coinIds);
          } catch {
            coinPrices = {};
          }
        })(),
        (async () => {
          try {
            ftPrices = await fetchNearFtPriceSnapshot(ftContractIds);
          } catch {
            ftPrices = {};
          }
        })(),
      ]);

      let totalUsd = 0;
      let weightedChangeNumerator = 0;
      let weightedChangeDenominator = 0;

      const rows = visibleHoldings.map((holding) => {
        const coinId = coinIdByHoldingId.get(holding.id);
        const ftPricePoint =
          holding.id === "near-native" ? undefined : ftPrices[holding.id.toLowerCase()];
        const coinPricePoint = coinId ? coinPrices[coinId] : undefined;
        const pricePoint = ftPricePoint ?? coinPricePoint;

        const usdValue = pricePoint ? holding.balanceUi * pricePoint.usd : null;

        if (usdValue !== null && Number.isFinite(usdValue)) {
          totalUsd += usdValue;
          if (pricePoint?.usd_24h_change !== null && pricePoint?.usd_24h_change !== undefined) {
            weightedChangeNumerator += usdValue * pricePoint.usd_24h_change;
            weightedChangeDenominator += usdValue;
          }
        }

        return {
          id: holding.id,
          symbol: holding.symbol,
          name: holding.name,
          sub: holding.name,
          portfolioPct: "—",
          price: pricePoint ? formatTokenPrice(pricePoint.usd) : "N/A",
          priceChange:
            pricePoint?.usd_24h_change !== null &&
            pricePoint?.usd_24h_change !== undefined
              ? `${pricePoint.usd_24h_change >= 0 ? "+" : ""}${pricePoint.usd_24h_change.toFixed(2)}%`
              : "—",
          balanceUsd:
            usdValue !== null && Number.isFinite(usdValue)
              ? formatUsdAmount(usdValue)
              : "N/A",
          balanceRaw: `${formatTokenBalance(holding.balanceRaw, holding.decimals, 6)} ${holding.symbol}`,
          usdValue,
        } satisfies TokenRow;
      });

      const changePct =
        weightedChangeDenominator > 0
          ? weightedChangeNumerator / weightedChangeDenominator
          : null;

      const withPortfolioPct = rows.map((row) => {
        const pct =
          totalUsd > 0 && row.usdValue !== null
            ? `${((row.usdValue / totalUsd) * 100).toFixed(2)}%`
            : "—";
        return {
          ...row,
          portfolioPct: pct,
        };
      });

      withPortfolioPct.sort((a, b) => {
        const aUsd = a.usdValue ?? -1;
        const bUsd = b.usdValue ?? -1;
        if (aUsd === bUsd) {
          return a.symbol.localeCompare(b.symbol);
        }
        return bUsd - aUsd;
      });

      return {
        tokens: withPortfolioPct,
        totalUsd,
        changePct,
      };
    },
    [getBalance, network, viewFunction],
  );

  const fetchUserAssets = useCallback(async () => {
    if (!signedAccountId) {
      setUserPortfolio(EMPTY_PORTFOLIO);
      setUserError(null);
      return;
    }

    setUserLoading(true);
    setUserError(null);
    try {
      const portfolio = await buildPortfolio(signedAccountId);
      setUserPortfolio(portfolio);
    } catch (error) {
      setUserError(error instanceof Error ? error.message : "Failed to load user assets");
      setUserPortfolio(EMPTY_PORTFOLIO);
    } finally {
      setUserLoading(false);
    }
  }, [buildPortfolio, signedAccountId]);

  const fetchAgentAssets = useCallback(async () => {
    if (!agentAccountId) {
      setAgentPortfolio(EMPTY_PORTFOLIO);
      setAgentError(null);
      return;
    }

    setAgentLoading(true);
    setAgentError(null);
    try {
      const portfolio = await buildPortfolio(agentAccountId);
      setAgentPortfolio(portfolio);
    } catch (error) {
      setAgentError(error instanceof Error ? error.message : "Failed to load agent assets");
      setAgentPortfolio(EMPTY_PORTFOLIO);
    } finally {
      setAgentLoading(false);
    }
  }, [agentAccountId, buildPortfolio]);

  const handleFundAgent = useCallback(async () => {
    if (!agentAccountId) {
      setFundAgentError("Agent wallet address is missing. Set NEXT_PUBLIC_AGENT_ADDRESS.");
      setFundAgentMessage(null);
      return;
    }

    if (!signedAccountId) {
      signIn();
      return;
    }

    setFundingAgent(true);
    setFundAgentError(null);
    setFundAgentMessage(null);

    try {
      await transfer({
        receiverId: agentAccountId,
        amount: ONE_NEAR_YOCTO,
      });
      setFundAgentMessage("Successfully funded agent with 1 NEAR.");

      await Promise.all([fetchUserAssets(), fetchAgentAssets()]);
    } catch (error) {
      setFundAgentError(error instanceof Error ? error.message : "Failed to fund agent wallet.");
    } finally {
      setFundingAgent(false);
    }
  }, [agentAccountId, fetchAgentAssets, fetchUserAssets, signIn, signedAccountId, transfer]);

  useEffect(() => {
    if (signedAccountId) {
      void fetchUserAssets();
    } else {
      setUserPortfolio(EMPTY_PORTFOLIO);
      setUserError(null);
    }
  }, [signedAccountId, fetchUserAssets]);

  useEffect(() => {
    if (viewMode === "agent" && agentAccountId) {
      void fetchAgentAssets();
    }
  }, [viewMode, agentAccountId, fetchAgentAssets]);

  const isUser = viewMode === "user";
  const activePortfolio = isUser ? userPortfolio : agentPortfolio;
  const loading = isUser ? userLoading : agentLoading;
  const balanceError = isUser ? userError : agentError;

  const tokens = activePortfolio.tokens;
  const totalUsd = formatUsdAmount(activePortfolio.totalUsd);
  const changeLine = buildChangeLine(activePortfolio.totalUsd, activePortfolio.changePct);
  const changePositive = (activePortfolio.changePct ?? 0) >= 0;
  const changeClass =
    activePortfolio.changePct === null
      ? "text-gray-400"
      : changePositive
        ? "text-green-400"
        : "text-red-400";

  return (
    <div className="min-h-screen bg-background text-white">
      <Navbar />
      <div className="min-h-screen flex">
      {/* Mini grid background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Sidebar */}
      <aside className="relative z-10 w-56 md:w-64 flex-shrink-0 border-r border-white/10 bg-white/[0.02] flex flex-col min-h-screen pt-24">
        <div className="p-6 border-b border-white/10">
          
        </div>
        <nav className="flex-1 p-4 space-y-0.5">
          {SIDEBAR_NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setViewMode(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                viewMode === item.id
                  ? "bg-white/10 text-white"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col min-h-screen overflow-auto pt-24">
        <div className="flex-1 px-6 py-6">
          <h2 className="ml-2 text-2xl font-medium font-serif italic font-normal tracking-tight text-white mb-4">
            Accounts
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
            {!isUser && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleFundAgent}
                  disabled={fundingAgent || !agentAccountId}
                  className="px-4 py-2.5 text-sm font-medium border border-white/20 rounded-full hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!signedAccountId
                    ? "Connect wallet to fund agent"
                    : fundingAgent
                      ? "Funding agent..."
                      : "Fund Agent (1 NEAR)"}
                </button>
              </div>
            )}
            {isUser && !signedAccountId && (
              <p className="text-gray-400 text-sm mb-4">
                Connect your NEAR wallet from the navbar to see your assets here.
              </p>
            )}
            {!isUser && !agentAccountId && (
              <p className="text-yellow-300 text-sm mb-4">
                Set NEXT_PUBLIC_AGENT_ADDRESS to load agent portfolio.
              </p>
            )}
            {loading && (
              <p className="text-gray-400 text-sm mb-4">
                Loading {isUser ? "wallet" : "agent"} assets…
              </p>
            )}
            {balanceError && <p className="text-red-400 text-sm mb-4">{balanceError}</p>}
            {!isUser && fundAgentMessage && (
              <p className="text-green-400 text-sm mb-4">{fundAgentMessage}</p>
            )}
            {!isUser && fundAgentError && (
              <p className="text-red-400 text-sm mb-4">{fundAgentError}</p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">{totalUsd}</p>
                <p className={`text-sm mt-1 ${changeClass}`}>{changeLine}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-xs font-medium uppercase tracking-wider">
                    <th className="py-4 px-4">Token</th>
                    <th className="py-4 px-4">
                      Portfolio % <span className="inline-block ml-0.5">↓</span>
                    </th>
                    <th className="py-4 px-4">Price (24hr)</th>
                    <th className="py-4 px-4">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.length === 0 && !loading && (
                    <tr>
                      <td colSpan={4} className="py-8 px-4 text-center text-gray-400 text-sm">
                        {isUser && !signedAccountId
                          ? "Connect your NEAR wallet to see tokens."
                          : !isUser && !agentAccountId
                            ? "Set NEXT_PUBLIC_AGENT_ADDRESS to load agent tokens."
                            : "No tokens to show."}
                      </td>
                    </tr>
                  )}
                  {tokens.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors last:border-0"
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white">
                            {row.symbol[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-white">{row.symbol}</p>
                            <p className="text-sm text-gray-400">{row.sub}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white">{row.portfolioPct}</td>
                      <td className="py-4 px-4">
                        <p className="text-white">{row.price}</p>
                        <p
                          className={`text-sm ${
                            row.priceChange === "—"
                              ? "text-gray-400"
                              : row.priceChange.startsWith("+")
                                ? "text-green-400"
                                : "text-red-400"
                          }`}
                        >
                          {row.priceChange}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-white">{row.balanceUsd}</p>
                        <p className="text-sm text-gray-400">{row.balanceRaw}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
