"use client";
import React from 'react';

const Features: React.FC = () => {
  return (
    <section className="w-full max-w-7xl mx-auto px-6 mt-2 py-24 md:py-32 flex flex-col items-center">
      <h2 className="text-5xl md:text-6xl lg:text-[5rem] font-bold text-white mb-20 text-center tracking-tight leading-tight">
        Start on <span className="font-serif italic font-normal ml-2">Solid Ground</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-16 w-full max-w-6xl mb-24">
        <FeatureItem
            icon={<IconPerformance />}
            title="Fully Autonomous"
            description="Set once, let it trade, rebalance & learn from your data"
        />
        <FeatureItem
            icon={<IconIdentity />}
            title="Multi-Chain Support"
            description="Cross-chain execution via NEAR Intents, powered by your agent's wallet."
        />
        <FeatureItem
            icon={<IconReliability />}
            title="Monetize Your Strategies"
            description="Sell encrypted versions securely & earn passively."
        />
      </div>

     
    </section>
  );
};

const FeatureItem = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="flex flex-col items-start text-left">
    <div className="mb-6 h-12 w-12 flex items-center justify-start text-white">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
    <p className="text-[#9CA3AF] leading-relaxed text-base">
      {description}
    </p>
  </div>
);

// Custom SVG Icons matching the visual style

const IconPerformance = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="16" r="12" fill="currentColor" />
    <circle cx="12" cy="28" r="8" fill="currentColor" />
  </svg>
);

const IconIdentity = () => (
   <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
     <path fillRule="evenodd" clipRule="evenodd" d="M10 6H30V12H20C17.7909 12 16 13.7909 16 16V24C16 26.2091 17.7909 28 20 28H30V34H10V28H20C22.2091 28 24 26.2091 24 24V16C24 13.7909 22.2091 12 20 12H10V6Z" />
   </svg>
);

const IconReliability = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="20" cy="12" rx="8" ry="5" />
    <ellipse cx="20" cy="22" rx="12" ry="6" />
    <ellipse cx="20" cy="32" rx="16" ry="7" />
  </svg>
);

export default Features;