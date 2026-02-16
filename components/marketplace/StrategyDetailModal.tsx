"use client";
import { useState } from "react";
import { X, Star, Wallet, Loader2, CheckCircle2 } from "lucide-react";
import type { Strategy } from "./types";

type Props = {
  strategy: Strategy;
  onClose: () => void;
  isConnected: boolean;
  onConnect: () => void;
  onPurchase?: (strategy: Strategy) => Promise<void>;
};

export default function StrategyDetailModal({ strategy, onClose, isConnected, onConnect, onPurchase }: Props) {
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  const canPurchase = strategy.priceInNear != null && strategy.priceInNear > 0 && strategy.id.startsWith("strategy.");
  const handleBuy = async () => {
    if (!canPurchase || !onPurchase) return;
    setPurchaseError(null);
    setPurchasing(true);
    try {
      await onPurchase(strategy);
      setPurchaseSuccess(true);
    } catch (e) {
      setPurchaseError(e instanceof Error ? e.message : "Purchase failed");
    } finally {
      setPurchasing(false);
    }
  };

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
          {strategy.id.startsWith("strategy.") && (
            <span className="block text-xs text-gray-500 mt-0.5 font-serif italic">
              Price set by creator
            </span>
          )}
        </p>
        {purchaseSuccess ? (
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 flex items-center gap-2 text-green-300 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Purchase complete. You now have secure access to this strategy.
          </div>
        ) : (
          <>
            {purchaseError && (
              <p className="text-sm text-red-400 mb-3">{purchaseError}</p>
            )}
            {isConnected ? (
              <button
                type="button"
                disabled={!canPurchase || purchasing}
                onClick={handleBuy}
                className="w-full py-3 rounded-xl font-semibold text-white border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    {canPurchase ? `Buy with NEAR (${strategy.price})` : "Buy with NEAR"}
                  </>
                )}
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
          </>
        )}
        <p className="text-xs text-gray-500 mt-3 text-center font-serif italic">
          NEAR payment → NOVA secure access grant
        </p>
      </div>
    </div>
  );
}
