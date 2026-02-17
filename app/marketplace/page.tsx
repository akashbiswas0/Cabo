"use client";
import React, { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useNearWallet } from "near-connect-hooks";
import {
  TrustPrivacyBanner,
  MarketplaceTabs,
  MarketplaceFilters,
  StrategyCard,
  StrategyCardSkeleton,
  StrategyDetailModal,
  UploadStrategyModal,
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
  const [myListings, setMyListings] = useState<Strategy[]>([]);
  const [apiPurchases, setApiPurchases] = useState<Strategy[]>([]);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [myListingsLoading, setMyListingsLoading] = useState(true);
  const [purchasesLoading, setPurchasesLoading] = useState(false);

  useEffect(() => {
    setListingsLoading(true);
    fetch("/api/marketplace/listings")
      .then((r) => r.json())
      .then((data) => setApiListings(Array.isArray(data) ? data : []))
      .catch(() => setApiListings([]))
      .finally(() => setListingsLoading(false));
  }, [showUploadModal]);

  useEffect(() => {
    setMyListingsLoading(true);
    fetch("/api/marketplace/listings?mine=1")
      .then((r) => r.json())
      .then((data) => setMyListings(Array.isArray(data) ? data : []))
      .catch(() => setMyListings([]))
      .finally(() => setMyListingsLoading(false));
  }, [showUploadModal]);

  useEffect(() => {
    if (!signedAccountId) {
      setApiPurchases([]);
      setPurchasesLoading(false);
      return;
    }
    setPurchasesLoading(true);
    fetch(`/api/marketplace/purchases?accountId=${encodeURIComponent(signedAccountId)}`)
      .then((r) => r.json())
      .then((data) => setApiPurchases(Array.isArray(data) ? data : []))
      .catch(() => setApiPurchases([]))
      .finally(() => setPurchasesLoading(false));
  }, [signedAccountId]);

  const purchasedGroupIds = useMemo(
    () => new Set(apiPurchases.map((s) => s.id)),
    [apiPurchases]
  );

  function getStrategiesForTab(tab: TabId): Strategy[] {
    if (tab === "discover") return apiListings;
    if (tab === "listings") return myListings;
    if (tab === "purchases") return apiPurchases;
    return [];
  }

  const handlePurchase = async (strategy: Strategy) => {
    if (!signedAccountId || strategy.priceInNear == null || strategy.priceInNear <= 0) {
      throw new Error("Cannot complete purchase");
    }
    if (purchasedGroupIds.has(strategy.id)) {
      throw new Error("You have already purchased this strategy.");
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
    setApiPurchases((prev) => [strategy, ...prev]);
  };

  const strategiesLoading =
    activeTab === "discover"
      ? listingsLoading
      : activeTab === "listings"
        ? myListingsLoading
        : purchasesLoading;

  const strategies = useMemo(
    () => getStrategiesForTab(activeTab),
    [activeTab, apiListings, myListings, apiPurchases]
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
          {strategiesLoading
            ? Array.from({ length: 6 }).map((_, i) => <StrategyCardSkeleton key={i} />)
            : filteredStrategies.map((strategy) => (
                <StrategyCard
                  key={strategy.id}
                  strategy={strategy}
                  onClick={() => setSelectedStrategy(strategy)}
                />
              ))}
        </div>

        {!strategiesLoading && filteredStrategies.length === 0 && (
          <p className="text-gray-500 text-center py-12 font-serif italic text-sm">
            {activeTab === "purchases"
              ? signedAccountId
                ? "You haven't purchased any strategies yet."
                : "Connect your wallet to see your purchases."
              : activeTab === "listings"
                ? "You haven't listed any strategies yet."
                : "No strategies match your filters."}
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
          alreadyPurchased={purchasedGroupIds.has(selectedStrategy.id)}
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
