export type Network = "mainnet" | "testnet";

export type FastNearFtToken = {
  contract_id: string;
  balance: string;
};

export type FtMetadata = {
  name: string;
  symbol: string;
  decimals: number;
};

export type TradeToken = {
  id: string;
  symbol: string;
  name: string;
  decimals: number;
  balanceRaw: string;
  balanceUi: number;
  usdPrice: number | null;
  isNative: boolean;
};

export type QuoteResult = {
  buyAmount: string;
  rateText: string;
  sellUsdText: string;
  buyUsdText: string;
  hasQuote: boolean;
};

type ViewFunction = (params: {
  contractId: string;
  method: string;
  args?: Record<string, unknown>;
}) => Promise<unknown>;

const COINGECKO_SYMBOL_MAP: Record<string, string> = {
  NEAR: "near",
  WNEAR: "near",
  BTC: "bitcoin",
  WBTC: "bitcoin",
  HBTC: "bitcoin",
  FBTC: "bitcoin",
  ETH: "ethereum",
  WETH: "ethereum",
  FETH: "ethereum",
  USDC: "usd-coin",
  FUSD: "usd-coin",
  USDT: "tether",
  DAI: "dai",
};

function parseRawAmount(raw: string): bigint {
  try {
    return BigInt(raw);
  } catch {
    return BigInt(0);
  }
}

export function getFastNearBaseUrl(network: Network): string {
  return network === "testnet"
    ? "https://test.api.fastnear.com"
    : "https://api.fastnear.com";
}

export async function fetchAccountFtBalances(
  accountId: string,
  network: Network,
): Promise<FastNearFtToken[]> {
  const baseUrl = getFastNearBaseUrl(network);
  const response = await fetch(
    `${baseUrl}/v1/account/${encodeURIComponent(accountId)}/ft`,
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch token balances (${response.status})`);
  }

  const payload = (await response.json()) as { tokens?: FastNearFtToken[] };
  if (!Array.isArray(payload.tokens)) {
    return [];
  }

  return payload.tokens.filter(
    (token): token is FastNearFtToken =>
      Boolean(token?.contract_id) && typeof token.balance === "string",
  );
}

export async function fetchFtMetadata(
  viewFunction: ViewFunction,
  contractId: string,
): Promise<FtMetadata | null> {
  try {
    const result = await viewFunction({
      contractId,
      method: "ft_metadata",
      args: {},
    });

    if (!result || typeof result !== "object") {
      return null;
    }

    const metadata = result as {
      symbol?: unknown;
      name?: unknown;
      decimals?: unknown;
    };

    const symbol =
      typeof metadata.symbol === "string" ? metadata.symbol.trim() : "";
    const name = typeof metadata.name === "string" ? metadata.name.trim() : "";
    const decimals =
      typeof metadata.decimals === "number"
        ? metadata.decimals
        : Number(metadata.decimals);

    if (!symbol || !name || !Number.isFinite(decimals) || decimals < 0) {
      return null;
    }

    return {
      symbol: symbol.toUpperCase(),
      name,
      decimals: Math.trunc(decimals),
    };
  } catch {
    return null;
  }
}

export function formatTokenBalance(
  raw: string,
  decimals: number,
  precision = 4,
): string {
  const amount = parseRawAmount(raw);
  const zero = BigInt(0);
  const sign = amount < zero ? "-" : "";
  const absolute = amount < zero ? -amount : amount;

  if (decimals <= 0) {
    return `${sign}${absolute.toString()}`;
  }

  const divisor = BigInt(10) ** BigInt(decimals);
  const whole = absolute / divisor;
  const fraction = (absolute % divisor).toString().padStart(decimals, "0");

  const maxPrecision = Math.max(0, Math.min(decimals, precision));
  const clippedFraction = fraction.slice(0, maxPrecision).replace(/0+$/, "");

  if (!clippedFraction) {
    return `${sign}${whole.toString()}`;
  }

  return `${sign}${whole.toString()}.${clippedFraction}`;
}

export function toDisplayNumber(raw: string, decimals: number): number {
  const normalized = formatTokenBalance(raw, decimals, 8);
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function mapSymbolToCoinGeckoId(symbol: string): string | null {
  const normalized = symbol.trim().toUpperCase();
  return COINGECKO_SYMBOL_MAP[normalized] ?? null;
}

export async function fetchUsdPrices(
  coinIds: string[],
): Promise<Record<string, number>> {
  const uniqueCoinIds = Array.from(new Set(coinIds.filter(Boolean)));
  if (uniqueCoinIds.length === 0) {
    return {};
  }

  const url = new URL("https://api.coingecko.com/api/v3/simple/price");
  url.searchParams.set("ids", uniqueCoinIds.join(","));
  url.searchParams.set("vs_currencies", "usd");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Failed to fetch token prices (${response.status})`);
  }

  const payload = (await response.json()) as Record<string, { usd?: unknown }>;
  const prices: Record<string, number> = {};

  for (const coinId of uniqueCoinIds) {
    const maybePrice = payload?.[coinId]?.usd;
    if (typeof maybePrice === "number" && Number.isFinite(maybePrice)) {
      prices[coinId] = maybePrice;
    }
  }

  return prices;
}

export function isLpToken(symbol: string, name: string): boolean {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const normalizedName = name.trim().toLowerCase();

  return (
    normalizedSymbol.startsWith("LP-") ||
    normalizedName.startsWith("lp token") ||
    normalizedName.includes("liquidity pool") ||
    normalizedName.includes("pool token")
  );
}
