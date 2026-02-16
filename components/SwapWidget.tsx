"use client";
import React, { useState, useEffect } from 'react';
import { 
  ArrowDownUp, 
  Settings, 
  RefreshCw, 
  PlusCircle, 
  ChevronDown, 
  Wallet,
  Info,
  BarChart3,
  Activity
} from 'lucide-react';

const TradeInterface: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8 lg:gap-16 items-start justify-center">
      {/* Left Column: Chart & Market Data */}
      <div className="flex-1 w-full lg:max-w-3xl">
       
        <div className="mt-8 h-[400px] w-full">
         
        </div>
      </div>

      {/* Right Column: Swap Interface */}
      <div className="w-full lg:w-[480px] shrink-0">
        <SwapCard />
      </div>
    </div>
  );
};

/** Centered swap card with slightly wider width for use on /trade page */
const SwapWidget: React.FC = () => (
  <div className="w-full max-w-[480px] mx-auto">
    <SwapCard />
  </div>
);

// --- Sub-components ---

const MarketHeader = () => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center gap-2 cursor-pointer group w-fit">
      <h2 className="text-2xl md:text-3xl text-gray-200 font-medium">NEAR/USDC</h2>
      <ChevronDown className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
    </div>
    
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div className="flex items-baseline gap-3">
        <span className="text-4xl md:text-5xl font-light text-[#E8CCA7] tracking-tight">254.59604</span>
        <span className="text-[#4CD964] font-medium text-sm">(+1.13%)</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex gap-2 bg-[#1E1F25] rounded-lg p-1">
          <button className="p-1.5 hover:bg-white/10 rounded text-gray-400"><BarChart3 size={16}/></button>
          <button className="p-1.5 hover:bg-white/10 rounded text-gray-400"><Activity size={16}/></button>
        </div>
        <button className="flex items-center gap-2 bg-[#1E1F25] hover:bg-[#2a2b33] px-3 py-1.5 rounded-lg text-sm text-gray-300 transition-colors border border-white/5">
          <span>1 Hour</span>
          <ChevronDown size={14} />
        </button>
      </div>
    </div>
  </div>
);

const SwapCard = () => {
  const [sellAmount, setSellAmount] = useState<string>("32.5");
  const [buyAmount, setBuyAmount] = useState<string>("6953.2");
  const rate = 213.9446; // Mock rate ETH to LINK

  // Simple handler to update buy amount when sell changes
  const handleSellChange = (val: string) => {
    setSellAmount(val);
    if (!isNaN(parseFloat(val))) {
      setBuyAmount((parseFloat(val) * rate).toFixed(1));
    } else {
      setBuyAmount("0.0");
    }
  };

  return (
    <div className="flex flex-col gap-6 mt-20">
      {/* Card Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex gap-6">
        </div>
       
      </div>

      {/* Main Form */}
      <div className="flex flex-col gap-2 relative">
        
        {/* Sell Section */}
        <div className="bg-[#18191D] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-gray-400 text-sm font-medium">You Sell</span>
            <span className="text-gray-500 text-xs">Balance: 45.8 NEAR</span>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <button className="flex items-center gap-2 bg-[#2C2D35] hover:bg-[#363742] pl-2 pr-3 py-1.5 rounded-full transition-colors group-hover:bg-[#363742]">
              <div className="w-6 h-6 rounded-full bg-[#627EEA] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 32 32" fill="white"><path d="M16 2L6 18.5L16 24.5L26 18.5L16 2Z" fillOpacity="0.6"/><path d="M16 2L16 24.5L26 18.5L16 2Z"/></svg>
              </div>
              <span className="font-semibold text-lg text-white">NEAR</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            <input 
              type="text" 
              value={sellAmount}
              onChange={(e) => handleSellChange(e.target.value)}
              className="bg-transparent text-right text-3xl md:text-4xl text-white font-light outline-none w-1/2 placeholder-gray-600"
              placeholder="0"
            />
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-gray-500 text-sm">Near</span>
            <span className="text-gray-500 text-sm">~ $ 50 542.2</span>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-[#18191D] p-1.5 rounded-full">
            <button className="w-10 h-10 bg-[#2C2D35] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#3C3D49] border border-white/5 shadow-lg transition-all active:rotate-180">
              <ArrowDownUp size={18} />
            </button>
          </div>
        </div>

        {/* Buy Section */}
        <div className="bg-[#18191D] rounded-3xl p-5 border border-white/5 hover:border-white/10 transition-colors group">
          <div className="flex justify-between items-start mb-3">
            <span className="text-gray-400 text-sm font-medium">You Buy</span>
            <span className="text-gray-500 text-xs">Balance: 0.00 USDC</span>
          </div>
          
          <div className="flex justify-between items-center mb-1">
            <button className="flex items-center gap-2 bg-[#2C2D35] hover:bg-[#363742] pl-2 pr-3 py-1.5 rounded-full transition-colors group-hover:bg-[#363742]">
              <div className="w-6 h-6 rounded-full bg-[#2A5ADA] flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"/></svg>
              </div>
              <span className="font-semibold text-lg text-white">USDC</span>
              <ChevronDown size={16} className="text-gray-400" />
            </button>
            <input 
              type="text" 
              readOnly
              value={buyAmount}
              className="bg-transparent text-right text-3xl md:text-4xl text-white font-light outline-none w-1/2 placeholder-gray-600 cursor-default"
              placeholder="0"
            />
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-gray-500 text-sm">Chain Link</span>
            <span className="text-[#FF5656] text-sm">~ $ 50 429.5 (-0.28%)</span>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-[#1E1F25] rounded-xl p-4 flex items-center justify-between border border-white/5 cursor-pointer hover:bg-[#25262d] transition-colors">
        <div className="flex items-center gap-2 text-[#E8CCA7] text-sm font-medium">
          <Info size={16} />
          <span>1 ETH = {rate.toFixed(3)} LINK <span className="text-gray-500 font-normal">(~$ 1 542.8)</span></span>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span>~$ 6.73</span>
          <ChevronDown size={14} />
        </div>
      </div>

      {/* Main Action */}
      <button className="w-full py-4 rounded-xl border border-[#FF7E56]/30 text-[#FF7E56] font-semibold text-lg hover:bg-[#FF7E56]/10 transition-all flex items-center justify-center gap-2 group">
        <Wallet className="w-5 h-5 group-hover:scale-110 transition-transform" />
        Connect Wallet
      </button>
    </div>
  );
};

// --- Mock Chart Component (SVG implementation for zero deps) ---


export default SwapWidget;
export { TradeInterface };