import type { Strategy } from "./types";

/** Your real NOVA listing (group created on-chain). Shown in Listings tab. */
export const MY_NOVA_LISTINGS: Strategy[] = [
  {
    id: "strategy.dca.1771267923284",
    name: "DCA",
    teaser: "Dollar-cost averaging strategy. Encrypted parameters; full details after purchase.",
    avgMonthlyReturn: "—",
    price: "25 NEAR",
    priceType: "one-time",
    rating: null,
    riskLevel: "medium",
    assetFocus: ["NEAR"],
    seller: "kasanova.nova-sdk.near",
    priceInNear: 25,
  },
];

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: "1",
    name: "ETH Momentum Alpha",
    teaser: "Trend-following on ETH with dynamic position sizing. No spoilers on entry logic.",
    avgMonthlyReturn: "+12.4%",
    price: "25 NEAR",
    priceType: "one-time",
    rating: 4.8,
    riskLevel: "medium",
    assetFocus: ["ETH"],
    seller: "trader.near",
  },
  {
    id: "2",
    name: "BTC/NEAR Rebalance",
    teaser: "Automated rebalancing between BTC and NEAR. Encrypted parameters.",
    avgMonthlyReturn: "+8.2%",
    price: "10 NEAR/mo",
    priceType: "subscription",
    rating: 4.5,
    riskLevel: "low",
    assetFocus: ["BTC", "NEAR"],
    seller: "defi.near",
  },
  {
    id: "3",
    name: "Volatility Harvest",
    teaser: "Options-style strategy for range-bound markets. Full details after purchase.",
    avgMonthlyReturn: "+15.1%",
    price: "50 NEAR",
    priceType: "one-time",
    rating: null,
    riskLevel: "high",
    assetFocus: ["ETH", "BTC"],
    seller: "alpha.near",
  },
];

export const RISK_OPTIONS = ["low", "medium", "high"] as const;
export const ASSET_OPTIONS = ["BTC", "ETH", "NEAR", "USDC"];
