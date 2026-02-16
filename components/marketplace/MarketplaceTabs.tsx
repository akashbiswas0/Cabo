import { Plus } from "lucide-react";
import type { TabId } from "./types";

const TABS: { id: TabId; label: string }[] = [
  { id: "discover", label: "Discover" },
  { id: "listings", label: "My Listings" },
  { id: "purchases", label: "My Purchases" },
];

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onListNew: () => void;
};

export default function MarketplaceTabs({ activeTab, onTabChange, onListNew }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex gap-1 border-b border-white/10">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? "text-white border-white"
                : "text-gray-400 border-transparent hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <button
        onClick={onListNew}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors w-fit"
      >
        <Plus className="w-4 h-4 flex-shrink-0" aria-hidden />
        List New Strategy
      </button>
    </div>
  );
}
