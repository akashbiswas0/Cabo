import { Search } from "lucide-react";
import { RISK_OPTIONS, ASSET_OPTIONS } from "./constants";
import type { PriceTypeFilter } from "./types";

type Props = {
  searchQuery: string;
  onSearchChange: (v: string) => void;
  priceMin: string;
  onPriceMinChange: (v: string) => void;
  priceMax: string;
  onPriceMaxChange: (v: string) => void;
  riskFilter: string;
  onRiskFilterChange: (v: string) => void;
  assetFilter: string;
  onAssetFilterChange: (v: string) => void;
  priceTypeFilter: PriceTypeFilter;
  onPriceTypeFilterChange: (v: PriceTypeFilter) => void;
};

export default function MarketplaceFilters({
  searchQuery,
  onSearchChange,
  priceMin,
  onPriceMinChange,
  priceMax,
  onPriceMaxChange,
  riskFilter,
  onRiskFilterChange,
  assetFilter,
  onAssetFilterChange,
  priceTypeFilter,
  onPriceTypeFilterChange,
}: Props) {
  return (
    <div className="mb-8 space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/5 focus-within:border-white/20 transition-colors">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" aria-hidden />
          <input
            type="text"
            placeholder="Search strategies..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent outline-none text-white placeholder-gray-500 w-full text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Min price (NEAR)"
          value={priceMin}
          onChange={(e) => onPriceMinChange(e.target.value)}
          className="w-28 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-gray-500 focus:border-white/20 outline-none transition-colors"
        />
        <input
          type="text"
          placeholder="Max price (NEAR)"
          value={priceMax}
          onChange={(e) => onPriceMaxChange(e.target.value)}
          className="w-28 px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-gray-500 focus:border-white/20 outline-none transition-colors"
        />
        <select
          value={riskFilter}
          onChange={(e) => onRiskFilterChange(e.target.value)}
          className="pl-3 pr-8 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm appearance-none bg-no-repeat bg-[length:16px] bg-[right_0.5rem_center] focus:border-white/20 outline-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        >
          <option value="">Risk level</option>
          {RISK_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={assetFilter}
          onChange={(e) => onAssetFilterChange(e.target.value)}
          className="pl-3 pr-8 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm appearance-none bg-no-repeat bg-[length:16px] bg-[right_0.5rem_center] focus:border-white/20 outline-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        >
          <option value="">Asset focus</option>
          {ASSET_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={priceTypeFilter}
          onChange={(e) => onPriceTypeFilterChange(e.target.value as PriceTypeFilter)}
          className="pl-3 pr-8 py-2 rounded-xl border border-white/10 bg-white/5 text-white text-sm appearance-none bg-no-repeat bg-[length:16px] bg-[right_0.5rem_center] focus:border-white/20 outline-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
        >
          <option value="all">One-time or subscription</option>
          <option value="one-time">One-time</option>
          <option value="subscription">Subscription</option>
        </select>
      </div>
    </div>
  );
}
