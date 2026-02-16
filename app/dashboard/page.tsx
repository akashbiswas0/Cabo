"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useNearWallet } from "near-connect-hooks";
import {
  Search,
  ArrowUpRight,
  Leaf,
  ChevronDown,
  Gift,
  Brain,
  Wallet,
} from "lucide-react";

const SIDEBAR_NAV_ITEMS = [
  { id: "user" as const, label: "User", icon: Leaf },
  { id: "agent" as const, label: "Agent", icon: Brain },
];

const TABS = ["Tokens", "NFTs", "DeFi", "Transactions", "Spending Caps"];

const NEAR_PRICE_USD = 4.82;
const YOTTO_NEAR = BigInt(10 ** 24);

function formatNearBalance(yocto: bigint): string {
  const near = Number(yocto) / Number(YOTTO_NEAR);
  return near.toFixed(4);
}

// Mock agent data
const MOCK_AGENT = {
  totalUsd: "$1,247.32",
  changeUsd: "+$124.50",
  changePct: "+11.08%",
  tokens: [
    {
      name: "NEAR",
      symbol: "NEAR",
      sub: "NEAR Protocol",
      portfolioPct: "62%",
      price: "$4.82",
      priceChange: "+2.1%",
      balanceUsd: "$772.12",
      balanceRaw: "160.19 NEAR",
    },
    {
      name: "USDC",
      symbol: "USDC",
      sub: "USD Coin",
      portfolioPct: "38%",
      price: "$1.00",
      priceChange: "0%",
      balanceUsd: "$475.20",
      balanceRaw: "475.20 USDC",
    },
  ],
};

type TokenRow = {
  name: string;
  symbol: string;
  sub: string;
  portfolioPct: string;
  price: string;
  priceChange: string;
  balanceUsd: string;
  balanceRaw: string;
};

export default function DashboardPage() {
  const { signedAccountId, getBalance } = useNearWallet();
  const [viewMode, setViewMode] = useState<"user" | "agent">("user");
  const [userBalance, setUserBalance] = useState<bigint | null>(null);
  const [userTokens, setUserTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const fetchUserAssets = useCallback(async () => {
    if (!signedAccountId || !getBalance) return;
    setLoading(true);
    setBalanceError(null);
    try {
      const balance = await getBalance(signedAccountId);
      setUserBalance(balance);
      const nearRaw = formatNearBalance(balance);
      const nearNum = parseFloat(nearRaw);
      const usd = (nearNum * NEAR_PRICE_USD).toFixed(2);
      setUserTokens([
        {
          name: "NEAR",
          symbol: "NEAR",
          sub: "NEAR Protocol",
          portfolioPct: "100%",
          price: `$${NEAR_PRICE_USD.toFixed(2)}`,
          priceChange: "-1.24%",
          balanceUsd: `$${usd}`,
          balanceRaw: `${nearRaw} NEAR`,
        },
      ]);
    } catch (e) {
      setBalanceError(e instanceof Error ? e.message : "Failed to load balance");
      setUserTokens([]);
    } finally {
      setLoading(false);
    }
  }, [signedAccountId, getBalance]);

  useEffect(() => {
    if (viewMode === "user" && signedAccountId) {
      fetchUserAssets();
    }
  }, [viewMode, signedAccountId, fetchUserAssets]);

  const isUser = viewMode === "user";
  const tokens = isUser ? userTokens : MOCK_AGENT.tokens;
  const totalUsd = isUser
    ? userTokens[0]
      ? userTokens[0].balanceUsd
      : "$0.00"
    : MOCK_AGENT.totalUsd;
  const changeLine = isUser
    ? userTokens[0]
      ? "-$0.04 (-1.79%)"
      : "—"
    : `${MOCK_AGENT.changeUsd} (${MOCK_AGENT.changePct})`;
  const changePositive = !isUser;

  return (
    <div className="min-h-screen flex bg-background text-white">
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
      <aside className="relative z-10 w-56 md:w-64 flex-shrink-0 border-r border-white/10 bg-white/[0.02] flex flex-col min-h-screen">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="inline-block">
            <span className="text-xl font-serif italic font-normal tracking-tight text-white md:text-2xl">
              Cabo
            </span>
          </Link>
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
        <div className="p-4 border-t border-white/10">
          <a
            href="#"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Terms of Use
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col min-h-screen overflow-auto">
        {/* Top bar */}
        <header className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-5 border-b border-white/10">
          <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-gray-400">
              <Search className="w-4 h-4 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for a token..."
                className="bg-transparent border-none outline-none text-sm text-white placeholder-gray-400 w-40 md:w-52"
              />
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm">
              <Wallet className="w-5 h-5 text-white/80 flex-shrink-0" />
              {signedAccountId ? (
                <span className="font-mono text-white truncate max-w-[180px]" title={signedAccountId}>
                  {signedAccountId.length > 20
                    ? `${signedAccountId.slice(0, 10)}...${signedAccountId.slice(-8)}`
                    : signedAccountId}
                </span>
              ) : (
                <span className="text-gray-400">Connect wallet</span>
              )}
            </div>
          </div>
        </header>

        {/* Action buttons */}
        

        {/* Decentralized accounts / Assets */}
        <div className="flex-1 px-6 py-6">
          <h2 className="ml-2 text-2xl font-medium font-serif italic font-normal tracking-tight text-white mb-4">
            Accounts
          </h2>
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 mb-6">
            {viewMode === "user" && !signedAccountId && (
              <p className="text-gray-400 text-sm mb-4">
                Connect your NEAR wallet from the navbar to see your assets here.
              </p>
            )}
            {viewMode === "user" && signedAccountId && loading && (
              <p className="text-gray-400 text-sm mb-4">Loading balance…</p>
            )}
            {viewMode === "user" && balanceError && (
              <p className="text-red-400 text-sm mb-4">{balanceError}</p>
            )}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
              <div>
                <p className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  {totalUsd}
                </p>
                <p className={`text-sm mt-1 ${changePositive ? "text-green-400" : "text-red-400"}`}>
                  {changeLine}
                </p>
              </div>
              {viewMode === "user" && signedAccountId && (
                <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]" title={signedAccountId}>
                  {signedAccountId}
                </p>
              )}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 border-b border-white/10 mb-4">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                    i === 0
                      ? "text-white border-white"
                      : "text-gray-400 hover:text-white border-transparent"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Filters row */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white">
                <span className="font-mono text-xs">
                  {viewMode === "user" && signedAccountId
                    ? `${signedAccountId.slice(0, 8)}...${signedAccountId.slice(-4)}`
                    : viewMode === "agent"
                    ? "Agent (mock)"
                    : "Connect wallet"}
                </span>
                <ChevronDown className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white">
                <span className="flex gap-1">
                  <span className="w-5 h-5 rounded-full bg-orange-500/80 flex items-center justify-center text-[10px] font-bold">
                    OP
                  </span>
                  <span className="w-5 h-5 rounded-full bg-amber-400/80 flex items-center justify-center text-[10px] font-bold text-background">
                    +6
                  </span>
                </span>
                9 Networks
                <ChevronDown className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-gray-400">
                More
                <ChevronDown className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white">
                <Gift className="w-4 h-4" />
                Active Claims (4)
              </button>
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
                        {viewMode === "user" && !signedAccountId
                          ? "Connect your NEAR wallet to see tokens."
                          : "No tokens to show."}
                      </td>
                    </tr>
                  )}
                  {tokens.map((row) => (
                    <tr
                      key={row.symbol}
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
                        <p className={`text-sm ${row.priceChange.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
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
  );
}
