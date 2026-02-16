"use client";
import React from 'react';

const InfinityScroller: React.FC = () => {
  const items = [
    "100% Private",
    "Fully Autonomous",
    "Multi-Chain Execution",
    "Monetize Your Strategies"
  ];

  // Duplicate items for seamless loop
  const duplicatedItems = [...items, ...items];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll-infinity {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }
        .scroll-infinity {
          animation: scroll-infinity 30s linear infinite;
        }
      `}} />
      <div className="w-full overflow-hidden py-8 md:py-12 relative z-10">
        <div className="flex scroll-infinity">
          {duplicatedItems.map((item, index) => (
            <div
              key={index}
              className="flex-shrink-0 px-8 md:px-12 whitespace-nowrap font-serif italic font-normal text-white text-2xl md:text-3xl lg:text-4xl"
            >
              {item}
              <span className="mx-8 md:mx-12 text-white/30">•</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default InfinityScroller;
