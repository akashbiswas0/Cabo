import { X, Star, Wallet } from "lucide-react";
import type { Strategy } from "./types";

type Props = {
  strategy: Strategy;
  onClose: () => void;
  isConnected: boolean;
  onConnect: () => void;
};

export default function StrategyDetailModal({ strategy, onClose, isConnected, onConnect }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <div
        className="rounded-2xl border border-white/10 bg-background p-6 max-w-lg w-full shadow-xl backdrop-blur-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-white">{strategy.name}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-400 text-sm mb-4 font-serif italic">{strategy.teaser}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-xs text-gray-400">
            {strategy.riskLevel}
          </span>
          <span className="text-xs text-gray-400">
            Focus: {strategy.assetFocus.join(", ")}
          </span>
          {strategy.rating != null && (
            <span className="flex items-center gap-1.5 text-xs text-gray-400">
              <Star className="w-3.5 h-3.5 fill-amber-400/90 text-amber-400/90" aria-hidden /> {strategy.rating}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-2 font-serif italic">
          Avg monthly return: <span className="text-green-400 not-italic font-medium">{strategy.avgMonthlyReturn}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Seller: <span className="text-white font-mono">{strategy.seller}</span>
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Price: <span className="text-white font-medium">{strategy.price}</span>
        </p>
        {isConnected ? (
          <button
            type="button"
            className="w-full py-3 rounded-xl font-semibold text-white border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Buy with NEAR
          </button>
        ) : (
          <button
            type="button"
            onClick={onConnect}
            className="w-full py-3 rounded-xl font-semibold text-white border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Connect wallet to buy
          </button>
        )}
        <p className="text-xs text-gray-500 mt-3 text-center font-serif italic">
          NEAR payment → NOVA secure access grant
        </p>
      </div>
    </div>
  );
}
