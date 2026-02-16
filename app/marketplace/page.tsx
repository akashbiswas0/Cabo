"use client";
import React, { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useNearWallet } from "near-connect-hooks";
import {
  TrustPrivacyBanner,
  MarketplaceTabs,
  MarketplaceFilters,
  StrategyCard,
  StrategyDetailModal,
  UploadStrategyModal,
  MOCK_STRATEGIES,
  MY_NOVA_LISTINGS,
  filterStrategies,
} from "@/components/marketplace";
import type { TabId, Strategy, PriceTypeFilter } from "@/components/marketplace";

/** 1 NEAR in yoctoNEAR (string) for wallet transfer. */
function nearToYocto(near: number): string {
  return (BigInt(Math.floor(near * 1e24))).toString();
}

export default function MarketplacePage() {
  const { signedAccountId, signIn, transfer } = useNearWallet();
  const [activeTab, setActiveTab] = useState<TabId>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [priceTypeFilter, setPriceTypeFilter] = useState<PriceTypeFilter>("all");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [apiListings, setApiListings] = useState<Strategy[]>([]);

  useEffect(() => {
    fetch("/api/marketplace/listings")
      .then((r) => r.json())
      .then((data) => setApiListings(Array.isArray(data) ? data : []))
      .catch(() => setApiListings([]));
  }, [showUploadModal]);

  const realListings = apiListings.length > 0 ? apiListings : MY_NOVA_LISTINGS;

  function getStrategiesForTab(tab: TabId): Strategy[] {
    if (tab === "discover") return [...realListings, ...MOCK_STRATEGIES];
    if (tab === "listings") return realListings;
    return MOCK_STRATEGIES.slice(1, 2);
  }

  const handlePurchase = async (strategy: Strategy) => {
    if (!signedAccountId || strategy.priceInNear == null || strategy.priceInNear <= 0) {
      throw new Error("Cannot complete purchase");
    }
    const amountYocto = nearToYocto(strategy.priceInNear);
    await transfer({
      receiverId: strategy.seller,
      amount: amountYocto,
    });
    const res = await fetch("/api/marketplace/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groupId: strategy.id,
        buyerAccountId: signedAccountId,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || data.error || "Purchase failed");
  };

  const strategies = useMemo(
    () => getStrategiesForTab(activeTab),
    [activeTab, realListings]
  );
  const filteredStrategies = useMemo(
    () =>
      filterStrategies(strategies, {
        searchQuery,
        priceMin,
        priceMax,
        riskFilter,
        assetFilter,
        priceTypeFilter,
      }),
    [
      strategies,
      searchQuery,
      priceMin,
      priceMax,
      riskFilter,
      assetFilter,
      priceTypeFilter,
    ]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-white">
      <Navbar />

      <main className="flex-1 pt-24 pb-12 px-4 md:px-6 max-w-6xl mx-auto w-full">
        <div className="mb-8">
          <TrustPrivacyBanner variant="banner" />
        </div>

        <MarketplaceTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onListNew={() => setShowUploadModal(true)}
        />

        {activeTab === "discover" && (
          <MarketplaceFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            priceMin={priceMin}
            onPriceMinChange={setPriceMin}
            priceMax={priceMax}
            onPriceMaxChange={setPriceMax}
            riskFilter={riskFilter}
            onRiskFilterChange={setRiskFilter}
            assetFilter={assetFilter}
            onAssetFilterChange={setAssetFilter}
            priceTypeFilter={priceTypeFilter}
            onPriceTypeFilterChange={setPriceTypeFilter}
          />
        )}

        {(activeTab === "listings" || activeTab === "purchases") && (
          <p className="text-gray-400 text-sm mb-6 font-serif italic">
            {activeTab === "listings"
              ? "Strategies you've listed for sale."
              : "Strategies you've purchased."}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onClick={() => setSelectedStrategy(strategy)}
            />
          ))}
        </div>

        {filteredStrategies.length === 0 && (
          <p className="text-gray-500 text-center py-12 font-serif italic text-sm">
            No strategies match your filters.
          </p>
        )}
      </main>

      {selectedStrategy && (
        <StrategyDetailModal
          strategy={selectedStrategy}
          onClose={() => setSelectedStrategy(null)}
          isConnected={!!signedAccountId}
          onConnect={() => signIn()}
          onPurchase={handlePurchase}
        />
      )}

      {showUploadModal && (
        <UploadStrategyModal onClose={() => setShowUploadModal(false)} />
      )}

      <footer className="border-t border-white/10 py-8 px-4 md:px-6 max-w-6xl mx-auto w-full mt-auto">
        <div id="faq">
          <TrustPrivacyBanner variant="footer" />
        </div>
      </footer>
    </div>
  );
}
