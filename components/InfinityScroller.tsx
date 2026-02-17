"use client";
import React from "react";

const InfinityScroller: React.FC = () => {
  const items = [
    "Fully Autonomous",
    "Multi-Chain Execution",
    "Monetize Your Strategies",
  ];

  return (
    <div className="w-full max-w-6xl py-8 md:py-12 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 rounded-2xl overflow-hidden border border-white/10 bg-white/[0.02]">
        {items.map((item) => (
          <div
            key={item}
            className="border border-white/10 -m-px px-6 py-7 md:py-8 text-center font-serif italic font-normal text-white text-2xl md:text-3xl"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfinityScroller;
