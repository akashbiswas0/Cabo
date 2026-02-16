import { Star } from "lucide-react";
import type { Strategy } from "./types";

type Props = { strategy: Strategy; onClick: () => void };

export default function StrategyCard({ strategy, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-white/15 hover:bg-white/[0.04] transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-white tracking-tight">{strategy.name}</h3>
        {strategy.rating != null && (
          <span className="flex items-center gap-1.5 text-sm text-gray-400 shrink-0">
            <Star className="w-4 h-4 fill-amber-400/90 text-amber-400/90" aria-hidden />
            {strategy.rating}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-400 line-clamp-2 mb-4 font-serif italic">{strategy.teaser}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mb-4">
        <span className="px-2.5 py-1 rounded-lg bg-white/10 text-gray-400">{strategy.riskLevel}</span>
        <span className="text-gray-500">{strategy.assetFocus.join(", ")}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400 font-serif italic">
          Avg monthly: <span className="text-green-400 font-medium not-italic">{strategy.avgMonthlyReturn}</span>
        </span>
        <span className="font-medium text-white">{strategy.price}</span>
      </div>
    </button>
  );
}
