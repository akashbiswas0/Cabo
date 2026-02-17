"use client";
import { useState } from "react";
import { X, Star, Wallet, Loader2, CheckCircle2, FileJson } from "lucide-react";
import type { Strategy } from "./types";

type Props = {
  strategy: Strategy;
  onClose: () => void;
  isConnected: boolean;
  onConnect: () => void;
  onPurchase?: (strategy: Strategy) => Promise<void>;
  /** True if this user has already purchased this strategy (one purchase per user). */
  alreadyPurchased?: boolean;
  /** Called when user chooses Pay with Pingpay (redirects to Pingpay). */
  onPayWithPingpay?: (strategy: Strategy) => Promise<void>;
};

export default function StrategyDetailModal({ strategy, onClose, isConnected, onConnect, onPurchase, onPayWithPingpay, alreadyPurchased }: Props) {
  const [purchasing, setPurchasing] = useState(false);
  const [pingpayRedirecting, setPingpayRedirecting] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [strategyContent, setStrategyContent] = useState<string | null>(null);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyError, setStrategyError] = useState<string | null>(null);

  const canPurchase =
    !alreadyPurchased &&
    strategy.priceInNear != null &&
    strategy.priceInNear > 0 &&
    strategy.id.startsWith("strategy.");
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

  const handlePayWithPingpay = async () => {
    if (!canPurchase || !onPayWithPingpay) return;
    setPurchaseError(null);
    setPingpayRedirecting(true);
    try {
      await onPayWithPingpay(strategy);
    } catch (e) {
      setPurchaseError(e instanceof Error ? e.message : "Failed to start checkout");
      setPingpayRedirecting(false);
    }
  };

  const handleViewStrategy = async () => {
    if (!strategy.cid) return;
    setStrategyModalOpen(true);
    setStrategyContent(null);
    setStrategyError(null);
    setStrategyLoading(true);
    try {
      const res = await fetch(
        `/api/marketplace/retrieve?groupId=${encodeURIComponent(strategy.id)}&cid=${encodeURIComponent(strategy.cid)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setStrategyError(data.detail || data.error || "Failed to load strategy");
        return;
      }
      const text = data.data_text ?? (data.data_base64 ? atob(data.data_base64) : null);
      if (text) {
        try {
          const parsed = JSON.parse(text);
          setStrategyContent(JSON.stringify(parsed, null, 2));
        } catch {
          setStrategyContent(text);
        }
      } else {
        setStrategyError("No content returned");
      }
    } catch (e) {
      setStrategyError(e instanceof Error ? e.message : "Failed to load strategy");
    } finally {
      setStrategyLoading(false);
    }
  };

  const owned = purchaseSuccess || alreadyPurchased;

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
        {strategy.cid && (
          <p className="text-sm text-gray-500 mb-4">
            <span className="text-gray-500">IPFS CID</span>
            <span className="block font-mono text-white text-xs break-all mt-0.5">{strategy.cid}</span>
          </p>
        )}
        {owned ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 flex items-center gap-2 text-green-300 text-sm">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              {purchaseSuccess ? "Purchase complete. You now have secure access to this strategy." : "You already own this strategy. One purchase per user."}
            </div>
            {strategy.cid && (
              <button
                type="button"
                onClick={handleViewStrategy}
                className="w-full py-2.5 rounded-xl font-medium text-white border border-white/20 bg-white/10 hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <FileJson className="w-4 h-4" />
                View strategy (JSON)
              </button>
            )}
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
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onConnect}
                  className="w-full py-3 rounded-xl font-semibold text-white border border-white/20 bg-white/10 hover:bg-white hover:text-black transition-all flex items-center justify-center gap-2"
                >
                  <Wallet className="w-5 h-5" />
                  Connect wallet to buy
                </button>
                {canPurchase && onPayWithPingpay && (
                  <button
                    type="button"
                    disabled={pingpayRedirecting}
                    onClick={handlePayWithPingpay}
                    className="w-full py-2.5 rounded-xl font-medium text-white border border-white/20 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {pingpayRedirecting ? (
                      <>Redirecting to Pingpay…</>
                    ) : (
                      <>Pay with Pingpay</>
                    )}
                  </button>
                )}
              </div>
            )}
          </>
        )}
        <p className="text-xs text-gray-500 mt-3 text-center font-serif italic">
          NEAR payment → NOVA secure access grant
        </p>
      </div>

      {strategyModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70"
          onClick={() => setStrategyModalOpen(false)}
        >
          <div
            className="rounded-2xl border border-white/10 bg-background p-6 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Strategy data</h3>
              <button
                onClick={() => setStrategyModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {strategyLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin" />
                Loading…
              </div>
            ) : strategyError ? (
              <p className="text-sm text-red-400 py-4">{strategyError}</p>
            ) : strategyContent ? (
              <pre className="flex-1 overflow-auto rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-gray-300 font-mono whitespace-pre-wrap break-words">
                {strategyContent}
              </pre>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
