"use client";
import React, { useState, useMemo } from "react";
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
  filterStrategies,
} from "@/components/marketplace";
import type { TabId, Strategy, PriceTypeFilter } from "@/components/marketplace";

function getStrategiesForTab(tab: TabId): Strategy[] {
  if (tab === "discover") return MOCK_STRATEGIES;
  if (tab === "listings") return MOCK_STRATEGIES.slice(0, 1);
  return MOCK_STRATEGIES.slice(1, 2);
}

export default function MarketplacePage() {
  const { signedAccountId, signIn } = useNearWallet();
  const [activeTab, setActiveTab] = useState<TabId>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [assetFilter, setAssetFilter] = useState("");
  const [priceTypeFilter, setPriceTypeFilter] = useState<PriceTypeFilter>("all");
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const strategies = useMemo(() => getStrategiesForTab(activeTab), [activeTab]);
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
