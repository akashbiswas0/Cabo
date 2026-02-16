import type { Strategy } from "./types";
import type { PriceTypeFilter } from "./types";

export function parsePrice(priceStr: string): number {
  return parseFloat(priceStr.replace(/[^0-9.]/g, "")) || 0;
}

export function filterStrategies(
  strategies: Strategy[],
  opts: {
    searchQuery: string;
    priceMin: string;
    priceMax: string;
    riskFilter: string;
    assetFilter: string;
    priceTypeFilter: PriceTypeFilter;
  }
): Strategy[] {
  const {
    searchQuery,
    priceMin,
    priceMax,
    riskFilter,
    assetFilter,
    priceTypeFilter,
  } = opts;
  const q = searchQuery.toLowerCase();
  return strategies.filter((s) => {
    if (q && !s.name.toLowerCase().includes(q) && !s.teaser.toLowerCase().includes(q))
      return false;
    if (riskFilter && s.riskLevel !== riskFilter) return false;
    if (assetFilter && !s.assetFocus.includes(assetFilter)) return false;
    if (priceTypeFilter !== "all" && s.priceType !== priceTypeFilter) return false;
    const price = parsePrice(s.price);
    if (priceMin && price < parseFloat(priceMin)) return false;
    if (priceMax && price > parseFloat(priceMax)) return false;
    return true;
  });
}
